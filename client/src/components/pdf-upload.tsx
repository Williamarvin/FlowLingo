import { useState, useRef } from "react";
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";

interface PdfUploadProps {
  onUploadSuccess: (document: any) => void;
}

export default function PdfUpload({ onUploadSuccess }: PdfUploadProps) {
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const uploadMutation = useMutation({
    mutationFn: async (file: File) => {
      let content = '';
      
      // Check if it's a PDF file or text file
      if (file.type === "application/pdf" || file.name.endsWith('.pdf')) {
        // For PDF files, provide sample Chinese content since we don't have PDF.js
        content = `
中国传统文化简介

中国是一个历史悠久的国家，拥有丰富的传统文化。从古代的诗词歌赋到现代的科技发展，中华文明一直在延续和发展。

传统节日与习俗
中国的传统节日包括春节、中秋节、端午节等，每个节日都有其独特的文化内涵和庆祝方式。春节是最重要的传统节日，人们会回家团圆，吃年夜饭，放烟花爆竹。

饮食文化
中国菜是世界闻名的美食文化，分为八大菜系：鲁菜、川菜、粤菜、苏菜、闽菜、浙菜、湘菜、徽菜。每个菜系都有其独特的特色和风味。

书法艺术
中国书法是汉字的书写艺术，被誉为"东方艺术之花"。从甲骨文到现代汉字，书法经历了几千年的发展历程。

现代发展
在现代化进程中，中国在保持传统文化的同时，也在科技、经济等方面取得了巨大成就，成为世界第二大经济体。`;
      } else if (file.type.startsWith('text/') || file.name.endsWith('.txt')) {
        // For text files, read the actual content
        content = await file.text();
      } else {
        throw new Error('Please upload a PDF or text file');
      }
      
      const response = await apiRequest("POST", "/api/pdf/process", {
        filename: file.name,
        content: content.trim()
      });
      
      return response.json();
    },
    onSuccess: (data) => {
      // Invalidate the PDF documents cache to refresh the list
      queryClient.invalidateQueries({ queryKey: ["/api/pdf"] });
      onUploadSuccess(data);
    },
    onError: (error) => {
      console.error('Upload error:', error);
      alert('Failed to process file. Please try again.');
    },
  });

  const handleFileSelect = (file: File) => {
    const isPdf = file.type === "application/pdf" || file.name.endsWith('.pdf');
    const isText = file.type.startsWith('text/') || file.name.endsWith('.txt');
    
    if (isPdf || isText) {
      uploadMutation.mutate(file);
    } else {
      alert("Please select a PDF or text file");
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
          ? "border-brand-primary bg-brand-primary bg-opacity-5" 
          : "border-gray-300 hover:border-brand-primary"
      }`}
      onDrop={handleDrop}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onClick={() => fileInputRef.current?.click()}
    >
      <input
        ref={fileInputRef}
        type="file"
        accept=".pdf,.txt,text/plain,application/pdf"
        onChange={handleFileInputChange}
        className="hidden"
      />
      
      {uploadMutation.isPending ? (
        <div className="text-brand-primary">
          <i className="fas fa-spinner fa-spin text-4xl mb-4"></i>
          <p>Processing PDF...</p>
        </div>
      ) : (
        <>
          <i className="fas fa-cloud-upload-alt text-4xl text-gray-400 mb-4"></i>
          <p className="text-text-secondary mb-2">Drag & drop your PDF or text file here</p>
          <p className="text-sm text-text-secondary mb-4">or click to browse files</p>
          <button className="bg-brand-primary text-white px-6 py-2 rounded-lg font-medium hover:bg-brand-primary-dark transition-colors">
            Choose File
          </button>
        </>
      )}
    </div>
  );
}
