import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { speakChinese } from "@/services/openai";
import TranslationPopup from "./translation-popup";

interface HighlightableTextProps {
  text: string;
  onSaveWord?: (word: any) => void;
}

export default function HighlightableText({ text, onSaveWord }: HighlightableTextProps) {
  const [selectedText, setSelectedText] = useState<string>("");
  const [showPopup, setShowPopup] = useState(false);
  const [translation, setTranslation] = useState<any>(null);
  const [isReadingAll, setIsReadingAll] = useState(false);
  const [currentReadingIndex, setCurrentReadingIndex] = useState(-1);

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

  const readAllText = () => {
    if (isReadingAll) {
      // Stop reading
      speechSynthesis.cancel();
      setIsReadingAll(false);
      setCurrentReadingIndex(-1);
      return;
    }

    const segments = segmentTextForTranslation(text).filter(segment => 
      segment.trim() && !/[。！？，、；：""''（）《》【】\s]/.test(segment)
    );
    
    if (segments.length === 0) return;

    setIsReadingAll(true);
    setCurrentReadingIndex(0);

    const readSegment = (index: number) => {
      if (index >= segments.length) {
        setIsReadingAll(false);
        setCurrentReadingIndex(-1);
        return;
      }

      setCurrentReadingIndex(index);
      const segment = segments[index];

      if ('speechSynthesis' in window) {
        const utterance = new SpeechSynthesisUtterance(segment);
        utterance.lang = 'zh-CN';
        utterance.rate = 0.7;
        utterance.pitch = 1.0;
        utterance.volume = 1.0;

        utterance.onend = () => {
          setTimeout(() => readSegment(index + 1), 500); // 500ms pause between words
        };

        utterance.onerror = () => {
          setIsReadingAll(false);
          setCurrentReadingIndex(-1);
        };

        speechSynthesis.speak(utterance);
      }
    };

    readSegment(0);
  };

  const renderHighlightableTextWithReading = () => {
    const segments = segmentTextForTranslation(text);
    let segmentIndex = 0;
    
    return segments.map((segment, index) => {
      if (segment.trim() === '') return segment; // Preserve whitespace
      
      const isPunctuation = /[。！？，、；：""''（）《》【】\s]/.test(segment);
      const isCurrentlyReading = !isPunctuation && isReadingAll && segmentIndex === currentReadingIndex;
      
      if (!isPunctuation) segmentIndex++;
      
      return (
        <span
          key={index}
          className={`highlightable cursor-pointer transition-all duration-200 px-1 rounded ${
            isCurrentlyReading 
              ? 'bg-brand-blue text-white shadow-md scale-105' 
              : 'hover:bg-brand-blue hover:bg-opacity-10'
          }`}
          onClick={() => {
            if (!isPunctuation) {
              setSelectedText(segment);
              translateMutation.mutate(segment);
            }
          }}
        >
          {segment}
        </span>
      );
    });
  };

  return (
    <>
      <div className="mb-4">
        <button
          onClick={readAllText}
          className={`px-6 py-3 rounded-xl font-medium transition-all duration-200 shadow-md hover:shadow-lg flex items-center space-x-2 ${
            isReadingAll
              ? 'bg-red-500 hover:bg-red-600 text-white'
              : 'bg-gradient-to-r from-brand-blue to-brand-blue-light hover:from-brand-blue-dark hover:to-brand-blue text-white'
          }`}
        >
          <i className={`fas ${isReadingAll ? 'fa-stop' : 'fa-volume-up'} text-lg`}></i>
          <span>{isReadingAll ? 'Stop Reading' : 'Read All Chinese'}</span>
        </button>
      </div>
      
      <div 
        className="text-xl leading-relaxed text-text-primary select-text"
        onMouseUp={handleTextSelection}
      >
        {renderHighlightableTextWithReading()}
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
