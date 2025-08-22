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

  const navTabs = [
    { path: "/levels", label: "Levels", icon: "🗺️" },
    { path: "/practice", label: "Practice", icon: "🎯" },
    { path: "/ai-conversation", label: "Conversations", icon: "💬" },
    { path: "/flashcards", label: "Flashcards", icon: "📚" },
    { path: "/text-generator", label: "Texts", icon: "📝" },
    { path: "/media-reader", label: "Media", icon: "📱" },
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

            {/* Center Navigation - Desktop */}
            <div className="hidden lg:flex items-center gap-3 bg-gray-50 rounded-full p-2 shadow-sm border border-gray-200">
              {navTabs.map((tab, index) => (
                <Link key={tab.path} href={tab.path}>
                  <button
                    className={`
                      px-6 py-3 text-sm font-medium transition-all duration-200 rounded-full
                      flex items-center gap-2 whitespace-nowrap
                      ${location === tab.path 
                        ? 'text-white bg-gradient-to-r from-green-500 to-emerald-500 shadow-lg scale-105' 
                        : 'text-gray-700 hover:text-gray-900 hover:bg-white hover:shadow-md hover:scale-105'
                      }
                    `}
                  >
                    <span className="text-lg">{tab.icon}</span>
                    <span className="font-medium">{tab.label}</span>
                  </button>
                </Link>
              ))}
            </div>

            {/* Right Side - Mascot & Profile */}
            <div className="flex items-center gap-6">
              {/* User Mascot */}
              <Link href="/rewards">
                <div className="text-3xl cursor-pointer hover:scale-110 transition-transform">
                  {userProfile?.selectedMascot || '🐬'}
                </div>
              </Link>

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