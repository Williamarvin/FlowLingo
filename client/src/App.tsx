import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import Navigation from "@/components/navigation";
import Home from "@/pages/home";
import TextGenerator from "@/pages/text-generator";
import AiConversation from "@/pages/ai-conversation";
import PdfConverter from "@/pages/pdf-converter";
import MediaReader from "@/pages/media-reader";
import Vocabulary from "@/pages/vocabulary";
import Assessment from "@/pages/assessment";
import ProgressivePractice from "@/pages/progressive-practice";
import NotFound from "@/pages/not-found";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/text-generator" component={TextGenerator} />
      <Route path="/ai-conversation" component={AiConversation} />
      <Route path="/pdf-converter" component={PdfConverter} />
      <Route path="/media-reader" component={MediaReader} />
      <Route path="/vocabulary" component={Vocabulary} />
      <Route path="/assessment" component={Assessment} />
      <Route path="/practice" component={ProgressivePractice} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <div className="min-h-screen bg-background-soft">
          <Navigation />
          <Router />
        </div>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
