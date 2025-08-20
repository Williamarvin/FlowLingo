import { useState, useRef, useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { apiRequest } from "@/lib/queryClient";
import { startSpeechRecognition } from "@/services/openai";
import { useToast } from "@/hooks/use-toast";
import Sidebar from "@/components/sidebar";

interface Message {
  content: string;
  role: "user" | "assistant";
  timestamp: Date;
}

export default function AiConversation() {
  const [inputMessage, setInputMessage] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [topic, setTopic] = useState("Free Conversation");
  const [difficulty, setDifficulty] = useState("beginner");
  const [showPinyin, setShowPinyin] = useState(true);
  const [showTranslation, setShowTranslation] = useState(true);
  const [isRecording, setIsRecording] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const conversationMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await apiRequest("POST", "/api/conversation", data);
      return response.json();
    },
    onSuccess: (response) => {
      setMessages(prev => [...prev, {
        content: response.message,
        role: "assistant",
        timestamp: new Date()
      }]);
      queryClient.invalidateQueries({ queryKey: ["/api/conversations"] });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to send message", variant: "destructive" });
    }
  });

  const handleSendMessage = () => {
    if (!inputMessage.trim()) return;
    
    const userMessage: Message = {
      content: inputMessage,
      role: "user", 
      timestamp: new Date()
    };
    
    setMessages(prev => [...prev, userMessage]);
    
    conversationMutation.mutate({
      message: inputMessage,
      topic,
      difficulty
    });
    
    setInputMessage("");
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const startRecording = () => {
    if (isRecording) {
      setIsRecording(false);
      return;
    }

    setIsRecording(true);
    startSpeechRecognition(
      (transcript) => {
        setInputMessage(transcript);
        setIsRecording(false);
      },
      (error) => {
        toast({ title: "Speech Recognition Error", description: error, variant: "destructive" });
        setIsRecording(false);
      }
    );
  };

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const renderMessage = (message: Message, index: number) => {
    const isUser = message.role === "user";
    
    return (
      <div key={index} className={`flex items-start space-x-3 ${isUser ? 'justify-end' : ''}`}>
        {!isUser && (
          <div className="w-8 h-8 bg-brand-blue rounded-full flex items-center justify-center">
            <i className="fas fa-robot text-white text-xs"></i>
          </div>
        )}
        
        <div className={`rounded-2xl px-4 py-3 shadow-sm max-w-xs ${
          isUser 
            ? 'bg-brand-blue text-white rounded-tr-none' 
            : 'bg-white rounded-tl-none'
        }`}>
          <div className={`mb-1 ${isUser ? 'text-white' : 'text-text-primary'}`}>
            {message.content}
          </div>
          {!isUser && showPinyin && (
            <div className="text-sm opacity-80 text-text-secondary">
              {/* Simplified pinyin display - in real app, would parse from AI response */}
              Nǐ hǎo! Wǒ jiào Xiǎo Lǐ.
            </div>
          )}
          {!isUser && showTranslation && (
            <div className="text-sm text-brand-blue mt-1">
              {/* Simplified translation - in real app, would parse from AI response */}
              Hello! My name is Xiao Li.
            </div>
          )}
        </div>
        
        {isUser && (
          <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center">
            <i className="fas fa-user text-gray-600 text-xs"></i>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="min-h-screen flex">
      <Sidebar currentPage="/ai-conversation" />
      <div className="flex-1 p-8">
        <div className="max-w-6xl mx-auto">
          <div className="mb-8">
            <h2 className="text-3xl font-bold text-text-primary mb-4">AI Conversation Practice</h2>
            <p className="text-text-secondary">Practice speaking Mandarin with our AI avatar tutor. Get real-time feedback and corrections.</p>
          </div>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* AI Avatar and Chat */}
        <div className="lg:col-span-2">
          <div className="card-falou p-8">
            <div className="text-center mb-6">
              <img 
                src="https://pixabay.com/get/g8db8ef051fb9cdfa3e5dac3eeafc3c8d5a7994b1b74ea97d3734a951e63f1661b42974263e6c37676d32635172e08de9bc279a1fe982108e9b8a7b325b2940ff_1280.jpg" 
                alt="AI Language Tutor Avatar" 
                className="w-32 h-32 rounded-full mx-auto shadow-lg border-4 border-brand-blue border-opacity-20" 
              />
              <h3 className="text-xl font-semibold text-text-primary mt-4">Meet Xiao Li (小李)</h3>
              <p className="text-text-secondary">Your AI Mandarin conversation partner</p>
            </div>
            
            {/* Conversation Area */}
            <div className="bg-background-soft rounded-2xl p-6 h-80 overflow-y-auto mb-6">
              {messages.length === 0 ? (
                <div className="text-center text-text-secondary py-20">
                  <i className="fas fa-comments text-4xl mb-4 opacity-50"></i>
                  <p>Start a conversation with Xiao Li!</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {messages.map(renderMessage)}
                  <div ref={messagesEndRef} />
                </div>
              )}
            </div>
            
            {/* Input Area */}
            <div className="flex items-center space-x-3">
              <Button
                onClick={startRecording}
                variant={isRecording ? "destructive" : "default"}
                size="sm"
                title="Voice Input"
              >
                <i className={`fas fa-microphone ${isRecording ? 'animate-pulse' : ''}`}></i>
              </Button>
              <Input
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Type your message in Chinese..."
                className="flex-1"
              />
              <Button 
                onClick={handleSendMessage}
                disabled={conversationMutation.isPending || !inputMessage.trim()}
              >
                {conversationMutation.isPending ? (
                  <i className="fas fa-spinner fa-spin"></i>
                ) : (
                  <i className="fas fa-paper-plane"></i>
                )}
              </Button>
            </div>
          </div>
        </div>

        {/* Settings and Progress */}
        <div className="lg:col-span-1">
          <div className="card-duo">
            <h3 className="text-xl font-bold text-text-primary mb-6">Conversation Settings</h3>
            <div className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-text-secondary mb-2">Topic</label>
                <Select value={topic} onValueChange={setTopic}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Free Conversation">Free Conversation</SelectItem>
                    <SelectItem value="Ordering Food">Ordering Food</SelectItem>
                    <SelectItem value="At the Airport">At the Airport</SelectItem>
                    <SelectItem value="Shopping">Shopping</SelectItem>
                    <SelectItem value="Making Friends">Making Friends</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-text-secondary mb-2">Difficulty Level</label>
                <div className="flex space-x-2">
                  <Button
                    variant={difficulty === "beginner" ? "default" : "outline"}
                    size="sm"
                    className="flex-1"
                    onClick={() => setDifficulty("beginner")}
                  >
                    Beginner
                  </Button>
                  <Button
                    variant={difficulty === "intermediate" ? "default" : "outline"}
                    size="sm"
                    className="flex-1"
                    onClick={() => setDifficulty("intermediate")}
                  >
                    Intermediate
                  </Button>
                  <Button
                    variant={difficulty === "advanced" ? "default" : "outline"}
                    size="sm"
                    className="flex-1"
                    onClick={() => setDifficulty("advanced")}
                  >
                    Advanced
                  </Button>
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-text-secondary mb-2">Features</label>
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <Checkbox 
                      id="pinyin" 
                      checked={showPinyin} 
                      onCheckedChange={(checked) => setShowPinyin(checked === true)}
                    />
                    <label htmlFor="pinyin" className="text-sm text-text-secondary">Show Pinyin</label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox 
                      id="translation" 
                      checked={showTranslation} 
                      onCheckedChange={(checked) => setShowTranslation(checked === true)}
                    />
                    <label htmlFor="translation" className="text-sm text-text-secondary">English Translation</label>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Progress Stats */}
          <div className="card-duo mt-6">
            <h3 className="text-xl font-bold text-text-primary mb-6">Today's Progress</h3>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-text-secondary">Conversations</span>
                <span className="font-semibold text-brand-blue">3/5</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-text-secondary">Speaking Time</span>
                <span className="font-semibold text-brand-blue">15 min</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-text-secondary">New Words</span>
                <span className="font-semibold text-brand-blue">{messages.length}</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div className="bg-brand-blue h-2 rounded-full" style={{width: "60%"}}></div>
              </div>
              <p className="text-sm text-text-secondary text-center">60% of daily goal completed</p>
            </div>
          </div>
        </div>
      </div>
        </div>
      </div>
    </div>
  );
}