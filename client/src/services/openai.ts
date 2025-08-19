// This file contains OpenAI integration utilities
// Note: All API calls are handled server-side for security

export interface TranslationRequest {
  text: string;
}

export interface TranslationResponse {
  character: string;
  pinyin: string;
  english: string;
}

export interface TextGenerationRequest {
  topic: string;
  difficulty: string;
  length: string;
}

export interface ConversationRequest {
  message: string;
  conversationId?: string;
  topic: string;
  difficulty: string;
}

// Client-side utilities for text-to-speech
export const speakChinese = (text: string) => {
  if ('speechSynthesis' in window) {
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'zh-CN';
    utterance.rate = 0.8; // Slower rate for learning
    speechSynthesis.speak(utterance);
  }
};

// Client-side utilities for speech recognition
export const startSpeechRecognition = (
  onResult: (transcript: string) => void,
  onError?: (error: string) => void
) => {
  if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
    const SpeechRecognition = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;
    const recognition = new SpeechRecognition();
    
    recognition.lang = 'zh-CN';
    recognition.continuous = false;
    recognition.interimResults = false;
    
    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      onResult(transcript);
    };
    
    recognition.onerror = (event: any) => {
      if (onError) {
        onError(`Speech recognition error: ${event.error}`);
      }
    };
    
    recognition.start();
    return recognition;
  } else {
    if (onError) {
      onError('Speech recognition is not supported in your browser');
    }
    return null;
  }
};
