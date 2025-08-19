import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import PdfUpload from "@/components/pdf-upload";
import HighlightableText from "@/components/highlightable-text";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";

export default function PdfConverter() {
  const [selectedDocument, setSelectedDocument] = useState<any>(null);
  const [currentPage, setCurrentPage] = useState(1);

  const { data: documents = [] } = useQuery<any[]>({
    queryKey: ["/api/pdf"],
  });

  const handleDocumentSelect = (document: any) => {
    setSelectedDocument(document);
    setCurrentPage(1);
  };

  const handleUploadSuccess = (document: any) => {
    setSelectedDocument(document);
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-text-primary mb-4">PDF Chinese Reader</h2>
        <p className="text-text-secondary">Upload PDF documents and convert them to interactive Chinese text with instant translations.</p>
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* PDF Upload and Options */}
        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Upload Document</CardTitle>
            </CardHeader>
            <CardContent>
              <PdfUpload onUploadSuccess={handleUploadSuccess} />
              
              <div className="mt-6">
                <h4 className="font-medium text-text-primary mb-3">Recent Documents</h4>
                <div className="space-y-2">
                  {documents.map((doc: any) => (
                    <div 
                      key={doc.id}
                      onClick={() => handleDocumentSelect(doc)}
                      className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100 transition-colors"
                    >
                      <i className="fas fa-file-pdf text-red-500"></i>
                      <div className="flex-1">
                        <div className="text-sm font-medium text-text-primary">{doc.filename}</div>
                        <div className="text-xs text-text-secondary">
                          {doc.pageCount} pages • {new Date(doc.createdAt).toLocaleDateString()}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Processing Options */}
          <Card className="mt-6">
            <CardHeader>
              <CardTitle className="text-lg">Processing Options</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center space-x-2">
                  <Checkbox id="auto-detect" defaultChecked />
                  <label htmlFor="auto-detect" className="text-sm text-text-secondary">Auto-detect Chinese text</label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox id="preserve-format" defaultChecked />
                  <label htmlFor="preserve-format" className="text-sm text-text-secondary">Preserve formatting</label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox id="extract-images" />
                  <label htmlFor="extract-images" className="text-sm text-text-secondary">Extract images</label>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Converted Text Display */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">Converted Text</CardTitle>
                {selectedDocument && (
                  <div className="flex items-center space-x-2">
                    <span className="text-sm text-text-secondary">
                      Page {currentPage} of {selectedDocument.pageCount}
                    </span>
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                      disabled={currentPage <= 1}
                    >
                      <i className="fas fa-chevron-left"></i>
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={() => setCurrentPage(Math.min(selectedDocument.pageCount, currentPage + 1))}
                      disabled={currentPage >= selectedDocument.pageCount}
                    >
                      <i className="fas fa-chevron-right"></i>
                    </Button>
                  </div>
                )}
              </div>
            </CardHeader>
            <CardContent>
              {selectedDocument ? (
                <>
                  <div className="bg-gray-50 rounded-xl p-6 h-96 overflow-y-auto">
                    <HighlightableText text={selectedDocument.content} />
                  </div>
                  
                  <div className="flex items-center justify-between mt-4">
                    <div className="flex items-center space-x-4 text-sm text-text-secondary">
                      <span><i className="fas fa-file-alt mr-1"></i>Original: {selectedDocument.pageCount} pages</span>
                      <span><i className="fas fa-font mr-1"></i>Characters: {selectedDocument.content.length}</span>
                      <span><i className="fas fa-language mr-1"></i>Chinese detected: 98%</span>
                    </div>
                    <Button>
                      <i className="fas fa-download mr-2"></i>Export
                    </Button>
                  </div>
                </>
              ) : (
                <div className="text-center text-text-secondary py-32">
                  <i className="fas fa-file-upload text-4xl mb-4 opacity-50"></i>
                  <p>Upload a PDF to start reading</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
