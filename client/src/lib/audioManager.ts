// Global audio manager to ensure only one audio plays at a time
class AudioManager {
  private currentAudio: HTMLAudioElement | null = null;
  private currentUtterance: SpeechSynthesisUtterance | null = null;
  private audioCache: Map<string, Blob> = new Map();
  private pendingRequests: Map<string, Promise<Blob>> = new Map();

  // Stop any currently playing audio or speech
  stopAll() {
    // Stop HTML audio element if playing
    if (this.currentAudio) {
      this.currentAudio.pause();
      this.currentAudio.currentTime = 0;
      this.currentAudio = null;
    }

    // Stop speech synthesis if speaking
    if (window.speechSynthesis?.speaking) {
      window.speechSynthesis.cancel();
    }
    this.currentUtterance = null;
  }

  // Generate cache key for TTS requests
  private getCacheKey(text: string, speed: number): string {
    return `${text}_${speed}`;
  }

  // Preload common phrases for faster response
  async preloadCommonPhrases() {
    const commonPhrases = [
      '你好', '谢谢', '再见', '对不起', '没关系',
      '是', '不是', '好的', '我不明白', '请再说一遍'
    ];
    
    // Preload in background without waiting
    commonPhrases.forEach(phrase => {
      this.fetchAndCacheTTS(phrase, 0.8).catch(console.error);
    });
  }

  // Fetch and cache TTS audio
  private async fetchAndCacheTTS(text: string, speed: number): Promise<Blob> {
    const cacheKey = this.getCacheKey(text, speed);
    
    // Check if we already have a pending request for this
    const pending = this.pendingRequests.get(cacheKey);
    if (pending) {
      return pending;
    }

    // Create the fetch promise
    const fetchPromise = fetch('/api/tts', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ text, speed }),
    }).then(async response => {
      if (!response.ok) {
        throw new Error('Failed to generate speech');
      }
      const blob = await response.blob();
      // Cache the result
      this.audioCache.set(cacheKey, blob);
      // Remove from pending
      this.pendingRequests.delete(cacheKey);
      return blob;
    }).catch(error => {
      // Remove from pending on error
      this.pendingRequests.delete(cacheKey);
      throw error;
    });

    // Store as pending request
    this.pendingRequests.set(cacheKey, fetchPromise);
    return fetchPromise;
  }

  // Play audio with OpenAI TTS
  async playTTS(text: string, speed: number = 0.65): Promise<void> {
    // Stop any currently playing audio first
    this.stopAll();

    try {
      const cacheKey = this.getCacheKey(text, speed);
      
      // Check cache first
      let audioBlob = this.audioCache.get(cacheKey);
      
      if (!audioBlob) {
        // Not in cache, fetch it
        audioBlob = await this.fetchAndCacheTTS(text, speed);
      }

      const audioUrl = URL.createObjectURL(audioBlob);
      
      const audio = new Audio(audioUrl);
      this.currentAudio = audio;
      
      audio.playbackRate = 1.0; // Normal speed since we control it on server
      
      return new Promise((resolve, reject) => {
        audio.onended = () => {
          URL.revokeObjectURL(audioUrl);
          if (this.currentAudio === audio) {
            this.currentAudio = null;
          }
          resolve();
        };
        
        audio.onerror = () => {
          URL.revokeObjectURL(audioUrl);
          if (this.currentAudio === audio) {
            this.currentAudio = null;
          }
          reject(new Error('Audio playback failed'));
        };
        
        audio.play().catch(reject);
      });
    } catch (error) {
      console.error('TTS error:', error);
      // Fallback to browser speech synthesis
      this.playBrowserTTS(text, speed);
      throw error;
    }
  }

  // Fallback to browser TTS
  playBrowserTTS(text: string, rate: number = 0.8) {
    // Stop any currently playing audio first
    this.stopAll();

    if ('speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'zh-CN';
      utterance.rate = rate;
      
      // Try to use a Chinese voice
      const voices = window.speechSynthesis.getVoices();
      const chineseVoice = voices.find(voice => 
        voice.lang.includes('zh') || voice.lang.includes('cmn')
      );
      
      if (chineseVoice) {
        utterance.voice = chineseVoice;
      }
      
      this.currentUtterance = utterance;
      window.speechSynthesis.speak(utterance);
    }
  }

  // Check if audio is currently playing
  isPlaying(): boolean {
    return !!(this.currentAudio || window.speechSynthesis?.speaking);
  }
}

// Export singleton instance
export const audioManager = new AudioManager();