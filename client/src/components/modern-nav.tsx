import { Link, useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useState, useEffect } from "react";
import { ChevronDown, Globe, Menu, User, LogOut, RefreshCw } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { toast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";

interface ModernNavProps {
  currentPage?: string;
}

export default function ModernNav({ currentPage }: ModernNavProps) {
  const [location, navigate] = useLocation();
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const { isAuthenticated, user, logout } = useAuth();
  
  // Get user profile data
  const { data: userProfile } = useQuery<any>({
    queryKey: ["/api/user/profile"],
    refetchInterval: 10000,
    enabled: isAuthenticated,
  });

  const hearts = userProfile?.hearts ?? 5;
  const level = userProfile?.level || 1;
  const streak = userProfile?.streakDays || 0;
  const xp = userProfile?.xp || 0;
  const userEmail = userProfile?.email;
  
  // State for heart regeneration countdown
  const [heartCountdown, setHeartCountdown] = useState<string | null>(null);
  
  // Update heart countdown timer
  useEffect(() => {
    if (userProfile?.nextHeartIn && hearts < 5) {
      const interval = setInterval(() => {
        if (userProfile.nextHeartIn) {
          const now = Date.now();
          const lastUpdate = userProfile._lastUpdateTime || now;
          const elapsedSeconds = Math.floor((now - lastUpdate) / 1000);
          const remainingSeconds = Math.max(0, userProfile.nextHeartIn - elapsedSeconds);
          
          if (remainingSeconds <= 0) {
            setHeartCountdown(null);
            // Refetch profile to get updated hearts
            queryClient.invalidateQueries({ queryKey: ["/api/user/profile"] });
          } else {
            const minutes = Math.floor(remainingSeconds / 60);
            const seconds = remainingSeconds % 60;
            setHeartCountdown(`${minutes}:${String(seconds).padStart(2, '0')}`);
          }
        }
      }, 1000);
      
      // Set initial countdown
      if (userProfile.nextHeartIn) {
        const minutes = Math.floor(userProfile.nextHeartIn / 60);
        const seconds = userProfile.nextHeartIn % 60;
        setHeartCountdown(`${minutes}:${String(seconds).padStart(2, '0')}`);
        // Store update time for countdown calculation
        userProfile._lastUpdateTime = Date.now();
      }
      
      return () => clearInterval(interval);
    } else {
      setHeartCountdown(null);
    }
  }, [userProfile?.nextHeartIn, hearts]);

  // Refill hearts mutation (dev only)
  const refillHeartsMutation = useMutation({
    mutationFn: async () => {
      return await apiRequest("POST", "/api/user/refill-hearts");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/user/profile"] });
      toast({
        title: "Hearts Refilled!",
        description: "You now have 5 hearts.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to refill hearts.",
        variant: "destructive",
      });
    },
  });

  // State for expandable menus (desktop only)
  const [expandedMenu, setExpandedMenu] = useState<string | null>(null);

  // Close expanded menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (expandedMenu && !(event.target as Element).closest('[data-nav-dropdown]')) {
        setExpandedMenu(null);
      }
    };
    
    if (expandedMenu) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [expandedMenu]);
  
  const navTabs = [
    { path: "/levels", label: "Levels", icon: "🗺️" },
    { path: "/practice", label: "Practice", icon: "🎯" },
    { path: "/ai-conversation", label: "Conversations", icon: "💬" },
    { path: "/flashcards", label: "Flashcards", icon: "📚" },
    { path: "/text-generator", label: "Texts", icon: "📝" },
    { path: "/media-reader", label: "Media", icon: "📱" },
  ];

  // Grouped navigation for desktop expandable menus
  const navGroups = [
    {
      id: "quest",
      label: "Quest",
      icon: "🎯",
      items: [
        { path: "/levels", label: "Levels", icon: "🗺️" },
        { path: "/practice", label: "Practice", icon: "🎯" },
        { path: "/flashcards", label: "Flashcards", icon: "📚" },
      ]
    },
    {
      id: "conversation", 
      label: "Conversation",
      icon: "💬",
      items: [
        { path: "/ai-conversation", label: "AI Chat", icon: "💬" },
      ]
    },
    {
      id: "tools",
      label: "Tools", 
      icon: "🛠️",
      items: [
        { path: "/text-generator", label: "Text Generator", icon: "📝" },
        { path: "/media-reader", label: "Media Reader", icon: "📱" },
      ]
    }
  ];

  return (
    <>
      {/* Top Navigation Bar - Clean & Spacious */}
      <header className="fixed top-0 left-0 right-0 bg-white border-b border-gray-200 z-50">
        <nav className="max-w-screen-2xl mx-auto px-8">
          <div className="flex items-center justify-between h-20">
            {/* Logo */}
            <Link href="/">
              <div className="flex items-center gap-2 cursor-pointer">
                <div className="w-10 h-10 bg-gradient-to-br from-green-400 to-emerald-500 rounded-lg p-1.5 shadow-sm">
                  <img src="/flowlingo-mascot-icon.svg" alt="FlowLingo" className="w-full h-full" />
                </div>
                <span className="text-xl font-semibold text-gray-900 hidden sm:block">FlowLingo</span>
              </div>
            </Link>

            {/* Center Navigation - Desktop with Expandable Menus */}
            <div className="hidden lg:flex items-center gap-3 bg-gray-50 rounded-full p-2 shadow-sm border border-gray-200 relative">
              {navGroups.map((group) => {
                const isExpanded = expandedMenu === group.id;
                const hasActiveItem = group.items.some(item => location === item.path);
                
                return (
                  <div key={group.id} className="relative" data-nav-dropdown>
                    <button
                      onClick={() => setExpandedMenu(isExpanded ? null : group.id)}
                      className={`
                        px-6 py-3 text-sm font-medium transition-all duration-200 rounded-full
                        flex items-center gap-2 whitespace-nowrap
                        ${hasActiveItem 
                          ? 'text-white bg-gradient-to-r from-green-500 to-emerald-500 shadow-lg' 
                          : 'text-gray-700 hover:text-gray-900 hover:bg-white hover:shadow-md'
                        }
                      `}
                    >
                      <span className="text-lg">{group.icon}</span>
                      <span className="font-medium">{group.label}</span>
                      <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`} />
                    </button>
                    
                    {/* Dropdown Menu */}
                    {isExpanded && (
                      <div className="absolute top-full left-0 mt-2 bg-white rounded-xl shadow-lg border border-gray-200 py-2 min-w-[200px] z-50">
                        {group.items.map((item) => (
                          <Link key={item.path} href={item.path}>
                            <button
                              onClick={() => setExpandedMenu(null)}
                              className={`
                                w-full px-4 py-3 text-left rounded-lg mx-2 transition-colors flex items-center gap-3
                                ${location === item.path 
                                  ? 'bg-gradient-to-r from-green-50 to-emerald-50 text-green-700 font-medium' 
                                  : 'text-gray-600 hover:bg-gray-50'
                                }
                              `}
                            >
                              <span className="text-lg">{item.icon}</span>
                              <span>{item.label}</span>
                            </button>
                          </Link>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Right Side - Mascot, Hearts & Profile */}
            <div className="flex items-center gap-4">
              {/* User Mascot */}
              <Link href="/rewards">
                <div className="text-3xl cursor-pointer hover:scale-110 transition-transform">
                  {userProfile?.selectedMascot || '🐬'}
                </div>
              </Link>

              {/* Hearts Display */}
              <div className="flex items-center gap-2 bg-red-50 px-3 py-2 rounded-full border border-red-200">
                <div className="flex items-center gap-0.5">
                  {[...Array(5)].map((_, i) => (
                    <span key={i} className="text-lg">
                      {i < hearts ? '❤️' : '🤍'}
                    </span>
                  ))}
                </div>
                {hearts < 5 && (
                  <div className="flex items-center gap-1 text-xs text-red-600 font-medium border-l border-red-200 pl-2">
                    <span>+❤️</span>
                    <span>{heartCountdown || 'calculating...'}</span>
                  </div>
                )}
              </div>

              {/* Profile Menu */}
              <div className="relative">
                <button
                  onClick={() => setShowProfileMenu(!showProfileMenu)}
                  className="flex items-center gap-2 p-2 border border-gray-300 rounded-full hover:shadow-md transition-shadow"
                >
                  <Menu className="w-4 h-4 text-gray-600" />
                  <div className="w-8 h-8 bg-gradient-to-br from-green-400 to-emerald-500 rounded-full flex items-center justify-center">
                    <User className="w-5 h-5 text-white" />
                  </div>
                </button>

                {/* Dropdown Menu */}
                {showProfileMenu && (
                  <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-lg border border-gray-200 py-2">
                    {isAuthenticated && user && (
                      <div className="px-4 py-2 border-b border-gray-200 mb-2">
                        <div className="text-xs text-gray-500">Signed in as</div>
                        <div className="text-sm font-medium text-gray-900 truncate">{user.email}</div>
                      </div>
                    )}
                    <Link href="/rewards">
                      <button className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50">
                        🏆 Rewards
                      </button>
                    </Link>
                    <Link href="/assessment">
                      <button className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50">
                        📊 Assessment Test
                      </button>
                    </Link>
                    <Link href="/voice-translator">
                      <button className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50">
                        🎤 Voice Translator
                      </button>
                    </Link>
                    <hr className="my-2 border-gray-200" />
                    <div className="px-4 py-2">
                      <div className="text-xs text-gray-500 mb-1">Progress</div>
                      <div className="text-sm font-medium">{xp} XP Total</div>
                    </div>
                    
                    {/* Dev-only refill hearts button */}
                    {(userProfile?.id === "user_1755801899558_2ufl5w4mb" || userEmail === "williamarvin111@gmail.com") && hearts < 5 && (
                      <>
                        <hr className="my-2 border-gray-200" />
                        <button
                          onClick={() => refillHeartsMutation.mutate()}
                          disabled={refillHeartsMutation.isPending}
                          className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50 flex items-center gap-2"
                        >
                          <RefreshCw className={`w-4 h-4 ${refillHeartsMutation.isPending ? 'animate-spin' : ''}`} />
                          <span className="text-purple-600 font-medium">Refill Hearts (Dev)</span>
                        </button>
                      </>
                    )}
                    {isAuthenticated && (
                      <>
                        <hr className="my-2 border-gray-200" />
                        <button 
                          onClick={() => {
                            setShowProfileMenu(false);
                            logout();
                          }}
                          className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
                        >
                          <LogOut className="w-4 h-4" />
                          Sign Out
                        </button>
                      </>
                    )}
                  </div>
                )}
              </div>

              {/* Mobile Menu Toggle */}
              <button
                onClick={() => setShowMobileMenu(!showMobileMenu)}
                className="lg:hidden p-2 border border-gray-300 rounded-lg hover:shadow-md transition-shadow"
              >
                <Menu className="w-6 h-6 text-gray-600" />
              </button>
            </div>
          </div>
        </nav>

        {/* Mobile Navigation */}
        {showMobileMenu && (
          <div className="lg:hidden border-t border-gray-200 bg-white">
            <div className="px-6 py-4 space-y-2">
              {/* Hearts Display in Mobile */}
              <div className="flex items-center justify-center gap-2 bg-red-50 px-4 py-3 rounded-lg mb-2 border border-red-200">
                <div className="flex items-center gap-0.5">
                  {[...Array(5)].map((_, i) => (
                    <span key={i} className="text-xl">
                      {i < hearts ? '❤️' : '🤍'}
                    </span>
                  ))}
                </div>
                {hearts < 5 && (
                  <div className="flex items-center gap-1 text-sm text-red-600 font-medium border-l border-red-200 pl-2">
                    <span>+❤️</span>
                    <span>{userProfile?.nextHeartIn ? 
                      `${Math.floor(userProfile.nextHeartIn / 60)}:${String(userProfile.nextHeartIn % 60).padStart(2, '0')}` : 
                      'soon'
                    }</span>
                  </div>
                )}
              </div>
              
              {navTabs.map((tab) => (
                <Link key={tab.path} href={tab.path}>
                  <button
                    onClick={() => setShowMobileMenu(false)}
                    className={`
                      w-full px-4 py-3 text-left rounded-lg transition-colors flex items-center gap-2
                      ${location === tab.path 
                        ? 'bg-gradient-to-r from-green-50 to-emerald-50 text-green-700 font-medium' 
                        : 'text-gray-600 hover:bg-gray-50'
                      }
                    `}
                  >
                    <span className="text-lg">{tab.icon}</span>
                    <span>{tab.label}</span>
                  </button>
                </Link>
              ))}
            </div>
          </div>
        )}
      </header>

      {/* Spacer for fixed header */}
      <div className="h-20" />
    </>
  );
}