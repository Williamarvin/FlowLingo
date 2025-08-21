import { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Mic, MicOff, Volume2, Languages } from "lucide-react";
import Sidebar from "@/components/sidebar";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

declare global {
  interface Window {
    SpeechRecognition: any;
    webkitSpeechRecognition: any;
  }
}

interface TranslationResult {
  chinese: string;
  pinyin: string;
  english: string;
}

export default function VoiceTranslator() {
  const { toast } = useToast();
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [translations, setTranslations] = useState<TranslationResult[]>([]);
  const recognitionRef = useRef<any>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Translation mutation
  const translateMutation = useMutation({
    mutationFn: async (text: string) => {
      const response = await apiRequest("POST", "/api/translate/voice", { text });
      return response.json();
    },
    onSuccess: (data: TranslationResult) => {
      setTranslations(prev => [data, ...prev]);
      setTranscript("");
    },
    onError: (error) => {
      console.error("Translation error:", error);
      toast({
        title: "Translation Failed",
        description: "Could not translate the speech. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Initialize speech recognition
  useEffect(() => {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      const recognition = new SpeechRecognition();
      
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = 'zh-CN'; // Mandarin Chinese
      
      recognition.onresult = (event: any) => {
        let currentTranscript = '';
        for (let i = event.resultIndex; i < event.results.length; i++) {
          if (event.results[i].isFinal) {
            currentTranscript += event.results[i][0].transcript;
          } else {
            currentTranscript += event.results[i][0].transcript;
          }
        }
        
        setTranscript(currentTranscript);
        
        // Clear existing timeout
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current);
        }
        
        // Set new timeout to auto-translate after 2 seconds of silence
        if (currentTranscript.trim()) {
          timeoutRef.current = setTimeout(() => {
            if (currentTranscript.trim()) {
              translateMutation.mutate(currentTranscript);
            }
          }, 2000);
        }
      };
      
      recognition.onerror = (event: any) => {
        console.error("Speech recognition error:", event.error);
        if (event.error !== 'no-speech') {
          toast({
            title: "Recognition Error",
            description: "Could not recognize speech. Please try again.",
            variant: "destructive",
          });
        }
        setIsListening(false);
      };
      
      recognition.onend = () => {
        setIsListening(false);
      };
      
      recognitionRef.current = recognition;
    } else {
      toast({
        title: "Not Supported",
        description: "Speech recognition is not supported in your browser.",
        variant: "destructive",
      });
    }
    
    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  const toggleListening = () => {
    if (!recognitionRef.current) return;
    
    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
      
      // If there's a transcript, translate it immediately
      if (transcript.trim()) {
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current);
        }
        translateMutation.mutate(transcript);
      }
    } else {
      setTranscript("");
      recognitionRef.current.start();
      setIsListening(true);
    }
  };

  const playAudio = async (text: string) => {
    try {
      const response = await apiRequest("POST", "/api/tts", { 
        text,
        speed: 0.9 
      });
      const audioBlob = await response.blob();
      const audioUrl = URL.createObjectURL(audioBlob);
      const audio = new Audio(audioUrl);
      await audio.play();
    } catch (error) {
      console.error("Audio playback error:", error);
      toast({
        title: "Audio Error",
        description: "Could not play audio. Please try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="min-h-screen">
      <Sidebar currentPage="/voice-translator" />
      <div className="ml-64 p-8">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Voice Translator</h1>
            <p className="text-gray-600">
              Speak in Mandarin and get instant translations with pinyin
            </p>
          </div>

          {/* Main Control Card */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Languages className="w-5 h-5" />
                Real-time Voice Translation
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col items-center space-y-6">
                {/* Microphone Button */}
                <Button
                  size="lg"
                  onClick={toggleListening}
                  className={`w-32 h-32 rounded-full transition-all ${
                    isListening 
                      ? "bg-red-500 hover:bg-red-600 animate-pulse" 
                      : "bg-blue-500 hover:bg-blue-600"
                  }`}
                >
                  {isListening ? (
                    <MicOff className="w-12 h-12 text-white" />
                  ) : (
                    <Mic className="w-12 h-12 text-white" />
                  )}
                </Button>
                
                <p className="text-center text-gray-600">
                  {isListening 
                    ? "Listening... Speak in Mandarin" 
                    : "Press to start speaking"}
                </p>

                {/* Live Transcript */}
                {transcript && (
                  <div className="w-full p-4 bg-gray-50 rounded-lg border border-gray-200">
                    <p className="text-sm text-gray-500 mb-1">Recognizing...</p>
                    <p className="text-lg text-gray-800">{transcript}</p>
                  </div>
                )}

                {/* Loading State */}
                {translateMutation.isPending && (
                  <div className="flex items-center gap-2 text-blue-600">
                    <div className="animate-spin w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full"></div>
                    <span>Translating...</span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Translation History */}
          <div className="space-y-4">
            <h2 className="text-xl font-semibold text-gray-800">Translation History</h2>
            
            {translations.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center text-gray-500">
                  <Languages className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                  <p>Your translations will appear here</p>
                  <p className="text-sm mt-2">Start speaking to see translations</p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-3">
                {translations.map((translation, index) => (
                  <Card key={index} className="hover:shadow-lg transition-shadow">
                    <CardContent className="pt-6">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {/* Chinese */}
                        <div className="text-center">
                          <p className="text-xs text-gray-500 mb-1">Chinese</p>
                          <p className="text-2xl font-bold text-blue-600">
                            {translation.chinese}
                          </p>
                        </div>
                        
                        {/* Pinyin */}
                        <div className="text-center">
                          <p className="text-xs text-gray-500 mb-1">Pinyin</p>
                          <p className="text-lg text-purple-600">
                            {translation.pinyin}
                          </p>
                        </div>
                        
                        {/* English */}
                        <div className="text-center">
                          <p className="text-xs text-gray-500 mb-1">English</p>
                          <p className="text-lg text-gray-800">
                            {translation.english}
                          </p>
                        </div>
                      </div>
                      
                      {/* Play Audio Button */}
                      <div className="mt-4 flex justify-center">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => playAudio(translation.chinese)}
                          className="gap-2"
                        >
                          <Volume2 className="w-4 h-4" />
                          Play Pronunciation
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>

          {/* Instructions */}
          <Card className="mt-6 bg-blue-50 border-blue-200">
            <CardContent className="pt-6">
              <h3 className="font-semibold text-blue-900 mb-2">How to use:</h3>
              <ul className="space-y-1 text-sm text-blue-800">
                <li>• Click the microphone button to start recording</li>
                <li>• Speak clearly in Mandarin Chinese</li>
                <li>• Translation happens automatically after 2 seconds of silence</li>
                <li>• Click the microphone again to stop and translate immediately</li>
                <li>• Click "Play Pronunciation" to hear the Chinese text</li>
              </ul>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}