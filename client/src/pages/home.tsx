import { Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import ModernNav from "@/components/modern-nav";
import { ArrowRight, Trophy, Flame, BookOpen, MessageCircle, Headphones, FileText } from "lucide-react";

export default function Home() {
  const [greeting, setGreeting] = useState("");
  
  // Get user profile data
  const { data: userProfile } = useQuery<any>({
    queryKey: ["/api/user/profile"],
  });

  useEffect(() => {
    const hour = new Date().getHours();
    if (hour < 12) setGreeting("Good morning");
    else if (hour < 18) setGreeting("Good afternoon");
    else setGreeting("Good evening");
  }, []);

  const features = [
    {
      href: "/practice",
      icon: Trophy,
      title: "Practice Sessions",
      description: "Level-based lessons with adaptive difficulty",
      color: "text-amber-600",
      bgColor: "bg-amber-50"
    },
    {
      href: "/ai-conversation",
      icon: MessageCircle,
      title: "AI Conversations",
      description: "Chat with AI in real Mandarin conversations",
      color: "text-blue-600",
      bgColor: "bg-blue-50"
    },
    {
      href: "/flashcards",
      icon: BookOpen,
      title: "Smart Flashcards",
      description: "Review vocabulary with spaced repetition",
      color: "text-purple-600",
      bgColor: "bg-purple-50"
    },
    {
      href: "/text-generator",
      icon: FileText,
      title: "Interactive Texts",
      description: "Generate Chinese texts with instant translation",
      color: "text-green-600",
      bgColor: "bg-green-50"
    },
    {
      href: "/voice-translator",
      icon: Headphones,
      title: "Voice Translator",
      description: "Speak Mandarin and get instant translations",
      color: "text-red-600",
      bgColor: "bg-red-50"
    },
    {
      href: "/media-reader",
      icon: FileText,
      title: "Media Reader",
      description: "Upload PDFs, images, and videos to learn",
      color: "text-indigo-600",
      bgColor: "bg-indigo-50"
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <ModernNav />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Hero Section - Airbnb Style */}
        <div className="mb-12">
          {/* Welcome Banner */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8 mb-8">
            <div className="flex flex-col lg:flex-row items-center justify-between">
              <div className="lg:w-2/3 mb-6 lg:mb-0">
                <h1 className="text-4xl font-semibold text-gray-900 mb-3">
                  {greeting}, language learner!
                </h1>
                <p className="text-lg text-gray-600 mb-6">
                  Master Chinese with AI-powered lessons, real conversations, and interactive content.
                </p>
                
                {/* Quick Stats */}
                {userProfile && (
                  <div className="flex flex-wrap gap-6 mb-6">
                    <div className="flex items-center gap-2">
                      <Flame className="w-5 h-5 text-orange-500" />
                      <span className="text-sm font-medium text-gray-700">
                        {userProfile.streakDays || 0} day streak
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Trophy className="w-5 h-5 text-yellow-500" />
                      <span className="text-sm font-medium text-gray-700">
                        Level {userProfile.level || 1}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-gray-700">
                        {userProfile.xp || 0} XP earned
                      </span>
                    </div>
                  </div>
                )}
                
                {/* CTA Buttons */}
                <div className="flex flex-wrap gap-4">
                  <Link href={userProfile?.assessmentCompleted ? "/practice" : "/assessment"}>
                    <button className="px-8 py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white font-medium rounded-lg hover:from-green-700 hover:to-emerald-700 transition-colors flex items-center gap-2">
                      {userProfile?.assessmentCompleted ? "Continue Learning" : "Take Assessment"}
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </Link>
                  
                  {!userProfile?.assessmentCompleted && (
                    <Link href="/practice">
                      <button className="px-8 py-3 bg-white border-2 border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition-colors">
                        Skip to Practice
                      </button>
                    </Link>
                  )}
                </div>
              </div>
              
              {/* Mascot Image */}
              <div className="lg:w-1/3 flex justify-center">
                <img 
                  src="/flowlingo-dolphin-mascot.svg" 
                  alt="FlowLingo Mascot" 
                  className="w-48 h-48 object-contain"
                />
              </div>
            </div>
          </div>
          
          {/* Progress Card - If user has progress */}
          {userProfile && userProfile.xp > 0 && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-8">
              <h3 className="text-sm font-medium text-gray-600 mb-3">Your Progress</h3>
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm text-gray-600">
                  Level {userProfile.level} Progress
                </span>
                <span className="text-sm font-medium text-gray-900">
                  {userProfile.xp % 100}/100 XP
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-gradient-to-r from-green-500 to-emerald-500 h-2 rounded-full transition-all duration-500"
                  style={{ width: `${(userProfile.xp % 100)}%` }}
                />
              </div>
            </div>
          )}
        </div>

        {/* Features Grid - Airbnb Style Cards */}
        <div className="mb-12">
          <h2 className="text-2xl font-semibold text-gray-900 mb-6">
            Start your learning journey
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature) => {
              const Icon = feature.icon;
              return (
                <Link key={feature.href} href={feature.href}>
                  <div className="group bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-all duration-200 cursor-pointer h-full">
                    <div className={`inline-flex p-3 rounded-lg ${feature.bgColor} mb-4`}>
                      <Icon className={`w-6 h-6 ${feature.color}`} />
                    </div>
                    
                    <h3 className="text-lg font-semibold text-gray-900 mb-2 group-hover:text-gray-700">
                      {feature.title}
                    </h3>
                    
                    <p className="text-sm text-gray-600 mb-4">
                      {feature.description}
                    </p>
                    
                    <div className="flex items-center text-sm font-medium text-gray-900 group-hover:text-gray-700">
                      <span>Get started</span>
                      <ArrowRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" />
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>

        {/* Stats Section */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
          <h2 className="text-2xl font-semibold text-gray-900 mb-6 text-center">
            Join thousands of learners
          </h2>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            <div>
              <div className="text-3xl font-semibold text-gray-900">10K+</div>
              <div className="text-sm text-gray-600 mt-1">Active Learners</div>
            </div>
            <div>
              <div className="text-3xl font-semibold text-gray-900">50K+</div>
              <div className="text-sm text-gray-600 mt-1">Lessons Completed</div>
            </div>
            <div>
              <div className="text-3xl font-semibold text-gray-900">95%</div>
              <div className="text-sm text-gray-600 mt-1">Success Rate</div>
            </div>
            <div>
              <div className="text-3xl font-semibold text-gray-900">4.9</div>
              <div className="text-sm text-gray-600 mt-1">User Rating</div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}