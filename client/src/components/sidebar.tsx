import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { useState, useEffect } from "react";

interface SidebarProps {
  currentPage: string;
}

export default function Sidebar({ currentPage }: SidebarProps) {
  const [, navigate] = useLocation();
  const [timeToNextHeart, setTimeToNextHeart] = useState<string>("");
  
  // Get user profile data for stats
  const { data: userProfile } = useQuery<any>({
    queryKey: ["/api/user/profile"],
    refetchInterval: 10000, // Refetch every 10 seconds to update hearts
  });

  // Calculate current level XP
  const xpPerLevel = 100;
  const currentLevel = userProfile?.level || 1;
  const totalXp = userProfile?.xp || 0;
  const currentLevelXp = totalXp % xpPerLevel;
  const streak = userProfile?.streakDays || 0;
  const hearts = userProfile?.hearts ?? 5;
  const lastHeartLostAt = userProfile?.lastHeartLostAt;
  
  // Calculate time to next heart regeneration
  useEffect(() => {
    if (hearts >= 5 || !lastHeartLostAt) {
      setTimeToNextHeart("");
      return;
    }

    const updateTimer = () => {
      const now = new Date().getTime();
      const lastLost = new Date(lastHeartLostAt).getTime();
      const hourInMs = 60 * 60 * 1000;
      const timeSinceLost = now - lastLost;
      const timeUntilRegen = hourInMs - (timeSinceLost % hourInMs);
      
      if (timeUntilRegen <= 0) {
        setTimeToNextHeart("");
        return;
      }
      
      const minutes = Math.floor(timeUntilRegen / 60000);
      const seconds = Math.floor((timeUntilRegen % 60000) / 1000);
      setTimeToNextHeart(`${minutes}:${seconds.toString().padStart(2, '0')}`);
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    
    return () => clearInterval(interval);
  }, [hearts, lastHeartLostAt]);

  const menuItems = [
    { path: "/", icon: "🏠", label: "Home", color: "text-orange-500" },
    { path: "/assessment", icon: "📊", label: "Assessment", color: "text-indigo-500" },
    { path: "/practice", icon: "🎯", label: "Practice", color: "text-green-500" },
    { path: "/ai-conversation", icon: "💬", label: "Conversation", color: "text-green-500" },
    { path: "/voice-translator", icon: "🎙️", label: "Voice Translator", color: "text-cyan-500" },
    { path: "/flashcards", icon: "📚", label: "Flashcards", color: "text-yellow-500" },
    { path: "/text-generator", icon: "📝", label: "Text Generator", color: "text-purple-500" },
    { path: "/media-reader", icon: "📱", label: "Media Reader", color: "text-red-500" },
  ];

  return (
    <div className="w-64 flex flex-col h-screen fixed left-0 top-0 z-40 bg-gradient-to-br from-green-600 to-emerald-700 shadow-2xl">
      {/* Logo/Brand - Modern */}
      <div className="p-5 bg-white/10 backdrop-blur-md border-b border-white/20">
        <div className="flex items-center gap-3">
          <img src="/flowlingo-mascot-icon.svg" alt="FlowLingo" className="w-10 h-10 rounded-lg" />
          <h1 className="text-2xl font-bold text-white tracking-tight">FlowLingo</h1>
        </div>
      </div>
      
      {/* User Stats Section - Modern Glass Effect */}
      <div className="px-4 py-4 bg-white/10 backdrop-blur-md border-b border-white/20">
        {/* Compact Level & XP */}
        <div className="mb-3">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-bold text-green-100">Level {currentLevel}</span>
            <span className="text-xs text-green-200/80">{currentLevelXp}/{xpPerLevel} XP</span>
          </div>
          <div className="w-full bg-green-900/30 rounded-full h-2 overflow-hidden">
            <div 
              className="bg-gradient-to-r from-green-400 to-emerald-400 h-2 rounded-full transition-all duration-500 shadow-sm" 
              style={{ width: `${(currentLevelXp / xpPerLevel) * 100}%` }}
            />
          </div>
        </div>
        
        {/* Compact Stats Row */}
        <div className="flex items-center justify-between">
          {/* Streak */}
          <div className="flex items-center gap-1 bg-green-800/30 px-2 py-1 rounded-lg border border-green-400/20">
            <span className="text-yellow-300">🔥</span>
            <span className="text-sm font-bold text-green-100">{streak}</span>
            <span className="text-xs text-green-200/70">day{streak !== 1 ? 's' : ''}</span>
          </div>
          
          {/* Hearts */}
          <div className="flex flex-col items-end">
            <div className="flex items-center gap-0.5">
              {[...Array(5)].map((_, i) => (
                <span key={i} className="text-base">
                  {i < hearts ? '❤️' : '🤍'}
                </span>
              ))}
            </div>
            {/* Timer for next heart */}
            {timeToNextHeart && hearts < 5 && (
              <div className="text-xs text-green-200 font-medium mt-0.5 flex items-center gap-1 bg-green-800/30 px-2 py-0.5 rounded border border-green-400/20">
                <span>+❤️ in</span>
                <span className="font-mono">{timeToNextHeart}</span>
              </div>
            )}
          </div>
        </div>
      </div>
      
      {/* Navigation Menu - Modern Glass Effect */}
      <nav className="flex-1 py-4 overflow-y-auto">
        <div className="space-y-1 px-3">
          {menuItems.map((item) => {
            const isActive = currentPage === item.path;
            return (
              <button
                key={item.path}
                onClick={() => navigate(item.path)}
                className={`
                  w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-all duration-200
                  ${isActive 
                    ? 'bg-green-400/20 backdrop-blur-sm shadow-lg transform scale-[1.02] border border-green-400/30' 
                    : 'hover:bg-green-600/20 hover:backdrop-blur-sm border border-transparent'
                  }
                `}
              >
                <span className="text-xl filter drop-shadow-sm">{item.icon}</span>
                <span className={`text-sm ${isActive ? 'font-bold text-green-100' : 'font-medium text-green-200/90'}`}>
                  {item.label}
                </span>
              </button>
            );
          })}
        </div>
      </nav>
      
      {/* Quick Actions - Modern Glass Footer */}
      <div className="p-4 bg-green-800/20 backdrop-blur-md border-t border-green-400/20">
        <button 
          onClick={() => navigate("/practice")}
          className="w-full bg-gradient-to-r from-green-400 to-emerald-400 text-green-900 font-bold py-3 px-4 rounded-xl hover:from-green-300 hover:to-emerald-300 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-[1.02] active:scale-[0.98]"
        >
          Start Practice 🚀
        </button>
      </div>
    </div>
  );
}