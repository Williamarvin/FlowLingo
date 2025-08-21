import { Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import Sidebar from "@/components/sidebar";

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
      href: "/text-generator",
      icon: "fas fa-highlighter",
      iconColor: "text-brand-primary-dark",
      bgColor: "bg-brand-primary bg-opacity-20",
      title: "Interactive Text",
      description: "Generate and highlight Chinese text for instant translations with pinyin"
    },
    {
      href: "/ai-conversation",
      icon: "fas fa-robot",
      iconColor: "text-orange-600",
      bgColor: "bg-brand-secondary bg-opacity-20",
      title: "AI Conversation",
      description: "Practice speaking with an AI avatar tutor in real Mandarin conversations"
    },
    {
      href: "/pdf-converter",
      icon: "fas fa-file-pdf",
      iconColor: "text-green-700",
      bgColor: "bg-green-500 bg-opacity-20",
      title: "PDF Reader",
      description: "Upload PDFs and convert to interactive Chinese text with translations"
    },
    {
      href: "/vocabulary",
      icon: "fas fa-brain",
      iconColor: "text-purple-700",
      bgColor: "bg-purple-500 bg-opacity-20",
      title: "Smart Vocabulary",
      description: "Build your word bank with spaced repetition and progress tracking"
    }
  ];

  const stats = [
    { value: "10K+", label: "Words Learned", color: "text-brand-primary" },
    { value: "5K+", label: "Conversations", color: "text-brand-yellow" },
    { value: "1K+", label: "PDFs Processed", color: "text-green-500" },
    { value: "95%", label: "Success Rate", color: "text-purple-500" }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-emerald-50">
      <Sidebar currentPage="/" />
      <div className="ml-64 p-8">
        <div className="max-w-7xl mx-auto animate-fade-in">
          {/* User Progress Header - Modern Glass Design */}
          {userProfile && (
        <div className="modern-card p-8 mb-8 bg-gradient-to-br from-green-500/10 to-emerald-500/10">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="mb-4 md:mb-0">
              <h2 className="text-3xl font-bold mb-4 gradient-text">{greeting}!</h2>
              <div className="flex items-center space-x-8">
                <div className="flex items-center">
                  <div className="p-3 bg-orange-100 rounded-xl mr-3">
                    <span className="text-2xl">🔥</span>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-gray-800">{userProfile.streakDays || 0}</div>
                    <div className="text-xs text-gray-600">day streak</div>
                  </div>
                </div>
                <div className="flex items-center">
                  <div className="p-3 bg-green-100 rounded-xl mr-3">
                    <span className="text-2xl">⭐</span>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-gray-800">Level {userProfile.level || 1}</div>
                    <div className="text-xs text-gray-600">{userProfile.xp || 0} XP</div>
                  </div>
                </div>
                <div className="flex items-center">
                  <div className="p-3 bg-green-100 rounded-xl mr-3">
                    <span className="text-2xl">📚</span>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-gray-800">{userProfile.wordsLearned || 0}</div>
                    <div className="text-xs text-gray-600">words learned</div>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="flex flex-col items-end">
              <div className="mb-2 text-sm text-gray-600 font-medium">XP Progress</div>
              <div className="w-48 bg-white/50 rounded-full h-4 mb-1 overflow-hidden shadow-inner">
                <div 
                  className="h-full bg-gradient-to-r from-green-500 to-emerald-500 rounded-full transition-all duration-500 shadow-sm"
                  style={{ width: `${Math.min(((userProfile.xp || 0) / (userProfile.xpToNextLevel || 100)) * 100, 100)}%` }}
                />
              </div>
              <div className="text-xs text-gray-600 mb-4">
                {userProfile.xp || 0} / {userProfile.xpToNextLevel || 100} XP to Level {(userProfile.level || 1) + 1}
              </div>
              
              {/* Continue Button - Modern Style */}
              <Link href="/practice">
                <button className="modern-button-primary px-8 py-3 font-bold flex items-center space-x-2">
                  <span>Continue</span>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              </Link>
            </div>
          </div>
          
          {!userProfile.assessmentCompleted && (
            <div className="mt-4 p-4 bg-gradient-to-r from-yellow-50 to-orange-50 border border-yellow-200/50 rounded-xl shadow-sm">
              <p className="text-sm mb-2 text-gray-700 font-medium">🎯 Take the assessment test to determine your starting level!</p>
              <Link href="/assessment">
                <button className="bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 text-white font-bold text-sm px-6 py-2 rounded-lg transition-all duration-200 shadow-md hover:shadow-lg">
                  Start Assessment
                </button>
              </Link>
            </div>
          )}
        </div>
          )}

          {/* Hero Section - Modern Design */}
          <div className="text-center mb-20 py-10">
            <div className="mb-12 relative">
          {/* Main mascot area with modern glass effect */}
          <div className="relative w-80 h-64 mx-auto mb-8">
            <div className="absolute inset-0 bg-gradient-to-br from-green-500/20 to-emerald-500/20 rounded-full blur-2xl animate-pulse"></div>
            <div className="relative z-10 flex items-center justify-center h-full">
              <img src="/flowlingo-mascot-v2.svg" alt="FlowLingo Mascot" className="w-56 h-56 drop-shadow-xl animate-float" />
            </div>
            {/* Floating elements with glass effect */}
            <div className="absolute -top-4 -right-4 w-12 h-12 glass-effect rounded-full flex items-center justify-center animate-float-delayed text-2xl">
              📖
            </div>
            <div className="absolute -bottom-2 -left-6 w-10 h-10 glass-effect rounded-full flex items-center justify-center animate-float text-lg">
              ✨
            </div>
          </div>
            </div>
            
            <h1 className="text-5xl md:text-6xl font-bold mb-6 leading-tight">
          <span className="gradient-text">The fun, effective way to learn Mandarin!</span>
            </h1>
            <p className="text-xl text-gray-600 mb-12 max-w-2xl mx-auto leading-relaxed">
          Master Chinese with AI-powered conversations, interactive text translation, and smart vocabulary practice.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-8">
          <Link href={userProfile?.assessmentCompleted ? "/practice" : "/assessment"}>
            <button className="modern-button-primary px-12 py-5 text-xl font-bold">
              {userProfile?.assessmentCompleted ? "CONTINUE LEARNING" : "GET STARTED"}
            </button>
          </Link>
          <button className="modern-button-secondary px-8 py-4 text-lg">
            I ALREADY HAVE AN ACCOUNT
          </button>
            </div>
            
            {/* Streak counter - Modern Style */}
            <div className="inline-flex items-center px-6 py-3 bg-orange-100 rounded-full shadow-md">
          <span className="mr-2 text-2xl">🔥</span>
          <span className="text-orange-700 font-medium">Keep your 5-day streak going!</span>
            </div>
          </div>

          {/* Feature Cards - Modern Glass Style */}
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-20">
        {features.map((feature, index) => (
          <Link key={feature.href} href={feature.href}>
            <div className="modern-card p-6 cursor-pointer group relative overflow-hidden hover:scale-[1.02] transition-all duration-300">
              <div className="absolute top-0 right-0 w-16 h-16 bg-gradient-to-br from-green-500/20 to-emerald-500/20 rounded-bl-3xl flex items-center justify-center">
                <span className="text-2xl">{['🎯', '💬', '📄', '📚'][index]}</span>
              </div>
              <div className={`w-20 h-20 ${feature.bgColor} rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform shadow-lg`}>
                <i className={`${feature.icon} ${feature.iconColor} text-3xl`}></i>
              </div>
              <h3 className="text-xl font-bold text-gray-800 mb-3">{feature.title}</h3>
              <p className="text-gray-600 leading-relaxed text-sm">{feature.description}</p>
              <div className="mt-4 flex items-center text-green-600 font-medium text-sm">
                <span>Start learning</span>
                <i className="fas fa-arrow-right ml-2 group-hover:translate-x-1 transition-transform"></i>
              </div>
            </div>
          </Link>
        ))}
          </div>

          {/* Progress & Stats Section */}
          <div className="bg-white rounded-3xl shadow-xl p-8 mb-12 border-3 border-gray-100">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold text-text-primary mb-4">personalized learning</h2>
          <p className="text-text-secondary text-lg max-w-2xl mx-auto">
            AI-powered lessons adapt to your pace and learning style, making Chinese accessible and fun.
          </p>
        </div>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          {stats.map((stat, index) => (
            <div key={index} className="text-center group">
              <div className="w-16 h-16 bg-gradient-to-br from-brand-primary to-brand-primary-light rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
                <span className="text-2xl text-white">{['📈', '💬', '📚', '⭐'][index]}</span>
              </div>
              <div className="text-3xl font-bold text-brand-primary mb-2">{stat.value}</div>
              <div className="text-text-secondary font-medium text-sm">{stat.label}</div>
            </div>
          ))}
        </div>
          </div>

          {/* Achievement Badges */}
          <div className="text-center">
        <h3 className="text-2xl font-bold text-text-primary mb-6">Your Achievements</h3>
        <div className="flex flex-wrap justify-center gap-3">
          <span className="badge-achievement">
            <i className="fas fa-star mr-2 text-yellow-600"></i>First Lesson
          </span>
          <span className="badge-achievement">
            <i className="fas fa-fire mr-2 text-orange-600"></i>5 Day Streak
          </span>
          <span className="badge-achievement">
            <i className="fas fa-trophy mr-2 text-amber-600"></i>HSK Level 1
          </span>
          <span className="badge-achievement">
            <i className="fas fa-comments mr-2 text-green-600"></i>Conversationalist
          </span>
          </div>
          </div>
        </div>
      </div>
    </div>
  );
}
