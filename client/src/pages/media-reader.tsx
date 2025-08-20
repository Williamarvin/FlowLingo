import { useState, useRef, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { FileUp, PlayCircle, Download, BookOpen, Image, FileText, Video, Music, Trash2, Upload, Volume2, Copy, Bookmark } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import type { MediaDocument } from "@shared/schema";
import Sidebar from "@/components/sidebar";
import HighlightableText from "@/components/highlightable-text";
import { audioManager } from "@/lib/audioManager";

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
      segments?: any[];
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

  // Direct file upload function - replaces Uppy-based upload
  const uploadFile = async (file: File) => {
    try {
      console.log("Uploading file directly:", file.name, "Type:", file.type, "Size:", file.size);
      
      // Create FormData and append the file
      const formData = new FormData();
      formData.append('file', file);
      
      const response = await fetch("/api/media/upload-direct", {
        method: "POST",
        body: formData,
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error("Direct upload failed:", response.status, errorText);
        throw new Error(`Failed to upload file: ${response.status}`);
      }
      
      const data = await response.json();
      console.log("File uploaded successfully:", data);
      
      return {
        fileUrl: data.fileUrl,
        content: data.content || ""
      };
    } catch (error) {
      console.error("Error uploading file:", error);
      throw error;
    }
  };

  // Handler for saving words to vocabulary
  const handleSaveWord = useCallback(async (wordData: any) => {
    try {
      await apiRequest('/api/vocabulary', 'POST', {
        word: wordData.word || wordData.chinese || wordData.text,
        pinyin: wordData.pinyin || '',
        meaning: wordData.meaning || wordData.english || '',
        hskLevel: 1,
        frequency: 0,
        nextReview: new Date().toISOString(),
        intervalDays: 1,
        easeFactor: 2.5,
        repetitions: 0
      });
      
      const word = wordData.word || wordData.chinese || wordData.text;
      toast({
        title: "Word saved!",
        description: `Added "${word}" to your vocabulary`,
      });
    } catch (error) {
      console.error("Failed to save word:", error);
      toast({
        title: "Failed to save word",
        description: "Please try again",
        variant: "destructive",
      });
    }
  }, [toast]);

  // Text-to-speech handler using OpenAI TTS
  const handleSpeak = async (text: string) => {
    try {
      // Use audioManager with normal speed for document reading
      await audioManager.playTTS(text, 0.8);
    } catch (error) {
      console.error('TTS error:', error);
    }
  };

  const renderFilePreview = (document: MediaDocument) => {
    const fileTypeInfo = getFileTypeInfo(document.mimeType);
    const Icon = fileTypeInfo.icon;
    const isImage = fileTypeInfo.type === "image" || document.mimeType?.startsWith("image/");

    // If document has text content, display it with HighlightableText component
    if (document.content && document.content.trim()) {
      return (
        <div className="space-y-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Icon className="w-5 h-5 text-muted-foreground" />
              <span className="text-sm font-medium">{document.filename}</span>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  navigator.clipboard.writeText(document.content || "");
                  toast({
                    title: "Copied!",
                    description: "Text copied to clipboard",
                  });
                }}
                title="Copy Text"
              >
                <Copy className="w-4 h-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  const bookmarks = JSON.parse(localStorage.getItem('mediaBookmarks') || '[]');
                  bookmarks.push({
                    filename: document.filename,
                    content: document.content,
                    date: new Date().toISOString()
                  });
                  localStorage.setItem('mediaBookmarks', JSON.stringify(bookmarks));
                  toast({
                    title: "Bookmarked!",
                    description: "Added to your bookmarks",
                  });
                }}
                title="Bookmark"
              >
                <Bookmark className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {/* For OCR-processed images, show a note about extracted text */}
          {isImage && document.content && (
            <div className="mb-4 p-3 bg-blue-50 dark:bg-blue-950 rounded-lg">
              <p className="text-sm text-blue-700 dark:text-blue-300 font-medium">
                🔍 OCR Extracted Chinese Text from {document.filename} (click to translate):
              </p>
            </div>
          )}

          <div className="bg-background rounded-lg p-6 border">
            <HighlightableText
              text={document.content}
              onSaveWord={handleSaveWord}
            />
          </div>

          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <span><i className="fas fa-font mr-1"></i>Characters: {document.content.length}</span>
            <span><i className="fas fa-clock mr-1"></i>Reading time: {Math.ceil(document.content.length / 300)} min</span>
            <span><i className="fas fa-file mr-1"></i>Size: {formatFileSize(document.fileSize || 0)}</span>
          </div>
        </div>
      );
    }

    // Original file type specific rendering for files without text content
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

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Main Reader Area - Now Primary */}
        <div className="lg:col-span-3 order-2 lg:order-1">
          <Card className="h-full min-h-[600px]">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>
                  {selectedDocument ? "Interactive Reader" : "Chinese Text Reader"}
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
                  Reading: {selectedDocument.filename}
                </CardDescription>
              )}
            </CardHeader>
            <CardContent>
              {selectedDocument ? (
                renderFilePreview(selectedDocument)
              ) : (
                <div className="text-center py-12">
                  <FileUp className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                  <p className="text-muted-foreground mb-4">
                    Upload text files or images with Chinese content
                  </p>
                  <p className="text-sm text-muted-foreground mb-6">
                    Click on any Chinese phrase to see translation and pinyin
                  </p>
                  <div className="mt-6 p-4 bg-muted rounded-lg max-w-md mx-auto">
                    <p className="text-xs mb-2 text-muted-foreground">💡 How it works:</p>
                    <p className="text-xs text-muted-foreground mb-2">1. Upload .txt files or images (.jpg, .png) with Chinese text</p>
                    <p className="text-xs text-muted-foreground mb-2">2. Images are scanned with OCR to extract Chinese characters</p>
                    <p className="text-xs text-muted-foreground mb-2">3. Click on any Chinese phrase to translate</p>
                    <p className="text-xs text-muted-foreground">4. Listen to pronunciation and save vocabulary</p>
                    <div className="mt-3 pt-3 border-t">
                      <p className="text-xs font-mono text-muted-foreground">📄 Try: sample-chinese-text.txt</p>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* File List Sidebar */}
        <div className="lg:col-span-1 order-1 lg:order-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileUp className="w-5 h-5" />
                Your Files
              </CardTitle>
              <CardDescription>
                Upload text files or images with Chinese content
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Upload Button */}
              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept=".pdf,.jpg,.jpeg,.png,.gif,.webp,.svg,.mp4,.webm,.ogg,.avi,.mov,.mp3,.wav,.m4a,.flac,.doc,.docx,.txt,.rtf"
                onChange={async (e) => {
                  const files = e.target.files;
                  if (!files || files.length === 0) return;
                  
                  setIsProcessing(true);
                  
                  for (const file of Array.from(files)) {
                    try {
                      console.log("Processing file:", file.name, "Type:", file.type);
                      
                      // Upload file directly
                      const uploadResult = await uploadFile(file);
                      console.log("Upload result:", uploadResult);
                      
                      // Extract text content based on file type
                      let textContent = "";
                      if (file.type === "text/plain" || file.name.endsWith(".txt")) {
                        textContent = await file.text();
                        console.log("Extracted text content:", textContent.substring(0, 100) + "...");
                      } else if (file.type.startsWith("image/") || /\.(jpg|jpeg|png|gif|webp)$/i.test(file.name)) {
                        // Extract Chinese text from images using OCR
                        console.log("Processing image with OCR...");
                        toast({
                          title: "Scanning image...",
                          description: "Extracting Chinese text from image",
                        });
                        
                        try {
                          const ocrResponse = await fetch("/api/ocr/extract-chinese", {
                            method: "POST",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({ imageUrl: uploadResult.fileUrl })
                          });
                          
                          if (ocrResponse.ok) {
                            const ocrData = await ocrResponse.json();
                            if (ocrData.hasChineseText) {
                              textContent = ocrData.extractedText;
                              console.log("OCR extracted text:", textContent.substring(0, 100) + "...");
                              toast({
                                title: "Chinese text detected!",
                                description: "Text extracted successfully from image",
                              });
                            } else {
                              toast({
                                title: "No Chinese text found",
                                description: "Try uploading an image with Chinese characters",
                                variant: "default",
                              });
                            }
                          }
                        } catch (ocrError) {
                          console.error("OCR processing failed:", ocrError);
                          toast({
                            title: "OCR processing failed",
                            description: "Could not extract text from image",
                            variant: "destructive",
                          });
                        }
                      } else if (file.type === "application/pdf" || file.name.endsWith(".pdf")) {
                        // For PDF files, we'd need a proper PDF parser
                        textContent = "PDF content will be extracted here. Upload a text file (.txt) or image with Chinese content for best results.";
                      }
                      
                      // Create media document
                      await createDocumentMutation.mutateAsync({
                        filename: file.name,
                        fileType: getFileTypeInfo(file.type).type,
                        fileSize: file.size,
                        fileUrl: uploadResult.fileUrl,
                        mimeType: file.type,
                        content: textContent || uploadResult.content || "",
                        segments: [],
                        processedContent: {}
                      });
                      
                      toast({
                        title: "Success",
                        description: `${file.name} uploaded successfully!`,
                      });
                    } catch (error) {
                      console.error("Error processing file:", error);
                      toast({
                        title: "Upload failed",
                        description: `Failed to upload ${file.name}`,
                        variant: "destructive",
                      });
                    }
                  }
                  
                  setIsProcessing(false);
                  if (fileInputRef.current) {
                    fileInputRef.current.value = '';
                  }
                }}
                className="hidden"
              />
              <Button
                onClick={() => fileInputRef.current?.click()}
                className="w-full"
                disabled={isProcessing}
              >
                <Upload className="w-4 h-4 mr-2" />
                {isProcessing ? "Uploading..." : "Upload File"}
              </Button>

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
                        onClick={() => {
                          console.log("Selected document:", doc);
                          console.log("Document content:", doc.content?.substring(0, 100));
                          setSelectedDocument(doc);
                        }}
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
      </div>
        </div>
      </div>
    </div>
  );
}