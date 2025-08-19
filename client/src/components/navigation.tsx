import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";

export default function Navigation() {
  const [location] = useLocation();

  const navItems = [
    { href: "/", label: "Home", icon: "fas fa-home" },
    { href: "/text-generator", label: "Text Practice", icon: "fas fa-highlighter" },
    { href: "/ai-conversation", label: "AI Chat", icon: "fas fa-robot" },
    { href: "/pdf-converter", label: "PDF Reader", icon: "fas fa-file-pdf" },
    { href: "/vocabulary", label: "Vocabulary", icon: "fas fa-brain" },
  ];

  return (
    <nav className="bg-white shadow-sm border-b border-gray-100 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        <div className="flex justify-between items-center h-20">
          <Link href="/" className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-br from-brand-blue to-brand-blue-dark rounded-2xl flex items-center justify-center shadow-md">
              <span className="text-white font-bold text-lg">中</span>
            </div>
            <span className="text-2xl font-bold text-text-primary">MandarinMaster</span>
          </Link>
          
          <div className="hidden md:flex items-center space-x-2">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "px-4 py-2 rounded-xl text-text-secondary hover:text-brand-blue hover:bg-blue-50 transition-all font-medium",
                  location === item.href && "text-white bg-brand-blue font-semibold shadow-md"
                )}
              >
                {item.label}
              </Link>
            ))}
          </div>
          
          <div className="flex items-center space-x-3">
            <button className="w-10 h-10 rounded-xl bg-gray-100 hover:bg-gray-200 text-text-secondary hover:text-brand-blue transition-colors flex items-center justify-center">
              <i className="fas fa-user text-lg"></i>
            </button>
            <button className="md:hidden w-10 h-10 rounded-xl bg-gray-100 hover:bg-gray-200 text-text-secondary transition-colors flex items-center justify-center">
              <i className="fas fa-bars text-lg"></i>
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
}
