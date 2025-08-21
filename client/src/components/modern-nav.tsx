import { Link, useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { useState, useEffect } from "react";
import { ChevronDown, Globe, Menu, User } from "lucide-react";

interface ModernNavProps {
  currentPage?: string;
}

export default function ModernNav({ currentPage }: ModernNavProps) {
  const [location, navigate] = useLocation();
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  
  // Get user profile data
  const { data: userProfile } = useQuery<any>({
    queryKey: ["/api/user/profile"],
    refetchInterval: 10000,
  });

  const hearts = userProfile?.hearts ?? 5;
  const level = userProfile?.level || 1;
  const streak = userProfile?.streakDays || 0;
  const xp = userProfile?.xp || 0;

  const navTabs = [
    { path: "/practice", label: "Practice", icon: "🎯" },
    { path: "/ai-conversation", label: "Conversations", icon: "💬" },
    { path: "/flashcards", label: "Flashcards", icon: "📚" },
    { path: "/text-generator", label: "Texts", icon: "📝" },
    { path: "/media-reader", label: "Media", icon: "📱" },
  ];

  return (
    <>
      {/* Top Navigation Bar - Airbnb Style */}
      <header className="fixed top-0 left-0 right-0 bg-white border-b border-gray-200 z-50">
        <nav className="max-w-screen-xl mx-auto px-6">
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
            <div className="hidden md:flex items-center bg-white border border-gray-300 rounded-full shadow-sm hover:shadow-md transition-shadow">
              {navTabs.map((tab, index) => (
                <Link key={tab.path} href={tab.path}>
                  <button
                    className={`
                      px-4 py-2 text-sm font-medium transition-colors
                      ${index === 0 ? 'rounded-l-full' : ''}
                      ${index === navTabs.length - 1 ? 'rounded-r-full' : ''}
                      ${location === tab.path 
                        ? 'text-gray-900 bg-gray-50' 
                        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                      }
                    `}
                  >
                    <span className="mr-1">{tab.icon}</span>
                    {tab.label}
                  </button>
                </Link>
              ))}
            </div>

            {/* Right Side - Profile & Stats */}
            <div className="flex items-center gap-4">
              {/* Stats Pills */}
              <div className="hidden sm:flex items-center gap-3">
                <div className="flex items-center gap-1 px-3 py-1.5 bg-orange-50 rounded-full">
                  <span className="text-orange-500">🔥</span>
                  <span className="text-sm font-medium text-orange-700">{streak}</span>
                </div>
                <div className="flex items-center gap-1 px-3 py-1.5 bg-green-50 rounded-full">
                  <span className="text-green-500">⭐</span>
                  <span className="text-sm font-medium text-green-700">Lvl {level}</span>
                </div>
                <div className="flex items-center gap-1 px-3 py-1.5 bg-red-50 rounded-full">
                  <span>❤️</span>
                  <span className="text-sm font-medium text-red-700">{hearts}/5</span>
                </div>
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
                    <Link href="/assessment">
                      <button className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50">
                        Assessment Test
                      </button>
                    </Link>
                    <Link href="/voice-translator">
                      <button className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50">
                        Voice Translator
                      </button>
                    </Link>
                    <hr className="my-2 border-gray-200" />
                    <div className="px-4 py-2">
                      <div className="text-xs text-gray-500 mb-1">Progress</div>
                      <div className="text-sm font-medium">{xp} XP Total</div>
                    </div>
                  </div>
                )}
              </div>

              {/* Mobile Menu Toggle */}
              <button
                onClick={() => setShowMobileMenu(!showMobileMenu)}
                className="md:hidden p-2"
              >
                <Menu className="w-6 h-6 text-gray-600" />
              </button>
            </div>
          </div>
        </nav>

        {/* Mobile Navigation */}
        {showMobileMenu && (
          <div className="md:hidden border-t border-gray-200 bg-white">
            <div className="px-6 py-4 space-y-2">
              {navTabs.map((tab) => (
                <Link key={tab.path} href={tab.path}>
                  <button
                    onClick={() => setShowMobileMenu(false)}
                    className={`
                      w-full px-4 py-3 text-left rounded-lg transition-colors
                      ${location === tab.path 
                        ? 'bg-gray-100 text-gray-900 font-medium' 
                        : 'text-gray-600 hover:bg-gray-50'
                      }
                    `}
                  >
                    <span className="mr-2">{tab.icon}</span>
                    {tab.label}
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