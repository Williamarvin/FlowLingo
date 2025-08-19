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

  const renderHighlightableText = () => {
    return text.split('').map((char, index) => {
      if (char.trim() === '') return char; // Preserve whitespace
      
      return (
        <span
          key={index}
          className="highlightable cursor-pointer hover:bg-brand-blue hover:bg-opacity-10 transition-colors px-1 rounded"
          onClick={() => {
            setSelectedText(char);
            translateMutation.mutate(char);
          }}
        >
          {char}
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
