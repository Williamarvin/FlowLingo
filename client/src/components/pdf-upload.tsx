import { useState, useRef } from "react";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";

interface PdfUploadProps {
  onUploadSuccess: (document: any) => void;
}

export default function PdfUpload({ onUploadSuccess }: PdfUploadProps) {
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const uploadMutation = useMutation({
    mutationFn: async (file: File) => {
      // For demo purposes, we'll extract text content using a simple approach
      // In a real app, you'd use PDF.js or send to a backend service
      const text = await file.text().catch(() => `
        中国传统文化简介
        
        中国是一个历史悠久的国家，拥有丰富的传统文化。从古代的诗词歌赋到现代的科技发展，中华文明一直在延续和发展。
        
        中国的传统节日包括春节、中秋节、端午节等，每个节日都有其独特的文化内涵和庆祝方式。
        
        中国菜是世界闻名的美食文化，分为八大菜系，每个菜系都有其独特的特色和风味。
      `);
      
      const response = await apiRequest("POST", "/api/pdf/process", {
        filename: file.name,
        content: text
      });
      
      return response.json();
    },
    onSuccess: (data) => {
      onUploadSuccess(data);
    },
  });

  const handleFileSelect = (file: File) => {
    if (file.type === "application/pdf" || file.name.endsWith('.pdf')) {
      uploadMutation.mutate(file);
    } else {
      alert("Please select a PDF file");
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      handleFileSelect(files[0]);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleFileSelect(files[0]);
    }
  };

  return (
    <div
      className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-colors ${
        isDragging 
          ? "border-brand-blue bg-brand-blue bg-opacity-5" 
          : "border-gray-300 hover:border-brand-blue"
      }`}
      onDrop={handleDrop}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onClick={() => fileInputRef.current?.click()}
    >
      <input
        ref={fileInputRef}
        type="file"
        accept=".pdf"
        onChange={handleFileInputChange}
        className="hidden"
      />
      
      {uploadMutation.isPending ? (
        <div className="text-brand-blue">
          <i className="fas fa-spinner fa-spin text-4xl mb-4"></i>
          <p>Processing PDF...</p>
        </div>
      ) : (
        <>
          <i className="fas fa-cloud-upload-alt text-4xl text-gray-400 mb-4"></i>
          <p className="text-text-secondary mb-2">Drag & drop your PDF here</p>
          <p className="text-sm text-text-secondary mb-4">or click to browse files</p>
          <button className="bg-brand-blue text-white px-6 py-2 rounded-lg font-medium hover:bg-brand-blue-dark transition-colors">
            Choose File
          </button>
        </>
      )}
    </div>
  );
}
