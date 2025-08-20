// Global audio manager to ensure only one audio plays at a time
class AudioManager {
  private currentAudio: HTMLAudioElement | null = null;
  private currentUtterance: SpeechSynthesisUtterance | null = null;

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

  // Play audio with OpenAI TTS
  async playTTS(text: string, speed: number = 0.8): Promise<void> {
    // Stop any currently playing audio first
    this.stopAll();

    try {
      const response = await fetch('/api/tts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ text, speed }),
      });

      if (!response.ok) {
        throw new Error('Failed to generate speech');
      }

      const audioBlob = await response.blob();
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