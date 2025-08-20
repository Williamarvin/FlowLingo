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
    { path: "/practice", icon: "🎯", label: "Practice", color: "text-blue-500" },
    { path: "/ai-conversation", icon: "💬", label: "Conversation", color: "text-green-500" },
    { path: "/text-generator", icon: "📝", label: "Text Generator", color: "text-purple-500" },
    { path: "/media-reader", icon: "📱", label: "Media Reader", color: "text-red-500" },
    { path: "/vocabulary", icon: "📚", label: "Vocabulary", color: "text-yellow-500" },
  ];

  return (
    <div className="w-64 bg-white shadow-lg flex flex-col h-screen fixed left-0 top-0 z-40">
      {/* Logo/Brand - Compact */}
      <div className="p-4 border-b bg-gradient-to-r from-green-500 to-green-600">
        <h1 className="text-xl font-bold text-white">MandarinMaster</h1>
      </div>
      
      {/* User Stats Section - Moved to top for visibility */}
      <div className="px-4 py-3 bg-gray-50 border-b">
        {/* Compact Level & XP */}
        <div className="mb-3">
          <div className="flex items-center justify-between mb-1">
            <span className="text-sm font-bold text-purple-600">Level {currentLevel}</span>
            <span className="text-xs text-gray-500">{currentLevelXp}/{xpPerLevel} XP</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-1.5">
            <div 
              className="bg-gradient-to-r from-purple-400 to-purple-600 h-1.5 rounded-full transition-all duration-500" 
              style={{ width: `${(currentLevelXp / xpPerLevel) * 100}%` }}
            />
          </div>
        </div>
        
        {/* Compact Stats Row */}
        <div className="flex items-center justify-between">
          {/* Streak */}
          <div className="flex items-center gap-1">
            <span className="text-orange-500">🔥</span>
            <span className="text-sm font-bold text-gray-700">{streak}</span>
            <span className="text-xs text-gray-500">day{streak !== 1 ? 's' : ''}</span>
          </div>
          
          {/* Hearts */}
          <div className="flex flex-col items-end">
            <div className="flex items-center gap-0.5">
              {[...Array(5)].map((_, i) => (
                <span key={i} className="text-base">
                  {i < hearts ? '❤️' : '💔'}
                </span>
              ))}
            </div>
            {/* Timer for next heart */}
            {timeToNextHeart && hearts < 5 && (
              <div className="text-xs text-red-600 font-medium mt-0.5 flex items-center gap-1">
                <span>+❤️ in</span>
                <span className="font-mono">{timeToNextHeart}</span>
              </div>
            )}
          </div>
        </div>
      </div>
      
      {/* Navigation Menu - Compact spacing */}
      <nav className="flex-1 py-3 overflow-y-auto">
        <div className="space-y-1 px-2">
          {menuItems.map((item) => {
            const isActive = currentPage === item.path;
            return (
              <button
                key={item.path}
                onClick={() => navigate(item.path)}
                className={`
                  w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-left transition-all duration-200
                  ${isActive 
                    ? 'bg-blue-100 border-l-4 border-blue-500 shadow-sm' 
                    : 'hover:bg-gray-100 border-l-4 border-transparent'
                  }
                `}
              >
                <span className={`${item.color} text-lg`}>{item.icon}</span>
                <span className={`text-sm ${isActive ? 'font-bold text-blue-700' : 'font-medium text-gray-700'}`}>
                  {item.label}
                </span>
              </button>
            );
          })}
        </div>
      </nav>
      
      {/* Quick Actions - Optional compact footer */}
      <div className="p-3 border-t bg-gray-50">
        <button 
          onClick={() => navigate("/practice")}
          className="w-full bg-gradient-to-r from-green-500 to-green-600 text-white font-semibold py-2 px-4 rounded-lg hover:from-green-600 hover:to-green-700 transition-all duration-200 shadow-sm"
        >
          Start Practice 🚀
        </button>
      </div>
    </div>
  );
}