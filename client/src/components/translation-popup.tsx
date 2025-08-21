import { useEffect, useState } from "react";
import { audioManager } from "@/lib/audioManager";

interface TranslationData {
  character: string;
  pinyin: string;
  english: string;
}

interface TranslationPopupProps {
  isOpen: boolean;
  onClose: () => void;
  translation: TranslationData | null;
  onSaveWord?: (word: TranslationData) => void;
}

export default function TranslationPopup({ isOpen, onClose, translation, onSaveWord }: TranslationPopupProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen, onClose]);

  if (!isOpen || !translation) return null;

  const handleSpeak = async () => {
    if (!translation) return;
    
    setIsPlaying(true);
    
    try {
      // Use audioManager with slower speed (0.6) for highlighted text
      await audioManager.playTTS(translation.character, 0.6);
      setIsPlaying(false);
    } catch (error) {
      console.error('TTS error:', error);
      setIsPlaying(false);
    }
  };

  const handleCopy = () => {
    if (translation) {
      navigator.clipboard.writeText(translation.character);
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center" onClick={onClose}>
      <div className="bg-white rounded-2xl p-10 max-w-2xl mx-4 shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-2xl font-semibold text-text-primary">Translation</h3>
          <button onClick={onClose} className="text-text-secondary hover:text-text-primary text-xl">
            <i className="fas fa-times"></i>
          </button>
        </div>
        
        <div className="space-y-6">
          <div className="text-center">
            <div className="text-7xl font-bold text-text-primary mb-6">{translation.character}</div>
            <div className="text-3xl text-brand-blue mb-4">{translation.pinyin}</div>
            <div className="text-2xl text-text-secondary">{translation.english}</div>
          </div>
          
          <div className="flex space-x-3">
            <button 
              onClick={handleSpeak}
              disabled={isPlaying}
              className={`flex-1 py-3 rounded-lg font-medium transition-colors ${
                isPlaying 
                  ? 'bg-gray-400 text-white cursor-not-allowed'
                  : 'bg-brand-blue text-white hover:bg-brand-blue-dark'
              }`}
            >
              <i className={`fas ${isPlaying ? 'fa-spinner fa-spin' : 'fa-volume-up'} mr-2`}></i>
              {isPlaying ? 'Playing...' : 'Pronounce'}
            </button>
            <button 
              onClick={handleCopy}
              className="flex-1 bg-brand-yellow text-white py-3 rounded-lg font-medium hover:bg-brand-yellow-light transition-colors"
            >
              <i className="fas fa-copy mr-2"></i>Copy
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
