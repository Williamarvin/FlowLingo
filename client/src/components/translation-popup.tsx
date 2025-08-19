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

  const handleSave = () => {
    if (onSaveWord) {
      onSaveWord(translation);
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-40 z-50 flex items-center justify-center backdrop-blur-sm" onClick={onClose}>
      <div className="bg-white rounded-3xl p-8 max-w-lg mx-4 shadow-2xl relative overflow-hidden animate-in zoom-in-95 duration-200" onClick={(e) => e.stopPropagation()}>
        {/* Decorative background elements */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-brand-blue to-brand-blue-light opacity-5 rounded-full -translate-y-16 translate-x-16"></div>
        <div className="absolute bottom-0 left-0 w-24 h-24 bg-gradient-to-tr from-brand-yellow to-brand-orange opacity-10 rounded-full translate-y-12 -translate-x-12"></div>
        
        {/* Header */}
        <div className="flex items-center justify-between mb-6 relative z-10">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-gradient-to-br from-brand-blue to-brand-blue-light rounded-xl flex items-center justify-center">
              <i className="fas fa-language text-white text-sm"></i>
            </div>
            <h3 className="text-xl font-bold text-text-primary">Translation</h3>
          </div>
          <button 
            onClick={onClose} 
            className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-500 hover:text-gray-700 transition-colors flex items-center justify-center"
          >
            <i className="fas fa-times text-sm"></i>
          </button>
        </div>
        
        <div className="space-y-6 relative z-10">
          {/* Main content */}
          <div className="text-center space-y-4">
            {/* Chinese character/phrase with enhanced styling */}
            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl p-6 border border-blue-100">
              <div className="text-5xl font-bold text-text-primary mb-3 leading-tight">
                {translation.character}
              </div>
            </div>
            
            {/* Pinyin with audio indicator */}
            <div className="inline-flex items-center space-x-3 bg-gradient-to-r from-yellow-50 to-orange-50 px-6 py-3 rounded-2xl border border-yellow-200">
              <i className="fas fa-volume-up text-brand-yellow text-lg"></i>
              <span className="text-xl font-semibold text-yellow-700">
                {translation.pinyin}
              </span>
            </div>

            {/* English translation with better presentation */}
            <div className="bg-gradient-to-br from-gray-50 to-slate-50 rounded-2xl p-5 border border-gray-200">
              <div className="text-lg text-text-primary font-medium leading-relaxed">
                {translation.english}
              </div>
            </div>
          </div>
          
          {/* Enhanced action buttons */}
          <div className="flex space-x-3">
            <button 
              onClick={handleSpeak}
              disabled={isPlaying}
              className={`flex-1 text-white py-4 rounded-2xl font-bold transition-all duration-200 shadow-lg hover:shadow-xl hover:scale-105 active:scale-95 flex items-center justify-center space-x-2 ${
                isPlaying 
                  ? 'bg-gradient-to-r from-gray-400 to-gray-500 cursor-not-allowed' 
                  : 'bg-gradient-to-r from-brand-blue to-brand-blue-light'
              }`}
            >
              <i className={`fas ${isPlaying ? 'fa-spinner fa-spin' : 'fa-play'} text-lg`}></i>
              <span>{isPlaying ? 'Playing...' : 'Listen'}</span>
            </button>
            <button 
              onClick={handleSave}
              className="flex-1 bg-gradient-to-r from-brand-yellow to-brand-orange text-white py-4 rounded-2xl font-bold transition-all duration-200 shadow-lg hover:shadow-xl hover:scale-105 active:scale-95 flex items-center justify-center space-x-2"
            >
              <i className="fas fa-bookmark text-lg"></i>
              <span>Save</span>
            </button>
          </div>

          {/* Helpful tip */}
          <div className="text-center">
            <p className="text-sm text-text-secondary bg-blue-50 px-4 py-2 rounded-xl border border-blue-100">
              💡 Saved words appear in your vocabulary for spaced repetition practice
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
