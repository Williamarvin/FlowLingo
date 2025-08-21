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
import NotFound from "@/pages/not-found";

function Router() {
  const { isAuthenticated, isLoading } = useAuth();
  
  // Show loading while checking authentication
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-20 h-20 bg-gradient-to-br from-green-400 to-emerald-500 rounded-2xl flex items-center justify-center mx-auto mb-4 animate-pulse">
            <span className="text-3xl">🐬</span>
          </div>
          <p className="text-gray-600">Loading FlowLingo...</p>
        </div>
      </div>
    );
  }
  
  // Show login/signup for unauthenticated users
  if (!isAuthenticated) {
    return (
      <Switch>
        <Route path="/signup" component={Signup} />
        <Route path="/login" component={Login} />
        <Route component={Login} /> {/* Default to login for any other route */}
      </Switch>
    );
  }
  
  // Show authenticated routes
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/text-generator" component={TextGenerator} />
      <Route path="/ai-conversation" component={AiConversation} />
      <Route path="/pdf-converter" component={PdfConverter} />
      <Route path="/media-reader" component={MediaReader} />
      <Route path="/flashcards" component={Flashcards} />
      <Route path="/assessment" component={Assessment} />
      <Route path="/practice" component={ProgressivePractice} />
      <Route path="/voice-translator" component={VoiceTranslator} />
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
