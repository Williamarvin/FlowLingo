import { useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import HighlightableText from "@/components/highlightable-text";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Sidebar from "@/components/sidebar";
import TestSelect from "@/components/TestSelect";

export default function TextGenerator() {
  const [topic, setTopic] = useState("Daily Conversation");
  const [difficulty, setDifficulty] = useState("Beginner (HSK 1-2)");
  const [length, setLength] = useState("Short (300-400 characters)");
  const [generatedText, setGeneratedText] = useState<any>(null);

  const generateTextMutation = useMutation({
    mutationFn: async (params: { topic: string; difficulty: string; length: string }) => {
      const response = await apiRequest("POST", "/api/generate-text", params);
      return response.json();
    },
    onSuccess: (data) => {
      setGeneratedText(data);
    },
  });

  const saveWordMutation = useMutation({
    mutationFn: async (word: { character: string; pinyin: string; english: string }) => {
      const response = await apiRequest("POST", "/api/vocabulary", {
        ...word,
        hskLevel: difficulty.includes("1-2") ? 1 : difficulty.includes("3-4") ? 3 : 5,
        difficulty: "new"
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/vocabulary"] });
    },
  });

  const handleGenerate = () => {
    generateTextMutation.mutate({ topic, difficulty, length });
  };

  const handleSaveWord = (word: any) => {
    saveWordMutation.mutate(word);
  };

  const handleSpeak = () => {
    if (!generatedText) return;
    
    if (!('speechSynthesis' in window)) {
      alert('Speech synthesis is not supported in your browser. Please try using Chrome or Edge.');
      return;
    }

    // Cancel any ongoing speech
    speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(generatedText.content);
    
    // Try to find a Chinese voice
    const voices = speechSynthesis.getVoices();
    const chineseVoice = voices.find(voice => 
      voice.lang.includes('zh') || voice.lang.includes('cmn')
    );
    
    if (chineseVoice) {
      utterance.voice = chineseVoice;
    }
    
    utterance.lang = 'zh-CN';
    utterance.rate = 0.8;
    utterance.pitch = 1.0;
    utterance.volume = 1.0;

    utterance.onerror = (event) => {
      console.error('Speech synthesis error:', event);
    };

    speechSynthesis.speak(utterance);
  };

  return (
    <div className="min-h-screen">
      <Sidebar currentPage="/text-generator" />
      <div className="ml-64 p-8">
        <div className="max-w-6xl mx-auto">
          <div className="mb-8">
            <h2 className="text-3xl font-bold text-text-primary mb-4">Interactive Text Practice</h2>
            <p className="text-text-secondary">Generate Chinese text and highlight any word or phrase for instant English and Pinyin translations.</p>
          </div>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Text Generation Controls */}
        <div className="lg:col-span-1">
          <div className="card-duo">
            <h3 className="text-xl font-bold text-text-primary mb-6">Generate Text</h3>
            <div className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-text-secondary mb-2">Topic</label>
                <TestSelect />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-text-secondary mb-2">Difficulty</label>
                <Select value={difficulty} onValueChange={(value) => setDifficulty(value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select difficulty" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Beginner (HSK 1-2)">Beginner (HSK 1-2)</SelectItem>
                    <SelectItem value="Intermediate (HSK 3-4)">Intermediate (HSK 3-4)</SelectItem>
                    <SelectItem value="Advanced (HSK 5-6)">Advanced (HSK 5-6)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-text-secondary mb-2">Text Length</label>
                <Select value={length} onValueChange={(value) => setLength(value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select text length" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Short (300-400 characters)">Short (300-400 characters)</SelectItem>
                    <SelectItem value="Medium (500-700 characters)">Medium (500-700 characters)</SelectItem>
                    <SelectItem value="Long (800-1200 characters)">Long (800-1200 characters)</SelectItem>
                    <SelectItem value="Extra Long (1500-2000 characters)">Extra Long (1500-2000 characters)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <button 
                onClick={handleGenerate} 
                className="w-full btn-primary disabled:opacity-50"
                disabled={generateTextMutation.isPending}
              >
                {generateTextMutation.isPending ? (
                  <><i className="fas fa-spinner fa-spin mr-2"></i>Generating...</>
                ) : (
                  <><i className="fas fa-magic mr-2"></i>Generate Text</>
                )}
              </button>
            </div>
          </div>

          {/* Translation Panel */}
          <div className="card-duo mt-6">
            <h3 className="text-xl font-bold text-text-primary mb-6">Translation</h3>
            <div className="text-center text-text-secondary py-8">
              <i className="fas fa-hand-pointer text-4xl mb-4 opacity-50"></i>
              <p>Highlight any text to see translation and pinyin</p>
            </div>
          </div>
        </div>

        {/* Generated Text Area */}
        <div className="lg:col-span-2">
          <div className="card-duo">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-text-primary">Generated Text</h3>
                {generatedText && (
                  <div className="flex items-center space-x-2">
                    <Button variant="ghost" size="sm" onClick={handleSpeak} title="Text to Speech">
                      <i className="fas fa-volume-up"></i>
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => {
                        navigator.clipboard.writeText(generatedText.content);
                      }}
                      title="Copy Text"
                    >
                      <i className="fas fa-copy"></i>
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => {
                        // Save to localStorage as a simple bookmark system
                        const bookmarks = JSON.parse(localStorage.getItem('bookmarks') || '[]');
                        bookmarks.push({
                          content: generatedText.content,
                          topic,
                          difficulty,
                          date: new Date().toISOString()
                        });
                        localStorage.setItem('bookmarks', JSON.stringify(bookmarks));
                      }}
                      title="Bookmark"
                    >
                      <i className="fas fa-bookmark"></i>
                    </Button>
                  </div>
                )}
            </div>
            {generatedText ? (
                <>
                  <div className="bg-background-soft rounded-2xl p-8 mb-6">
                    <HighlightableText 
                      text={generatedText.content}
                      onSaveWord={handleSaveWord}
                    />
                  </div>
                  
                  <div className="flex items-center space-x-4 text-sm text-text-secondary">
                    <span><i className="fas fa-clock mr-1"></i>Reading time: 2 min</span>
                    <span><i className="fas fa-chart-bar mr-1"></i>HSK Level: {difficulty.includes("1-2") ? "1-2" : difficulty.includes("3-4") ? "3-4" : "5-6"}</span>
                    <span><i className="fas fa-font mr-1"></i>Characters: {generatedText.content.length}</span>
                  </div>
                </>
              ) : (
                <div className="text-center text-text-secondary py-16">
                  <i className="fas fa-file-text text-4xl mb-4 opacity-50"></i>
                  <p>Generate text to start practicing</p>
                </div>
              )}
          </div>
        </div>
      </div>
        </div>
      </div>
    </div>
  );
}
