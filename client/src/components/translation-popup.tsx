import { useEffect, useState } from "react";

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

  const handleSpeak = () => {
    if ('speechSynthesis' in window) {
      // Stop any current speech
      speechSynthesis.cancel();
      setIsPlaying(true);
      
      const utterance = new SpeechSynthesisUtterance(translation.character);
      utterance.lang = 'zh-CN';
      utterance.rate = 0.8; // Slower rate for learning
      utterance.pitch = 1.0;
      utterance.volume = 1.0;
      
      // Event handlers for speech synthesis
      utterance.onstart = () => setIsPlaying(true);
      utterance.onend = () => setIsPlaying(false);
      utterance.onerror = () => setIsPlaying(false);
      
      // Load voices and try to use a Chinese voice
      const loadVoicesAndSpeak = () => {
        const voices = speechSynthesis.getVoices();
        const chineseVoice = voices.find(voice => 
          voice.lang.includes('zh') || 
          voice.lang.includes('cmn') ||
          voice.name.toLowerCase().includes('chinese')
        );
        
        if (chineseVoice) {
          utterance.voice = chineseVoice;
        }
        
        speechSynthesis.speak(utterance);
      };
      
      // Check if voices are already loaded
      if (speechSynthesis.getVoices().length > 0) {
        loadVoicesAndSpeak();
      } else {
        // Wait for voices to load
        speechSynthesis.onvoiceschanged = loadVoicesAndSpeak;
      }
    } else {
      // Fallback notification if speech synthesis not supported
      alert('Speech synthesis is not supported in your browser. Please try a different browser.');
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
      <div className="bg-white rounded-2xl p-8 max-w-lg mx-4 shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-text-primary">Translation</h3>
          <button onClick={onClose} className="text-text-secondary hover:text-text-primary">
            <i className="fas fa-times"></i>
          </button>
        </div>
        
        <div className="space-y-4">
          <div className="text-center">
            <div className="text-5xl font-bold text-text-primary mb-4">{translation.character}</div>
            <div className="text-xl text-brand-blue mb-2">{translation.pinyin}</div>
            <div className="text-lg text-text-secondary">{translation.english}</div>
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
