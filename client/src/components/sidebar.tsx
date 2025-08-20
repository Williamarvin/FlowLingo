import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";

interface SidebarProps {
  currentPage: string;
}

export default function Sidebar({ currentPage }: SidebarProps) {
  const [, navigate] = useLocation();
  
  // Get user profile data for stats
  const { data: userProfile } = useQuery<any>({
    queryKey: ["/api/user/profile"],
  });

  // Calculate current level XP
  const xpPerLevel = 100;
  const currentLevel = userProfile?.level || 1;
  const totalXp = userProfile?.xp || 0;
  const currentLevelXp = totalXp % xpPerLevel;
  const streak = userProfile?.streakDays || 0;
  const hearts = 5; // Default hearts

  const menuItems = [
    { path: "/", icon: "🏠", label: "Home", color: "text-orange-500" },
    { path: "/practice", icon: "🎯", label: "Practice", color: "text-blue-500" },
    { path: "/ai-conversation", icon: "💬", label: "Conversation", color: "text-green-500" },
    { path: "/text-generator", icon: "📝", label: "Text Generator", color: "text-purple-500" },
    { path: "/media-reader", icon: "📱", label: "Media Reader", color: "text-red-500" },
    { path: "/vocabulary", icon: "📚", label: "Vocabulary", color: "text-yellow-500" },
  ];

  return (
    <div className="w-64 bg-white shadow-lg flex flex-col">
      {/* Logo/Brand */}
      <div className="p-6 border-b">
        <h1 className="text-2xl font-bold text-green-500">MandarinMaster</h1>
      </div>
      
      {/* Navigation Menu */}
      <nav className="flex-1 py-6">
        <div className="space-y-2 px-3">
          {menuItems.map((item) => {
            const isActive = currentPage === item.path;
            return (
              <button
                key={item.path}
                onClick={() => navigate(item.path)}
                className={`
                  w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left transition-colors
                  ${isActive 
                    ? 'bg-blue-100 border-2 border-blue-300' 
                    : 'hover:bg-gray-100'
                  }
                `}
              >
                <span className={`${item.color} text-xl`}>{item.icon}</span>
                <span className={`${isActive ? 'font-bold text-blue-700' : 'font-semibold text-gray-700'}`}>
                  {item.label}
                </span>
              </button>
            );
          })}
        </div>
      </nav>
      
      {/* Stats Section */}
      <div className="p-6 border-t">
        {/* Level Progress */}
        <div className="mb-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-bold text-purple-600">Level {currentLevel}</span>
            <span className="text-xs text-gray-500">{currentLevelXp}/{xpPerLevel}</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-gradient-to-r from-purple-400 to-purple-600 h-2 rounded-full transition-all duration-500" 
              style={{ width: `${(currentLevelXp / xpPerLevel) * 100}%` }}
            ></div>
          </div>
        </div>
        
        {/* Stats Grid */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-orange-500 text-lg">🔥</span>
              <span className="text-sm font-medium text-gray-600">Streak</span>
            </div>
            <span className="font-bold text-gray-900">{streak}</span>
          </div>
          
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-red-500 text-lg">❤️</span>
              <span className="text-sm font-medium text-gray-600">Hearts</span>
            </div>
            <div className="flex">
              {[...Array(5)].map((_, i) => (
                <span key={i} className={`text-sm ${i < hearts ? 'text-red-500' : 'text-gray-300'}`}>
                  {i < hearts ? '❤️' : '🤍'}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}