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

  const handleSpeak = async () => {
    if (!translation) return;
    
    setIsPlaying(true);
    
    try {
      // Call the OpenAI TTS endpoint
      const response = await fetch('/api/tts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ text: translation.character }),
      });

      if (!response.ok) {
        throw new Error('Failed to generate speech');
      }

      // Get the audio blob
      const audioBlob = await response.blob();
      const audioUrl = URL.createObjectURL(audioBlob);
      
      // Play the audio
      const audio = new Audio(audioUrl);
      audio.playbackRate = 1.0; // Normal speed since we already set it slower on server
      
      audio.onended = () => {
        setIsPlaying(false);
        URL.revokeObjectURL(audioUrl);
      };
      
      audio.onerror = () => {
        setIsPlaying(false);
        URL.revokeObjectURL(audioUrl);
      };
      
      await audio.play();
    } catch (error) {
      console.error('TTS error:', error);
      setIsPlaying(false);
      
      // Fallback to browser speech synthesis
      if ('speechSynthesis' in window) {
        speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(translation.character);
        utterance.lang = 'zh-CN';
        utterance.rate = 0.8;
        utterance.onend = () => setIsPlaying(false);
        utterance.onerror = () => setIsPlaying(false);
        speechSynthesis.speak(utterance);
      }
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
