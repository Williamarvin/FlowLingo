import { Link } from "wouter";

export default function Home() {
  const features = [
    {
      href: "/text-generator",
      icon: "fas fa-highlighter",
      iconColor: "text-brand-blue",
      bgColor: "bg-brand-blue bg-opacity-10",
      title: "Interactive Text",
      description: "Generate and highlight Chinese text for instant translations with pinyin"
    },
    {
      href: "/ai-conversation",
      icon: "fas fa-robot",
      iconColor: "text-brand-yellow",
      bgColor: "bg-brand-yellow bg-opacity-10",
      title: "AI Conversation",
      description: "Practice speaking with an AI avatar tutor in real Mandarin conversations"
    },
    {
      href: "/pdf-converter",
      icon: "fas fa-file-pdf",
      iconColor: "text-green-500",
      bgColor: "bg-green-500 bg-opacity-10",
      title: "PDF Reader",
      description: "Upload PDFs and convert to interactive Chinese text with translations"
    },
    {
      href: "/vocabulary",
      icon: "fas fa-brain",
      iconColor: "text-purple-500",
      bgColor: "bg-purple-500 bg-opacity-10",
      title: "Smart Vocabulary",
      description: "Build your word bank with spaced repetition and progress tracking"
    }
  ];

  const stats = [
    { value: "10K+", label: "Words Learned", color: "text-brand-blue" },
    { value: "5K+", label: "Conversations", color: "text-brand-yellow" },
    { value: "1K+", label: "PDFs Processed", color: "text-green-500" },
    { value: "95%", label: "Success Rate", color: "text-purple-500" }
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Hero Section - Duolingo Inspired */}
      <div className="text-center mb-20">
        <div className="mb-12 relative">
          {/* Main mascot area */}
          <div className="relative w-80 h-64 mx-auto mb-8">
            <div className="absolute inset-0 bg-gradient-to-br from-brand-primary to-brand-primary-light rounded-full opacity-10 floating-element"></div>
            <div className="relative z-10 flex items-center justify-center h-full">
              <div className="text-8xl floating-element">🐉</div>
            </div>
            {/* Floating elements around mascot */}
            <div className="absolute -top-4 -right-4 w-12 h-12 bg-brand-secondary rounded-full flex items-center justify-center floating-element text-2xl">
              📖
            </div>
            <div className="absolute -bottom-2 -left-6 w-10 h-10 bg-brand-accent rounded-full flex items-center justify-center floating-element text-lg">
              ✨
            </div>
          </div>
        </div>
        
        <h1 className="text-5xl md:text-6xl font-bold text-text-primary mb-6 leading-tight">
          The fun, effective way to learn <span className="text-brand-primary">Mandarin!</span>
        </h1>
        <p className="text-xl text-text-secondary mb-12 max-w-2xl mx-auto leading-relaxed">
          Master Chinese with AI-powered conversations, interactive text translation, and smart vocabulary practice.
        </p>
        
        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-8">
          <Link href="/text-generator">
            <button className="btn-primary px-12 py-5 text-xl font-bold">
              GET STARTED
            </button>
          </Link>
          <button className="btn-outline px-8 py-4 text-lg">
            I ALREADY HAVE AN ACCOUNT
          </button>
        </div>
        
        {/* Streak counter */}
        <div className="inline-flex items-center streak-counter">
          <span className="mr-2">🔥</span>
          <span>Keep your 5-day streak going!</span>
        </div>
      </div>

      {/* Feature Cards - Duolingo Style */}
      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-20">
        {features.map((feature, index) => (
          <Link key={feature.href} href={feature.href}>
            <div className="card-duo cursor-pointer group relative overflow-hidden">
              <div className="absolute top-0 right-0 w-16 h-16 bg-gradient-to-br from-brand-secondary to-brand-secondary-light rounded-bl-3xl flex items-center justify-center">
                <span className="text-2xl">{['🎯', '💬', '📄', '📚'][index]}</span>
              </div>
              <div className={`w-20 h-20 ${feature.bgColor} rounded-3xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform`}>
                <i className={`${feature.icon} ${feature.iconColor} text-3xl`}></i>
              </div>
              <h3 className="text-xl font-bold text-text-primary mb-3">{feature.title}</h3>
              <p className="text-text-secondary leading-relaxed text-sm">{feature.description}</p>
              <div className="mt-4 flex items-center text-brand-primary font-medium text-sm">
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
            <i className="fas fa-star mr-2"></i>First Lesson
          </span>
          <span className="badge-achievement">
            <i className="fas fa-fire mr-2"></i>5 Day Streak
          </span>
          <span className="badge-achievement">
            <i className="fas fa-trophy mr-2"></i>HSK Level 1
          </span>
          <span className="badge-achievement">
            <i className="fas fa-comments mr-2"></i>Conversationalist
          </span>
        </div>
      </div>
    </div>
  );
}
