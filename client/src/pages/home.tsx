import { Link, useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import ModernNav from "@/components/modern-nav";
import { ArrowRight, Trophy, Flame, BookOpen, MessageCircle, Headphones, FileText, LogIn, Star, Gift, Sparkles } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";

export default function Home() {
  const [greeting, setGreeting] = useState("");
  const [, setLocation] = useLocation();
  const { isAuthenticated, isLoading } = useAuth();
  const [isJumping, setIsJumping] = useState(false);
  
  // Get user profile data (only if authenticated)
  const { data: userProfile } = useQuery<any>({
    queryKey: ["/api/user/profile"],
    enabled: isAuthenticated,
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

  // Handle feature click for non-authenticated users
  const handleFeatureClick = (href: string) => {
    if (!isAuthenticated) {
      // Store the intended destination
      sessionStorage.setItem('redirectAfterLogin', href);
      setLocation('/login');
    } else {
      setLocation(href);
    }
  };

  // Show different navbar for non-authenticated users
  if (!isAuthenticated && !isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-emerald-50">
        {/* Simple Header for non-authenticated users */}
        <header className="bg-white/90 backdrop-blur-sm border-b border-green-100">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-10 h-10 bg-gradient-to-br from-green-400 to-emerald-500 rounded-xl flex items-center justify-center">
                  <span className="text-xl">🐬</span>
                </div>
                <span className="text-xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
                  FlowLingo
                </span>
              </div>
              <div className="flex items-center gap-4">
                <Link href="/login">
                  <Button variant="ghost" className="text-gray-700">
                    Sign In
                  </Button>
                </Link>
                <Link href="/signup">
                  <Button className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700">
                    Get Started
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </header>

        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          {/* Hero Section for non-authenticated users */}
          <div className="text-center mb-16">
            <h1 className="text-5xl font-bold text-gray-900 mb-6">
              Master Chinese with <span className="bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">FlowLingo</span>
            </h1>
            <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
              Learn Mandarin through AI-powered conversations, interactive lessons, and personalized practice sessions.
            </p>
            <div className="flex gap-4 justify-center">
              <Link href="/signup">
                <Button size="lg" className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-lg px-8 py-6">
                  Start Learning Free
                  <ArrowRight className="ml-2 w-5 h-5" />
                </Button>
              </Link>
              <Link href="/login">
                <Button size="lg" variant="outline" className="border-green-600 text-green-600 hover:bg-green-50 text-lg px-8 py-6">
                  <LogIn className="mr-2 w-5 h-5" />
                  Sign In
                </Button>
              </Link>
            </div>
          </div>

          {/* Features Grid */}
          <div className="mb-16">
            <h2 className="text-3xl font-bold text-center text-gray-900 mb-10">
              Everything you need to learn Chinese
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {features.map((feature) => {
                const Icon = feature.icon;
                return (
                  <div 
                    key={feature.href} 
                    onClick={() => handleFeatureClick(feature.href)}
                    className="group bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-lg transition-all duration-200 cursor-pointer h-full"
                  >
                    <div className={`inline-flex p-3 rounded-lg ${feature.bgColor} mb-4`}>
                      <Icon className={`w-6 h-6 ${feature.color}`} />
                    </div>
                    
                    <h3 className="text-lg font-semibold text-gray-900 mb-2 group-hover:text-green-600">
                      {feature.title}
                    </h3>
                    
                    <p className="text-sm text-gray-600 mb-4">
                      {feature.description}
                    </p>
                    
                    <div className="flex items-center text-sm font-medium text-green-600">
                      <span>Start Learning</span>
                      <ArrowRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Testimonials Section */}
          <div className="mb-16">
            <h2 className="text-3xl font-bold text-center text-gray-900 mb-4">
              Trusted by thousands of learners
            </h2>
            <p className="text-center text-gray-600 mb-10 max-w-2xl mx-auto">
              See what our students say about their Chinese learning journey with FlowLingo
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {/* Testimonial 1 */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <div className="flex mb-4">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-5 h-5 fill-yellow-400 text-yellow-400" />
                  ))}
                </div>
                <p className="text-gray-700 mb-4 italic">
                  "After using FlowLingo for just 3 months, I can now hold basic conversations with my Chinese colleagues. The AI conversations feature is absolutely game-changing!"
                </p>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-purple-400 to-pink-400 rounded-full flex items-center justify-center text-white font-semibold">
                    SL
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900">Sarah Liu</p>
                    <p className="text-sm text-gray-500">3 months with FlowLingo</p>
                  </div>
                </div>
              </div>

              {/* Testimonial 2 */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <div className="flex mb-4">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-5 h-5 fill-yellow-400 text-yellow-400" />
                  ))}
                </div>
                <p className="text-gray-700 mb-4 italic">
                  "I've been using FlowLingo for 6 months and I'm amazed at my progress. I can now read Chinese menus, text with friends, and have day-to-day conversations confidently!"
                </p>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-blue-400 to-cyan-400 rounded-full flex items-center justify-center text-white font-semibold">
                    MJ
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900">Michael Johnson</p>
                    <p className="text-sm text-gray-500">6 months with FlowLingo</p>
                  </div>
                </div>
              </div>

              {/* Testimonial 3 */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <div className="flex mb-4">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-5 h-5 fill-yellow-400 text-yellow-400" />
                  ))}
                </div>
                <p className="text-gray-700 mb-4 italic">
                  "One year with FlowLingo has transformed my Chinese skills. I went from knowing zero Chinese to having full business conversations. The spaced repetition and practice sessions really work!"
                </p>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-green-400 to-emerald-400 rounded-full flex items-center justify-center text-white font-semibold">
                    EW
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900">Emily Wang</p>
                    <p className="text-sm text-gray-500">1 year with FlowLingo</p>
                  </div>
                </div>
              </div>

              {/* Testimonial 4 */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <div className="flex mb-4">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-5 h-5 fill-yellow-400 text-yellow-400" />
                  ))}
                </div>
                <p className="text-gray-700 mb-4 italic">
                  "FlowLingo made learning Chinese fun! After 4 months, I can watch Chinese dramas with Chinese subtitles and understand most of the dialogue. The voice translator is my favorite feature!"
                </p>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-orange-400 to-red-400 rounded-full flex items-center justify-center text-white font-semibold">
                    DR
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900">David Rodriguez</p>
                    <p className="text-sm text-gray-500">4 months with FlowLingo</p>
                  </div>
                </div>
              </div>

              {/* Testimonial 5 */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <div className="flex mb-4">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-5 h-5 fill-yellow-400 text-yellow-400" />
                  ))}
                </div>
                <p className="text-gray-700 mb-4 italic">
                  "I started FlowLingo 2 months ago with zero Chinese knowledge. Now I can order food in Chinese restaurants and have simple conversations. The structured lessons are perfect!"
                </p>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-indigo-400 to-purple-400 rounded-full flex items-center justify-center text-white font-semibold">
                    AK
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900">Anna Kim</p>
                    <p className="text-sm text-gray-500">2 months with FlowLingo</p>
                  </div>
                </div>
              </div>

              {/* Testimonial 6 */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <div className="flex mb-4">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-5 h-5 fill-yellow-400 text-yellow-400" />
                  ))}
                </div>
                <p className="text-gray-700 mb-4 italic">
                  "After 8 months on FlowLingo, I passed HSK 4! The assessment features helped me identify weak areas and the AI conversations gave me real practice. Can't recommend it enough!"
                </p>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-teal-400 to-cyan-400 rounded-full flex items-center justify-center text-white font-semibold">
                    TN
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900">Thomas Nguyen</p>
                    <p className="text-sm text-gray-500">8 months with FlowLingo</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* CTA Section */}
          <div className="bg-gradient-to-br from-green-600 to-emerald-600 rounded-2xl p-12 text-center text-white">
            <h2 className="text-3xl font-bold mb-4">Ready to start your journey?</h2>
            <p className="text-lg mb-8 opacity-90">Join thousands of learners mastering Chinese with FlowLingo</p>
            <Link href="/signup">
              <Button size="lg" className="bg-white text-green-600 hover:bg-gray-50 text-lg px-8 py-6">
                Get Started for Free
                <ArrowRight className="ml-2 w-5 h-5" />
              </Button>
            </Link>
          </div>
        </main>
      </div>
    );
  }

  // Show authenticated user interface
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
              
              {/* Mascot Visual */}
              <div className="lg:w-1/3 flex justify-center">
                <motion.div 
                  className="relative cursor-pointer"
                  onClick={() => {
                    setIsJumping(true);
                    setTimeout(() => setIsJumping(false), 600);
                  }}
                  animate={isJumping ? {
                    y: [0, -40, 0],
                    rotate: [0, -15, 15, 0]
                  } : {}}
                  transition={{ duration: 0.6 }}
                >
                  <div className="w-48 h-48 bg-gradient-to-br from-blue-400 to-cyan-500 rounded-full flex items-center justify-center shadow-xl">
                    <span className="text-8xl animate-bounce">{userProfile?.selectedMascot || "🐬"}</span>
                  </div>
                  <div className="absolute -bottom-2 -right-2 bg-white rounded-full px-3 py-1 shadow-md border border-gray-200">
                    <span className="text-sm font-semibold text-gray-700">Your Mascot</span>
                  </div>
                </motion.div>
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
          
          {/* Sticker Rewards Notification */}
          {userProfile && (
            <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl shadow-sm border border-purple-200 p-6 mb-8">
              <div className="flex items-start gap-4">
                <div className="p-3 bg-white rounded-xl shadow-sm">
                  <Gift className="w-6 h-6 text-purple-500" />
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2 flex items-center gap-2">
                    Earn Animal Stickers as You Learn!
                    <Sparkles className="w-4 h-4 text-yellow-500" />
                  </h3>
                  <div className="text-sm text-gray-600 space-y-2 mb-3">
                    <p>
                      You're currently <span className="font-semibold text-purple-600">Level {userProfile.level}</span>. 
                      {(() => {
                        const level = userProfile.level;
                        const nextStickerLevel = Math.ceil((level + 1) / 3) * 3;
                        const hskTransitions = [11, 21, 31, 41, 51];
                        const nextHskTransition = hskTransitions.find(l => l > level);
                        const majorMilestones = [25, 50, 75, 100];
                        const nextMilestone = majorMilestones.find(l => l > level);
                        
                        let nextReward = nextStickerLevel;
                        let rewardType = "a sticker";
                        
                        // Check which reward comes first
                        if (nextHskTransition && (!nextReward || nextHskTransition < nextReward)) {
                          nextReward = nextHskTransition;
                          rewardType = "a guaranteed epic or legendary sticker (HSK level up!)";
                        }
                        if (level % 10 === 9) {
                          nextReward = level + 1;
                          rewardType = "2 stickers with better odds";
                        }
                        if (nextMilestone && nextMilestone - level <= 3) {
                          nextReward = nextMilestone;
                          rewardType = "3 guaranteed rare+ stickers (major milestone!)";
                        }
                        
                        const levelsToGo = nextReward - level;
                        
                        return (
                          <>
                            <div className="bg-white/60 rounded-lg p-2 inline-block">
                              <span className="text-2xl font-bold text-purple-700">{levelsToGo}</span>
                              <span className="text-base font-medium text-purple-600 ml-2">
                                level{levelsToGo > 1 ? 's' : ''} to go
                              </span>
                            </div>
                            <div>
                              Next reward at <span className="font-semibold text-purple-600">Level {nextReward}</span> - {rewardType}
                            </div>
                          </>
                        );
                      })()}
                    </p>
                    <div className="flex flex-wrap gap-3 text-xs">
                      <span className="bg-white px-2 py-1 rounded-full">Every 3 levels: 1 sticker</span>
                      <span className="bg-white px-2 py-1 rounded-full">Every 10 levels: 2 bonus stickers</span>
                      <span className="bg-purple-100 px-2 py-1 rounded-full">HSK transitions: Epic/Legendary guaranteed!</span>
                    </div>
                  </div>
                  <Link href="/rewards">
                    <Button variant="outline" size="sm" className="border-purple-300 text-purple-700 hover:bg-purple-50">
                      View Your Collection
                      <ArrowRight className="w-3 h-3 ml-1" />
                    </Button>
                  </Link>
                </div>
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
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 mb-12">
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

        {/* Testimonials Section */}
        <div className="mb-12">
          <h2 className="text-2xl font-semibold text-gray-900 mb-6 text-center">
            What our learners say
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Testimonial 1 */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex mb-4">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-5 h-5 fill-yellow-400 text-yellow-400" />
                ))}
              </div>
              <p className="text-gray-700 mb-4 italic">
                "After using FlowLingo for just 3 months, I can now hold basic conversations with my Chinese colleagues. The AI conversations feature is absolutely game-changing!"
              </p>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-purple-400 to-pink-400 rounded-full flex items-center justify-center text-white font-semibold">
                  SL
                </div>
                <div>
                  <p className="font-semibold text-gray-900">Sarah Liu</p>
                  <p className="text-sm text-gray-500">3 months with FlowLingo</p>
                </div>
              </div>
            </div>

            {/* Testimonial 2 */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex mb-4">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-5 h-5 fill-yellow-400 text-yellow-400" />
                ))}
              </div>
              <p className="text-gray-700 mb-4 italic">
                "I've been using FlowLingo for 6 months and I'm amazed at my progress. I can now read Chinese menus, text with friends, and have day-to-day conversations confidently!"
              </p>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-400 to-cyan-400 rounded-full flex items-center justify-center text-white font-semibold">
                  MJ
                </div>
                <div>
                  <p className="font-semibold text-gray-900">Michael Johnson</p>
                  <p className="text-sm text-gray-500">6 months with FlowLingo</p>
                </div>
              </div>
            </div>

            {/* Testimonial 3 */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex mb-4">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-5 h-5 fill-yellow-400 text-yellow-400" />
                ))}
              </div>
              <p className="text-gray-700 mb-4 italic">
                "One year with FlowLingo has transformed my Chinese skills. I went from knowing zero Chinese to having full business conversations. The practice sessions really work!"
              </p>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-green-400 to-emerald-400 rounded-full flex items-center justify-center text-white font-semibold">
                  EW
                </div>
                <div>
                  <p className="font-semibold text-gray-900">Emily Wang</p>
                  <p className="text-sm text-gray-500">1 year with FlowLingo</p>
                </div>
              </div>
            </div>

            {/* Testimonial 4 */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex mb-4">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-5 h-5 fill-yellow-400 text-yellow-400" />
                ))}
              </div>
              <p className="text-gray-700 mb-4 italic">
                "FlowLingo made learning Chinese fun! After 4 months, I can watch Chinese dramas with Chinese subtitles and understand most of the dialogue. Love the voice translator!"
              </p>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-orange-400 to-red-400 rounded-full flex items-center justify-center text-white font-semibold">
                  DR
                </div>
                <div>
                  <p className="font-semibold text-gray-900">David Rodriguez</p>
                  <p className="text-sm text-gray-500">4 months with FlowLingo</p>
                </div>
              </div>
            </div>

            {/* Testimonial 5 */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex mb-4">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-5 h-5 fill-yellow-400 text-yellow-400" />
                ))}
              </div>
              <p className="text-gray-700 mb-4 italic">
                "I started FlowLingo 2 months ago with zero Chinese knowledge. Now I can order food in Chinese restaurants and have simple conversations. The structured lessons are perfect!"
              </p>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-indigo-400 to-purple-400 rounded-full flex items-center justify-center text-white font-semibold">
                  AK
                </div>
                <div>
                  <p className="font-semibold text-gray-900">Anna Kim</p>
                  <p className="text-sm text-gray-500">2 months with FlowLingo</p>
                </div>
              </div>
            </div>

            {/* Testimonial 6 */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex mb-4">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-5 h-5 fill-yellow-400 text-yellow-400" />
                ))}
              </div>
              <p className="text-gray-700 mb-4 italic">
                "After 8 months on FlowLingo, I passed HSK 4! The assessment features helped me identify weak areas and the AI conversations gave me real practice. Can't recommend it enough!"
              </p>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-teal-400 to-cyan-400 rounded-full flex items-center justify-center text-white font-semibold">
                  TN
                </div>
                <div>
                  <p className="font-semibold text-gray-900">Thomas Nguyen</p>
                  <p className="text-sm text-gray-500">8 months with FlowLingo</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}