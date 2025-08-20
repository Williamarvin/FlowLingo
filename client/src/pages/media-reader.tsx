import { useState, useRef, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { FileUp, PlayCircle, Download, BookOpen, Image, FileText, Video, Music, Trash2, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { ObjectUploader } from "@/components/ObjectUploader";
import { apiRequest } from "@/lib/queryClient";
import type { MediaDocument } from "@shared/schema";
import type { UploadResult } from "@uppy/core";
import Sidebar from "@/components/sidebar";

// File type configurations with support for multiple formats
const FILE_TYPES = {
  pdf: { icon: FileText, color: "bg-red-500", accepts: ["application/pdf"] },
  image: { icon: Image, color: "bg-blue-500", accepts: ["image/jpeg", "image/png", "image/gif", "image/webp", "image/svg+xml"] },
  video: { icon: Video, color: "bg-purple-500", accepts: ["video/mp4", "video/webm", "video/ogg", "video/avi", "video/mov"] },
  audio: { icon: Music, color: "bg-green-500", accepts: ["audio/mp3", "audio/wav", "audio/ogg", "audio/m4a", "audio/flac"] },
  document: { icon: BookOpen, color: "bg-orange-500", accepts: ["application/msword", "application/vnd.openxmlformats-officedocument.wordprocessingml.document", "text/plain", "application/rtf"] }
};

function getFileTypeInfo(mimeType: string) {
  for (const [type, config] of Object.entries(FILE_TYPES)) {
    if (config.accepts.includes(mimeType)) {
      return { type, ...config };
    }
  }
  return { type: "document", ...FILE_TYPES.document };
}

function formatFileSize(bytes: number): string {
  if (bytes === 0) return "0 Bytes";
  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
}

export default function MediaReader() {
  const [selectedDocument, setSelectedDocument] = useState<MediaDocument | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Fetch media documents
  const { data: documents = [], isLoading } = useQuery<MediaDocument[]>({
    queryKey: ["/api/media"],
  });

  // Create media document mutation
  const createDocumentMutation = useMutation({
    mutationFn: async (documentData: {
      filename: string;
      fileType: string;
      fileSize: number;
      fileUrl: string;
      mimeType: string;
      content?: string;
      processedContent?: any;
    }) => {
      const response = await fetch("/api/media", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(documentData),
      });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/media"] });
      toast({
        title: "Success",
        description: "File uploaded successfully!",
      });
    },
    onError: (error) => {
      console.error("Upload error:", error);
      toast({
        title: "Upload failed",
        description: "Failed to save file information",
        variant: "destructive",
      });
    },
  });

  // Delete document mutation
  const deleteDocumentMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await fetch(`/api/media/${id}`, {
        method: "DELETE",
      });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/media"] });
      setSelectedDocument(null);
      toast({
        title: "Success",
        description: "File deleted successfully!",
      });
    },
    onError: (error) => {
      console.error("Delete error:", error);
      toast({
        title: "Delete failed",
        description: "Failed to delete file",
        variant: "destructive",
      });
    },
  });

  const handleFileUpload = useCallback(
    async (result: UploadResult<Record<string, unknown>, Record<string, unknown>>) => {
      if (!result.successful || result.successful.length === 0) {
        toast({
          title: "Upload failed",
          description: "No files were uploaded successfully",
          variant: "destructive",
        });
        return;
      }

      setIsProcessing(true);
      const uploadedFile = result.successful[0];
      
      try {
        // Extract file information
        const filename = uploadedFile.name || "unknown";
        const fileSize = uploadedFile.size || 0;
        const mimeType = uploadedFile.type || "application/octet-stream";
        const uploadURL = uploadedFile.uploadURL as string;
        
        // Determine file type
        const fileTypeInfo = getFileTypeInfo(mimeType);
        
        // For certain file types, we can extract text or metadata
        let content = "";
        let processedContent = {};
        
        if (fileTypeInfo.type === "pdf") {
          // PDF text extraction would go here
          content = "PDF content extraction not yet implemented";
        } else if (fileTypeInfo.type === "image") {
          // Image metadata extraction
          processedContent = { width: 0, height: 0, format: mimeType };
        } else if (fileTypeInfo.type === "video" || fileTypeInfo.type === "audio") {
          // Media metadata extraction
          processedContent = { duration: 0, format: mimeType };
        }

        // Save document information
        await createDocumentMutation.mutateAsync({
          filename,
          fileType: fileTypeInfo.type,
          fileSize,
          fileUrl: uploadURL,
          mimeType,
          content,
          processedContent,
        });

      } catch (error) {
        console.error("Processing error:", error);
        toast({
          title: "Processing failed",
          description: "Failed to process uploaded file",
          variant: "destructive",
        });
      } finally {
        setIsProcessing(false);
      }
    },
    [createDocumentMutation, toast]
  );

  const getUploadParameters = async () => {
    const response = await fetch("/api/media/upload", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
    });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const data = await response.json();
    return {
      method: "PUT" as const,
      url: data.uploadURL,
    };
  };

  const renderFilePreview = (document: MediaDocument) => {
    const fileTypeInfo = getFileTypeInfo(document.mimeType);
    const Icon = fileTypeInfo.icon;

    switch (fileTypeInfo.type) {
      case "image":
        return (
          <div className="space-y-4">
            <img 
              src={document.fileUrl || ""} 
              alt={document.filename}
              className="max-w-full h-auto rounded-lg border"
              onError={(e) => {
                e.currentTarget.style.display = 'none';
              }}
            />
            <div className="text-sm text-muted-foreground">
              <p><strong>File:</strong> {document.filename}</p>
              <p><strong>Size:</strong> {formatFileSize(document.fileSize || 0)}</p>
              <p><strong>Type:</strong> {document.mimeType}</p>
            </div>
          </div>
        );

      case "video":
        return (
          <div className="space-y-4">
            <video 
              controls 
              className="w-full rounded-lg border"
              src={document.fileUrl || ""}
            >
              Your browser does not support the video tag.
            </video>
            <div className="text-sm text-muted-foreground">
              <p><strong>File:</strong> {document.filename}</p>
              <p><strong>Size:</strong> {formatFileSize(document.fileSize || 0)}</p>
              <p><strong>Type:</strong> {document.mimeType}</p>
            </div>
          </div>
        );

      case "audio":
        return (
          <div className="space-y-4">
            <audio 
              controls 
              className="w-full"
              src={document.fileUrl || ""}
            >
              Your browser does not support the audio tag.
            </audio>
            <div className="text-sm text-muted-foreground">
              <p><strong>File:</strong> {document.filename}</p>
              <p><strong>Size:</strong> {formatFileSize(document.fileSize || 0)}</p>
              <p><strong>Type:</strong> {document.mimeType}</p>
            </div>
          </div>
        );

      case "pdf":
        return (
          <div className="space-y-4">
            <div className="p-6 border-2 border-dashed rounded-lg text-center">
              <Icon className="w-12 h-12 mx-auto mb-2 text-muted-foreground" />
              <p className="text-sm text-muted-foreground mb-4">PDF Preview</p>
              <Button variant="outline" asChild>
                <a href={document.fileUrl || ""} target="_blank" rel="noopener noreferrer">
                  <Download className="w-4 h-4 mr-2" />
                  Open PDF
                </a>
              </Button>
            </div>
            {document.content && (
              <div className="space-y-2">
                <h4 className="font-medium">Extracted Text</h4>
                <div className="max-h-64 overflow-y-auto p-3 bg-muted rounded-lg text-sm">
                  {document.content}
                </div>
              </div>
            )}
            <div className="text-sm text-muted-foreground">
              <p><strong>File:</strong> {document.filename}</p>
              <p><strong>Size:</strong> {formatFileSize(document.fileSize || 0)}</p>
              <p><strong>Type:</strong> {document.mimeType}</p>
            </div>
          </div>
        );

      default:
        return (
          <div className="space-y-4">
            <div className="p-6 border-2 border-dashed rounded-lg text-center">
              <Icon className="w-12 h-12 mx-auto mb-2 text-muted-foreground" />
              <p className="text-sm text-muted-foreground mb-4">Document Preview</p>
              <Button variant="outline" asChild>
                <a href={document.fileUrl || ""} target="_blank" rel="noopener noreferrer">
                  <Download className="w-4 h-4 mr-2" />
                  Download File
                </a>
              </Button>
            </div>
            {document.content && (
              <div className="space-y-2">
                <h4 className="font-medium">Extracted Text</h4>
                <div className="max-h-64 overflow-y-auto p-3 bg-muted rounded-lg text-sm">
                  {document.content}
                </div>
              </div>
            )}
            <div className="text-sm text-muted-foreground">
              <p><strong>File:</strong> {document.filename}</p>
              <p><strong>Size:</strong> {formatFileSize(document.fileSize || 0)}</p>
              <p><strong>Type:</strong> {document.mimeType}</p>
            </div>
          </div>
        );
    }
  };

  if (isLoading) {
    return (
      <div className="container mx-auto p-6">
        <div className="text-center">Loading your media files...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <Sidebar currentPage="/media-reader" />
      <div className="ml-64 p-8">
        <div className="container mx-auto max-w-7xl">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-foreground mb-2">Media Reader</h1>
            <p className="text-muted-foreground">
              Upload and manage your learning materials - PDFs, images, videos, audio files, and documents.
            </p>
          </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* File List */}
        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileUp className="w-5 h-5" />
                Your Files
              </CardTitle>
              <CardDescription>
                Upload new files or select existing ones to view
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Upload Button */}
              <ObjectUploader
                maxNumberOfFiles={1}
                maxFileSize={52428800} // 50MB
                onGetUploadParameters={getUploadParameters}
                onComplete={handleFileUpload}
                buttonClassName="w-full"
              >
                <Upload className="w-4 h-4 mr-2" />
                Upload File
              </ObjectUploader>

              {isProcessing && (
                <div className="text-center text-sm text-muted-foreground">
                  Processing file...
                </div>
              )}

              {/* File List */}
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {documents.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    No files uploaded yet
                  </p>
                ) : (
                  documents.map((doc) => {
                    const fileTypeInfo = getFileTypeInfo(doc.mimeType);
                    const Icon = fileTypeInfo.icon;
                    const isSelected = selectedDocument?.id === doc.id;

                    return (
                      <div
                        key={doc.id}
                        className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                          isSelected
                            ? "border-primary bg-primary/5"
                            : "border-border hover:border-primary/50 hover:bg-muted/50"
                        }`}
                        onClick={() => setSelectedDocument(doc)}
                      >
                        <div className="flex items-start gap-3">
                          <div className={`p-2 rounded ${fileTypeInfo.color} text-white`}>
                            <Icon className="w-4 h-4" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate">
                              {doc.filename}
                            </p>
                            <div className="flex items-center gap-2 mt-1">
                              <Badge variant="secondary" className="text-xs">
                                {fileTypeInfo.type}
                              </Badge>
                              <span className="text-xs text-muted-foreground">
                                {formatFileSize(doc.fileSize || 0)}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* File Preview */}
        <div className="lg:col-span-2">
          <Card className="h-full">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>
                  {selectedDocument ? "File Preview" : "Select a File"}
                </CardTitle>
                {selectedDocument && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => deleteDocumentMutation.mutate(selectedDocument.id)}
                    disabled={deleteDocumentMutation.isPending}
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    Delete
                  </Button>
                )}
              </div>
              {selectedDocument && (
                <CardDescription>
                  {selectedDocument.filename}
                </CardDescription>
              )}
            </CardHeader>
            <CardContent>
              {selectedDocument ? (
                renderFilePreview(selectedDocument)
              ) : (
                <div className="text-center py-12">
                  <FileUp className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                  <p className="text-muted-foreground">
                    Select a file from the list to preview it here
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
        </div>
      </div>
    </div>
  );
}