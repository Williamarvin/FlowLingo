import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import TranslationPopup from "./translation-popup";

interface HighlightableTextProps {
  text: string;
  onSaveWord?: (word: any) => void;
}

export default function HighlightableText({ text, onSaveWord }: HighlightableTextProps) {
  const [selectedText, setSelectedText] = useState<string>("");
  const [showPopup, setShowPopup] = useState(false);
  const [translation, setTranslation] = useState<any>(null);

  const translateMutation = useMutation({
    mutationFn: async (text: string) => {
      const response = await apiRequest("POST", "/api/translate", { text });
      return response.json();
    },
    onSuccess: (data) => {
      setTranslation(data);
      setShowPopup(true);
    },
  });

  const handleTextSelection = () => {
    const selection = window.getSelection();
    const selected = selection?.toString().trim();
    
    if (selected && selected.length > 0) {
      setSelectedText(selected);
      translateMutation.mutate(selected);
    }
  };

  const segmentTextForTranslation = (text: string) => {
    const segments = [];
    const chars = text.split('');
    let currentPhrase = '';
    
    for (let i = 0; i < chars.length; i++) {
      const char = chars[i];
      
      // Check if character is punctuation or whitespace
      if (/[。！？，、；：""''（）《》【】\s]/.test(char)) {
        if (currentPhrase.trim()) {
          segments.push(currentPhrase.trim());
        }
        if (char.trim()) {
          segments.push(char);
        }
        currentPhrase = '';
      } else {
        currentPhrase += char;
        
        // Break into meaningful 2-3 character phrases
        if (currentPhrase.length === 2) {
          // Most Chinese words are 2 characters (你好, 朋友, 学习, etc.)
          segments.push(currentPhrase.trim());
          currentPhrase = '';
        } else if (currentPhrase.length === 3) {
          // Some compounds are 3 characters (电脑, 学生, 老师, etc.)
          segments.push(currentPhrase.trim());
          currentPhrase = '';
        }
      }
    }
    
    if (currentPhrase.trim()) {
      segments.push(currentPhrase.trim());
    }
    
    return segments;
  };

  const renderHighlightableText = () => {
    const segments = segmentTextForTranslation(text);
    
    return segments.map((segment, index) => {
      if (segment.trim() === '') return segment; // Preserve whitespace
      
      return (
        <span
          key={index}
          className="highlightable cursor-pointer hover:bg-brand-blue hover:bg-opacity-10 transition-colors px-1 rounded"
          onClick={() => {
            setSelectedText(segment);
            translateMutation.mutate(segment);
          }}
        >
          {segment}
        </span>
      );
    });
  };

  return (
    <>
      <div 
        className="text-xl leading-relaxed text-text-primary select-text"
        onMouseUp={handleTextSelection}
      >
        {renderHighlightableText()}
      </div>
      
      <TranslationPopup
        isOpen={showPopup}
        onClose={() => setShowPopup(false)}
        translation={translation}
        onSaveWord={onSaveWord}
      />
    </>
  );
}
