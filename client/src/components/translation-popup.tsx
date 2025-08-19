import { useEffect } from "react";

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

  const handleSpeak = () => {
    if ('speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(translation.character);
      utterance.lang = 'zh-CN';
      speechSynthesis.speak(utterance);
    }
  };

  const handleSave = () => {
    if (onSaveWord) {
      onSaveWord(translation);
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center" onClick={onClose}>
      <div className="bg-white rounded-2xl p-6 max-w-md mx-4 shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-text-primary">Translation</h3>
          <button onClick={onClose} className="text-text-secondary hover:text-text-primary">
            <i className="fas fa-times"></i>
          </button>
        </div>
        
        <div className="space-y-4">
          <div className="text-center">
            <div className="text-3xl font-bold text-text-primary mb-2">{translation.character}</div>
            <div className="text-lg text-brand-blue mb-1">{translation.pinyin}</div>
            <div className="text-text-secondary">{translation.english}</div>
          </div>
          
          <div className="flex space-x-2">
            <button 
              onClick={handleSpeak}
              className="flex-1 bg-brand-blue text-white py-2 rounded-lg font-medium hover:bg-brand-blue-dark transition-colors"
            >
              <i className="fas fa-volume-up mr-2"></i>Pronounce
            </button>
            <button 
              onClick={handleSave}
              className="flex-1 bg-brand-yellow text-white py-2 rounded-lg font-medium hover:bg-brand-yellow-light transition-colors"
            >
              <i className="fas fa-bookmark mr-2"></i>Save Word
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
