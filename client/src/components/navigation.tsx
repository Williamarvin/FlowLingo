import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";
import { useState } from "react";

export default function Navigation() {
  const [location] = useLocation();
  const [showUserMenu, setShowUserMenu] = useState(false);

  const navItems = [
    { href: "/", label: "Home", icon: "fas fa-home" },
    { href: "/text-generator", label: "Text Practice", icon: "fas fa-highlighter" },
    { href: "/ai-conversation", label: "AI Chat", icon: "fas fa-robot" },
    { href: "/pdf-converter", label: "PDF Reader", icon: "fas fa-file-pdf" },
    { href: "/vocabulary", label: "Vocabulary", icon: "fas fa-brain" },
  ];

  return (
    <>
      {/* Overlay to close dropdown when clicking outside */}
      {showUserMenu && (
        <div 
          className="fixed inset-0 z-40" 
          onClick={() => setShowUserMenu(false)}
        ></div>
      )}
      
      <nav className="bg-white shadow-sm border-b border-gray-100 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        <div className="flex justify-between items-center h-20">
          <Link href="/" className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-br from-brand-blue to-brand-blue-dark rounded-2xl flex items-center justify-center shadow-md">
              <span className="text-white font-bold text-lg">中</span>
            </div>
            <span className="text-2xl font-bold text-gray-900">MandarinMaster</span>
          </Link>
          
          <div className="hidden md:flex items-center space-x-2">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "px-4 py-2 rounded-xl text-gray-700 hover:text-brand-blue hover:bg-blue-50 transition-all font-medium",
                  location === item.href && "text-white bg-brand-blue font-semibold shadow-md"
                )}
              >
                {item.label}
              </Link>
            ))}
          </div>
          
          <div className="flex items-center space-x-3">
            {/* User Profile Dropdown */}
            <div className="relative">
              <button 
                onClick={() => setShowUserMenu(!showUserMenu)}
                className="w-10 h-10 rounded-xl bg-white border-2 border-brand-blue hover:bg-brand-blue hover:text-white text-brand-blue transition-all duration-200 flex items-center justify-center shadow-md"
              >
                <svg 
                  className="w-5 h-5" 
                  fill="currentColor" 
                  viewBox="0 0 20 20"
                >
                  <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                </svg>
              </button>
              
              {showUserMenu && (
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-lg border border-gray-200 py-2 z-50">
                  <div className="px-4 py-2 border-b border-gray-100">
                    <p className="text-sm font-medium text-gray-900">Demo User</p>
                    <p className="text-xs text-gray-600">demo@mandarinmaster.com</p>
                  </div>
                  <button 
                    onClick={() => {
                      localStorage.setItem('userSettings', JSON.stringify({
                        theme: 'light',
                        speechRate: 0.8,
                        reviewGoal: 10,
                        notifications: true
                      }));
                      setShowUserMenu(false);
                    }}
                    className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-gray-900 transition-colors"
                  >
                    <i className="fas fa-cog mr-2"></i>Settings
                  </button>
                  <Link 
                    href="/vocabulary"
                    onClick={() => setShowUserMenu(false)}
                    className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-gray-900 transition-colors block"
                  >
                    <i className="fas fa-chart-bar mr-2"></i>Progress
                  </Link>
                  <button 
                    onClick={() => {
                      const bookmarks = JSON.parse(localStorage.getItem('bookmarks') || '[]');
                      console.log('Your bookmarks:', bookmarks);
                      setShowUserMenu(false);
                    }}
                    className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-gray-900 transition-colors"
                  >
                    <i className="fas fa-heart mr-2"></i>Favorites
                  </button>
                  <hr className="my-1" />
                  <button 
                    onClick={() => {
                      localStorage.clear();
                      sessionStorage.clear();
                      window.location.href = '/';
                    }}
                    className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
                  >
                    <i className="fas fa-sign-out-alt mr-2"></i>Sign Out
                  </button>
                </div>
              )}
            </div>
            
            <button className="md:hidden w-10 h-10 rounded-xl bg-gray-200 hover:bg-gray-300 text-text-primary border border-gray-300 transition-colors flex items-center justify-center">
              <i className="fas fa-bars text-lg"></i>
            </button>
          </div>
        </div>
      </div>
    </nav>
    </>
  );
}
