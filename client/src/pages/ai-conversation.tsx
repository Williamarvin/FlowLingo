import { useState, useRef, useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import Sidebar from "@/components/sidebar";
import { Mic, MicOff, Phone, PhoneOff, Volume2, Loader2, User, Bot, Settings, Speaker } from "lucide-react";

interface Message {
  content: string;
  role: "user" | "assistant";
  timestamp: Date;
  chinese?: string;
  pinyin?: string;
  english?: string;
}

export default function AiConversation() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [topic, setTopic] = useState("Free Conversation");
  const [difficulty, setDifficulty] = useState("beginner");
  const [isInCall, setIsInCall] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [transcript, setTranscript] = useState("");
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<any>(null);
  const synthRef = useRef<SpeechSynthesisUtterance | null>(null);
  const silenceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const currentTranscriptRef = useRef<string>("");
  
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch user profile to get level
  const { data: userProfile } = useQuery<any>({
    queryKey: ["/api/user/profile"],
  });

  // Conversation mutation to OpenAI
  const conversationMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await apiRequest("POST", "/api/conversation/voice", data);
      return response.json();
    },
    onSuccess: (response) => {
      const assistantMessage: Message = {
        content: response.message,
        role: "assistant",
        timestamp: new Date(),
        chinese: response.chinese,
        pinyin: response.pinyin,
        english: response.english
      };
      
      setMessages(prev => [...prev, assistantMessage]);
      
      // Speak the response
      if (isInCall) {
        speakMessage(response.message);
      }
      
      queryClient.invalidateQueries({ queryKey: ["/api/conversations"] });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to get response", variant: "destructive" });
      setIsListening(true); // Resume listening even on error
    }
  });

  // Initialize speech recognition
  useEffect(() => {
    if (typeof window !== 'undefined' && 'webkitSpeechRecognition' in window) {
      const SpeechRecognition = (window as any).webkitSpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = true;
      recognitionRef.current.interimResults = true;
      recognitionRef.current.lang = 'zh-CN'; // Mandarin Chinese
      
      recognitionRef.current.onresult = (event: any) => {
        let finalTranscript = '';
        let interimTranscript = '';
        
        for (let i = event.resultIndex; i < event.results.length; i++) {
          const transcript = event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            finalTranscript += transcript;
          } else {
            interimTranscript += transcript;
          }
        }
        
        // Update transcript display with current speech
        const currentTranscript = finalTranscript || interimTranscript;
        setTranscript(currentTranscript);
        currentTranscriptRef.current = currentTranscript;
        
        // Clear any existing silence timer since user is speaking
        if (silenceTimerRef.current) {
          clearTimeout(silenceTimerRef.current);
          silenceTimerRef.current = null;
        }
        
        // If we have final speech content, start the 2-second silence timer
        if (finalTranscript.trim() && !conversationMutation.isPending) {
          console.log('Setting 2-second silence timer for:', finalTranscript);
          silenceTimerRef.current = setTimeout(() => {
            const latestTranscript = currentTranscriptRef.current;
            console.log('2 seconds of silence detected, sending message:', latestTranscript);
            if (latestTranscript.trim() && !conversationMutation.isPending) {
              handleUserSpeech(latestTranscript);
            }
          }, 2000);
        }
      };
      
      recognitionRef.current.onerror = (event: any) => {
        console.error('Speech recognition error:', event.error);
        
        // If there's a no-speech error and we have a transcript, send it
        if (event.error === 'no-speech') {
          const unsent = currentTranscriptRef.current;
          if (unsent && unsent.trim() && !conversationMutation.isPending) {
            console.log('No speech detected, sending existing transcript:', unsent);
            if (silenceTimerRef.current) {
              clearTimeout(silenceTimerRef.current);
              silenceTimerRef.current = null;
            }
            handleUserSpeech(unsent);
            return;
          }
        }
        
        // Restart on critical errors
        if (event.error === 'network' || event.error === 'audio-capture') {
          if (isInCall && isListening && !conversationMutation.isPending) {
            setTimeout(() => {
              try {
                if (isListening && isInCall) {
                  recognitionRef.current.start();
                }
              } catch (e) {
                console.log('Error restarting recognition:', e);
              }
            }, 1000);
          }
        }
      };
      
      recognitionRef.current.onend = () => {
        console.log('Speech recognition ended');
        
        // Check if we have unsent transcript when recognition ends
        const unsent = currentTranscriptRef.current;
        if (unsent && unsent.trim() && !conversationMutation.isPending) {
          console.log('Recognition ended with unsent transcript, sending:', unsent);
          // Clear any existing timer
          if (silenceTimerRef.current) {
            clearTimeout(silenceTimerRef.current);
            silenceTimerRef.current = null;
          }
          // Send the message immediately
          handleUserSpeech(unsent);
          return;
        }
        
        // Only restart if we're still in call and actively listening
        if (isInCall && isListening && !isSpeaking && !conversationMutation.isPending) {
          // Check if there's a silence timer running - if so, don't restart yet
          if (silenceTimerRef.current) {
            console.log('Silence timer active, not restarting recognition');
            return;
          }
          
          // Restart recognition after a short delay
          setTimeout(() => {
            try {
              if (isListening && isInCall && !silenceTimerRef.current && !conversationMutation.isPending) {
                console.log('Restarting speech recognition...');
                recognitionRef.current.start();
              }
            } catch (e) {
              console.log('Error restarting recognition:', e);
            }
          }, 100);
        }
      };
    }
  }, [isInCall, isListening, isSpeaking, conversationMutation.isPending]);

  const handleUserSpeech = (speech: string) => {
    if (!speech.trim() || !isInCall) return;
    
    console.log('Processing user speech:', speech);
    
    // Clear silence timer first
    if (silenceTimerRef.current) {
      clearTimeout(silenceTimerRef.current);
      silenceTimerRef.current = null;
    }
    
    // Clear transcript display
    setTranscript("");
    currentTranscriptRef.current = "";
    
    // Stop speech recognition temporarily while processing
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (e) {
        console.log('Recognition already stopped');
      }
    }
    
    const userMessage: Message = {
      content: speech,
      role: "user",
      timestamp: new Date()
    };
    
    setMessages(prev => [...prev, userMessage]);
    
    // Send to AI
    conversationMutation.mutate({
      message: speech,
      topic,
      difficulty,
      level: userProfile?.level || 1,
      conversationHistory: messages.slice(-6) // Send last 6 messages for context
    });
  };

  const speakMessage = async (text: string) => {
    setIsSpeaking(true);
    
    try {
      // Call the OpenAI TTS endpoint
      const response = await fetch('/api/tts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ text }),
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
        setIsSpeaking(false);
        URL.revokeObjectURL(audioUrl);
        
        // Resume listening after speaking
        if (isInCall) {
          setIsListening(true);
          // Restart speech recognition
          if (recognitionRef.current) {
            try {
              recognitionRef.current.start();
            } catch (e) {
              console.log('Recognition restart after speaking');
            }
          }
        }
      };
      
      audio.onerror = () => {
        setIsSpeaking(false);
        setIsListening(true);
        URL.revokeObjectURL(audioUrl);
      };
      
      await audio.play();
    } catch (error) {
      console.error('TTS error:', error);
      setIsSpeaking(false);
      
      // Fallback to browser speech synthesis
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = 'zh-CN';
        utterance.rate = 0.9;
        
        utterance.onend = () => {
          setIsSpeaking(false);
          if (isInCall) {
            setIsListening(true);
            if (recognitionRef.current) {
              try {
                recognitionRef.current.start();
              } catch (e) {
                console.log('Recognition restart after speaking fallback');
              }
            }
          }
        };
        
        utterance.onerror = () => {
          setIsSpeaking(false);
          setIsListening(true);
        };
        
        window.speechSynthesis.speak(utterance);
      }
    }
  };

  const startConversation = () => {
    setIsInCall(true);
    setIsListening(true);
    setMessages([]);
    
    // Start with a greeting from the AI
    const greetingMessage: Message = {
      content: "你好！我是你的中文老师。今天想聊什么？",
      role: "assistant",
      timestamp: new Date(),
      pinyin: "Nǐ hǎo! Wǒ shì nǐ de zhōngwén lǎoshī. Jīntiān xiǎng liáo shénme?",
      english: "Hello! I'm your Chinese teacher. What would you like to talk about today?"
    };
    
    setMessages([greetingMessage]);
    speakMessage(greetingMessage.content);
    
    // Start speech recognition
    if (recognitionRef.current) {
      try {
        recognitionRef.current.start();
      } catch (e) {
        console.log('Recognition already started');
      }
    }
  };

  const endConversation = () => {
    setIsInCall(false);
    setIsListening(false);
    setIsSpeaking(false);
    setTranscript("");
    currentTranscriptRef.current = "";
    
    // Stop speech recognition
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
    
    // Stop speech synthesis
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    
    // Clear timers
    if (silenceTimerRef.current) {
      clearTimeout(silenceTimerRef.current);
      silenceTimerRef.current = null;
    }
  };

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Load voices
  useEffect(() => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.getVoices();
      window.speechSynthesis.onvoiceschanged = () => {
        window.speechSynthesis.getVoices();
      };
    }
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-purple-50">
      <Sidebar currentPage="/ai-conversation" />
      
      <div className="ml-64 p-8">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="mb-6">
            <h1 className="text-4xl font-bold text-gray-800 mb-2">AI Conversation Practice</h1>
            <p className="text-lg text-gray-600">Practice speaking Mandarin with your AI tutor</p>
          </div>

          {/* Settings Panel */}
          {showSettings && (
            <Card className="mb-6 p-6 bg-white shadow-lg">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-2 block">Topic</label>
                  <Select value={topic} onValueChange={setTopic} disabled={isInCall}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Free Conversation">Free Conversation</SelectItem>
                      <SelectItem value="Daily Life">Daily Life</SelectItem>
                      <SelectItem value="Travel">Travel</SelectItem>
                      <SelectItem value="Food">Food</SelectItem>
                      <SelectItem value="Work">Work</SelectItem>
                      <SelectItem value="Hobbies">Hobbies</SelectItem>
                      <SelectItem value="Shopping">Shopping</SelectItem>
                      <SelectItem value="Weather">Weather</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-2 block">Difficulty</label>
                  <Select value={difficulty} onValueChange={setDifficulty} disabled={isInCall}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="beginner">Beginner (HSK 1-2)</SelectItem>
                      <SelectItem value="intermediate">Intermediate (HSK 3-4)</SelectItem>
                      <SelectItem value="advanced">Advanced (HSK 5-6)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </Card>
          )}

          {/* Main Call Interface */}
          <Card className="bg-white shadow-xl rounded-3xl overflow-hidden">
            {/* Call Status Bar */}
            <div className="bg-gradient-to-r from-blue-500 to-purple-500 px-6 py-4 text-white">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`w-3 h-3 rounded-full ${isInCall ? 'bg-green-400 animate-pulse' : 'bg-gray-400'}`} />
                  <span className="font-semibold">
                    {isInCall ? 'In Conversation' : 'Ready to Start'}
                  </span>
                  {isInCall && (
                    <span className="text-sm opacity-90">
                      {isListening ? '🎤 Listening...' : isSpeaking ? '🔊 Speaking...' : '⏸️ Processing...'}
                    </span>
                  )}
                </div>
                
                <Button
                  onClick={() => setShowSettings(!showSettings)}
                  variant="ghost"
                  size="sm"
                  className="text-white hover:bg-white/20"
                  disabled={isInCall}
                >
                  <Settings className="w-4 h-4" />
                </Button>
              </div>
            </div>

            {/* Messages Area */}
            <div className="h-[400px] overflow-y-auto p-6 space-y-4 bg-gray-50">
              {messages.length === 0 && !isInCall && (
                <div className="flex flex-col items-center justify-center h-full text-center">
                  <div className="text-6xl mb-4">🎙️</div>
                  <h3 className="text-xl font-semibold text-gray-700 mb-2">Ready to Practice?</h3>
                  <p className="text-gray-500 max-w-md">
                    Click "Start Conversation" to begin practicing Mandarin with your AI tutor. 
                    Speak naturally and the AI will respond with voice.
                  </p>
                </div>
              )}
              
              {messages.map((message, index) => (
                <div key={index} className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`flex items-start gap-3 max-w-[70%] ${message.role === 'user' ? 'flex-row-reverse' : ''}`}>
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                      message.role === 'user' ? 'bg-blue-500' : 'bg-purple-500'
                    }`}>
                      {message.role === 'user' ? 
                        <User className="w-5 h-5 text-white" /> : 
                        <Bot className="w-5 h-5 text-white" />
                      }
                    </div>
                    
                    <Card className={`p-4 ${
                      message.role === 'user' 
                        ? 'bg-blue-100 border-blue-200' 
                        : 'bg-white border-gray-200'
                    }`}>
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1">
                          <div className="font-medium text-gray-800 text-lg mb-1">
                            {message.content}
                          </div>
                          {message.pinyin && (
                            <div className="text-sm text-blue-600 mb-1">
                              {message.pinyin}
                            </div>
                          )}
                          {message.english && (
                            <div className="text-sm text-gray-500 italic">
                              {message.english}
                            </div>
                          )}
                        </div>
                        {message.role === 'assistant' && (
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => speakMessage(message.content)}
                            className="p-2 hover:bg-purple-100"
                            title="Listen to pronunciation"
                          >
                            <Volume2 className="w-4 h-4 text-purple-600" />
                          </Button>
                        )}
                      </div>
                    </Card>
                  </div>
                </div>
              ))}
              
              {/* Current Transcript */}
              {transcript && isListening && (
                <div className="flex justify-end">
                  <div className="bg-blue-50 border-2 border-blue-300 rounded-2xl px-4 py-3 max-w-[70%]">
                    <div className="flex items-center gap-2">
                      <Mic className="w-4 h-4 text-blue-500 animate-pulse" />
                      <span className="text-blue-700">{transcript}</span>
                    </div>
                  </div>
                </div>
              )}
              
              <div ref={messagesEndRef} />
            </div>

            {/* Control Panel */}
            <div className="bg-white border-t p-6">
              <div className="flex justify-center gap-4">
                {!isInCall ? (
                  <Button
                    onClick={startConversation}
                    size="lg"
                    className="bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white px-8 py-6 rounded-2xl text-lg font-semibold shadow-lg transform transition hover:scale-105"
                  >
                    <Phone className="w-6 h-6 mr-2" />
                    Start Conversation
                  </Button>
                ) : (
                  <>
                    <Button
                      onClick={() => setIsListening(!isListening)}
                      size="lg"
                      variant={isListening ? "default" : "outline"}
                      className="px-6 py-6 rounded-2xl"
                      disabled={isSpeaking || conversationMutation.isPending}
                    >
                      {isListening ? (
                        <>
                          <Mic className="w-6 h-6 mr-2 animate-pulse" />
                          Listening...
                        </>
                      ) : (
                        <>
                          <MicOff className="w-6 h-6 mr-2" />
                          Muted
                        </>
                      )}
                    </Button>
                    
                    <Button
                      onClick={endConversation}
                      size="lg"
                      variant="destructive"
                      className="px-8 py-6 rounded-2xl text-lg font-semibold shadow-lg"
                    >
                      <PhoneOff className="w-6 h-6 mr-2" />
                      End Conversation
                    </Button>
                  </>
                )}
                
                {conversationMutation.isPending && (
                  <div className="flex items-center gap-2 text-gray-500">
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span>AI is thinking...</span>
                  </div>
                )}
              </div>
              
              {/* Status Indicators */}
              {isInCall && (
                <div className="flex justify-center gap-6 mt-4 text-sm">
                  <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${isListening ? 'bg-green-500 animate-pulse' : 'bg-gray-300'}`} />
                    <span className="text-gray-600">Microphone</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${isSpeaking ? 'bg-blue-500 animate-pulse' : 'bg-gray-300'}`} />
                    <span className="text-gray-600">Speaker</span>
                  </div>
                </div>
              )}
            </div>
          </Card>

          {/* Instructions */}
          <div className="mt-6 bg-white rounded-2xl p-6 shadow-lg">
            <h3 className="font-semibold text-gray-800 mb-3">How it works:</h3>
            <ul className="space-y-2 text-gray-600">
              <li className="flex items-start gap-2">
                <span className="text-blue-500 mt-1">•</span>
                <span>Click "Start Conversation" to begin your practice session</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-500 mt-1">•</span>
                <span>Speak naturally in Mandarin - the AI will listen and respond</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-500 mt-1">•</span>
                <span>The AI tutor will speak back to you in Mandarin with proper pronunciation</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-500 mt-1">•</span>
                <span>You'll see pinyin and English translations to help you understand</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-500 mt-1">•</span>
                <span>Practice real conversations adapted to your level</span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}