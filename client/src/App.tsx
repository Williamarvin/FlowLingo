import { Switch, Route, useLocation } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useEffect } from "react";
import { audioManager } from "@/lib/audioManager";
import { useAuth } from "@/hooks/useAuth";

import Home from "@/pages/home";
import Login from "@/pages/login";
import Signup from "@/pages/signup";
import TextGenerator from "@/pages/text-generator";
import AiConversation from "@/pages/ai-conversation";
import PdfConverter from "@/pages/pdf-converter";
import MediaReader from "@/pages/media-reader";
import Flashcards from "@/pages/flashcards";
import Assessment from "@/pages/assessment";
import ProgressivePractice from "@/pages/progressive-practice";
import VoiceTranslator from "@/pages/voice-translator";
import TestConnection from "@/pages/test-connection";
import Rewards from "@/pages/rewards";
import NotFound from "@/pages/not-found";

function Router() {
  return (
    <Switch>
      {/* Public routes - accessible without authentication */}
      <Route path="/" component={Home} />
      <Route path="/login" component={Login} />
      <Route path="/signup" component={Signup} />
      
      {/* Protected routes - require authentication */}
      <Route path="/text-generator" component={TextGenerator} />
      <Route path="/ai-conversation" component={AiConversation} />
      <Route path="/pdf-converter" component={PdfConverter} />
      <Route path="/media-reader" component={MediaReader} />
      <Route path="/flashcards" component={Flashcards} />
      <Route path="/assessment" component={Assessment} />
      <Route path="/practice" component={ProgressivePractice} />
      <Route path="/voice-translator" component={VoiceTranslator} />
      <Route path="/rewards" component={Rewards} />
      <Route path="/test-connection" component={TestConnection} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  const [location] = useLocation();
  
  useEffect(() => {
    // Preload common Chinese phrases for faster TTS response
    audioManager.preloadCommonPhrases();
  }, []);
  
  useEffect(() => {
    // Stop all audio when navigating to a different page
    audioManager.stopAll();
  }, [location]);

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <div className="min-h-screen bg-background-soft">
          <Router />
        </div>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
