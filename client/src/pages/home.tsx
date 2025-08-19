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
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      {/* Hero Section */}
      <div className="text-center mb-16">
        <div className="mb-8">
          <img 
            src="https://images.unsplash.com/photo-1434030216411-0b793f4b4173?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=800&h=600" 
            alt="Chinese language learning" 
            className="w-64 h-48 object-cover rounded-2xl mx-auto shadow-lg" 
          />
        </div>
        <h1 className="text-4xl md:text-5xl font-bold text-text-primary mb-6">
          Master Mandarin with <span className="text-brand-blue">AI-Powered</span> Learning
        </h1>
        <p className="text-xl text-text-secondary mb-8 max-w-3xl mx-auto">
          Transform your Chinese learning journey with interactive text translation, AI conversations, PDF processing, and smart vocabulary building.
        </p>
        <Link href="/text-generator">
          <button className="bg-gradient-to-r from-brand-blue to-brand-blue-light hover:from-brand-blue-dark hover:to-brand-blue text-white px-10 py-5 rounded-2xl font-bold text-xl transition-all duration-200 shadow-lg hover:shadow-xl hover:scale-105">
            Start Learning Now <i className="fas fa-arrow-right ml-3"></i>
          </button>
        </Link>
      </div>

      {/* Feature Cards */}
      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
        {features.map((feature) => (
          <Link key={feature.href} href={feature.href}>
            <div className="card-falou p-8 cursor-pointer group">
              <div className={`w-16 h-16 ${feature.bgColor} rounded-2xl flex items-center justify-center mb-6 group-hover:scale-105 transition-transform`}>
                <i className={`${feature.icon} ${feature.iconColor} text-2xl`}></i>
              </div>
              <h3 className="text-xl font-bold text-text-primary mb-3">{feature.title}</h3>
              <p className="text-text-secondary leading-relaxed">{feature.description}</p>
            </div>
          </Link>
        ))}
      </div>

      {/* Stats Section */}
      <div className="card-falou p-10">
        <h3 className="text-2xl font-bold text-text-primary text-center mb-8">Learning Progress</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          {stats.map((stat, index) => (
            <div key={index} className="text-center">
              <div className={`text-4xl font-bold ${stat.color} mb-3`}>{stat.value}</div>
              <div className="text-text-secondary font-medium">{stat.label}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
