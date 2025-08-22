# FlowLingo - Multi-Language Learning Platform

## Overview

FlowLingo is a comprehensive language learning platform that currently specializes in Chinese (Mandarin) with plans for multi-language expansion. The application features a complete multi-user authentication system with email/password login, secure session management, and protected learning routes. Core features include a complete progress tracking system with user levels, XP points, streak tracking, and adaptive difficulty. Key features include text generation with click-to-translate, AI-powered conversations that adapt to user level, voice translator with instant Mandarin-to-English translation, universal media reader (PDF, video, audio, images), vocabulary management with spaced repetition, initial assessment testing, enhanced progressive practice sessions with mandatory retry system and adaptive difficulty adjustment, and a comprehensive HSK-based level selection system with 50 unique topic-based levels. Built as a full-stack web application with a React frontend and Express backend using PostgreSQL for complete data persistence.

### Recent Updates (August 2025)
- **Enhanced TTS Speech Speed**: Slowed down text-to-speech for clearer pronunciation
  - Reduced OpenAI TTS speed from 0.8 to 0.65 across all components for better language learning
  - Consistent slower speech rate in all features: practice, conversations, flashcards, voice translator
  - Improved clarity for Chinese character pronunciation
- **Complete Authentication System**: Implemented multi-user authentication with email/password login
  - Secure password hashing with bcrypt
  - JWT-based session management with PostgreSQL session store
  - Protected routes that redirect to login when accessed without authentication
  - Logout functionality with session cleanup
  - Public home page with login prompt for protected features
  - Automatic redirect to intended page after successful login
  - Profile dropdown menu showing signed-in user email
  - Google OAuth prepared (UI in place, backend ready for configuration)

### Previous Updates (December 2025)
- **Flow Mascot Design**: Created friendly mascot named "Flow" for FlowLingo
  - Smart and playful dolphin character called "Flow" symbolizing intelligence and communication
  - Ocean blue color theme with water effects and bubbles
  - Academic graduation cap showing learning achievement
  - Interactive speech bubble with multilingual greetings
  - Professional modern design with gradients and soft shadows
  - Replaces previous panda mascot for more universal appeal

### Previous Updates (December 2025)
- **Complete Green Theme Transformation**: Redesigned entire UI with modern green color scheme
  - Replaced purple/violet theme with vibrant green gradients (green → emerald → teal)
  - Applied glass morphism effects across all components
  - Updated sidebar with green stats displays and navigation
  - Transformed all pages with green backgrounds and accent colors
  - Modernized buttons with green gradient styles
  - Consistent green theme across Practice, AI Conversation, Voice Translator, and Flashcards pages

### Previous Updates (December 2025)
- **Voice Translator Feature**: Added real-time Mandarin speech-to-text translation
  - Press microphone button to speak in Mandarin Chinese
  - Automatic translation after 2 seconds of silence
  - Displays Chinese characters, pinyin pronunciation, and English translation
  - Play pronunciation button for each translation with OpenAI TTS
  - Translation history shows all previous translations in session
  - Uses OpenAI GPT-4o for accurate translation and pinyin generation
- **Practice Progress Persistence**: Implemented database storage for practice progress
  - Progress now persists across page navigation and browser refreshes
  - Current question position (e.g., 3/10) is saved and restored when returning to practice
  - Correct/incorrect answer counts maintained between sessions
  - Progress automatically clears upon level completion or manual level change
  - Database schema includes practice_progress table tracking question position and answers

### Recent Updates (August 2025)
- **Assessment System Implementation**: Added comprehensive skill-based assessment with level skipping functionality
  - 10-question assessment covering levels 1-10 with varying difficulty
  - Score-based level placement: Score 7→Level 5, Score 8→Level 7, Score 9→Level 9, Score 10→Level 10
  - Assessment page added to navigation menu below Home
  - Menu reorganized: Home → Assessment → Practice → Conversation → Vocabulary → Text Generator → Media Reader
  - Assessment results show placement level, personalized recommendations, and learning path guidance
  - User profile tracking for assessment completion status
- **Enhanced Sidebar UI**: Redesigned compact sidebar with user stats prominently displayed at top
  - Level and XP progress bar always visible
  - Streak counter and hearts display at top
  - Heart regeneration timer shows when hearts < 5 ("+❤️ in MM:SS")
  - Auto-refreshes every 10 seconds to update hearts status
  - Reduced height for better screen utilization
  - Quick "Start Practice" button at bottom
  - Consistent stats display across all pages
- **Voice Conversation Feature**: Implemented 1-to-1 voice conversation with AI Mandarin tutor using OpenAI's GPT-4o
  - Press "Start Conversation" button to begin natural voice session
  - Real-time speech recognition for Mandarin Chinese input
  - Auto-sends message after 2 seconds of silence (reduced from 3)
  - AI responds with voice using text-to-speech
  - Auto-resumes listening after AI finishes speaking
  - Shows Chinese characters, pinyin, and English translations
  - Speaker icon on AI messages to replay pronunciation anytime
  - Conversation adapts to user level and selected topic
  - Natural, conversational responses like real tutoring
- **Fixed Navigation**: Corrected broken sidebar navigation links across all pages (ai-conversation route fixed)
- **Consistent Layout**: Applied Duolingo-style sidebar navigation consistently to all pages
- **Improved Practice Feedback**: Wrong answer feedback shows complete information - hanzi, pinyin, and English meaning for incorrect answers
- **Unified UI Structure**: All pages now use the same sidebar component with proper routing
- **Hearts System**: Implemented Duolingo-style hearts system with automatic regeneration (1 heart per hour)
- **Level Progression**: Added visual level progress with pass/fail screens based on accuracy
- **Out of Hearts Screen**: Users cannot continue when hearts are depleted, must wait for regeneration
- **Timer Display**: Shows countdown to next heart regeneration when hearts are lost
- **Unique Practice Questions**: Practice sessions now generate unique questions without repetition (unless user answers incorrectly)

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript for type safety and modern development
- **Build Tool**: Vite for fast development and optimized production builds
- **Routing**: Wouter for lightweight client-side routing
- **Styling**: Tailwind CSS with shadcn/ui component library for consistent design
- **State Management**: TanStack Query (React Query) for server state management and caching
- **Component Architecture**: Modular components with shared UI library following atomic design principles

### Backend Architecture
- **Framework**: Express.js with TypeScript for RESTful API development
- **Development Server**: TSX for TypeScript execution in development
- **Middleware**: Custom logging, JSON parsing, and error handling middleware
- **Storage Layer**: Abstracted storage interface with both memory and database implementations
- **API Design**: RESTful endpoints for vocabulary, conversations, text generation, and PDF processing

### Database Schema
- **ORM**: Drizzle ORM for type-safe database operations
- **Database**: PostgreSQL with connection via Neon serverless
- **Tables**:
  - `users`: User authentication, profiles with level, XP, streak tracking, learning statistics
  - `vocabulary_words`: Spaced repetition vocabulary system with HSK levels
  - `conversations`: AI chat history with topic and difficulty tracking
  - `generated_texts`: Chinese text content with character segmentation
  - `pdf_documents`: Processed PDF content with text extraction
  - `assessment_questions`: Question bank for level assessment tests
  - `assessment_results`: User assessment history and recommended levels
  - `practice_sessions`: Practice session tracking with XP and accuracy
  - `achievements`: Gamification badges and rewards
  - `user_achievements`: User's unlocked achievements

### Authentication & Session Management
- Session-based authentication using PostgreSQL session store
- User identification through session cookies
- Demo mode with mock user for development

### AI Integration Architecture
- **OpenAI API**: GPT-4o integration for text generation and translation
- **Text Generation**: Topic-based Chinese content creation with difficulty levels
- **Translation**: Character and phrase translation with pinyin support
- **Conversation**: AI-powered Mandarin conversation practice with adaptive difficulty based on user level
- **Speech**: Browser-based text-to-speech and speech recognition APIs
- **Progress Tracking**: XP system, level progression, streak tracking, achievement unlocking

### Enhanced Practice System (December 2024)
- **Mandatory Retry**: Students must retry incorrect answers until correct, promoting learning
- **Adaptive Difficulty**: After 3 consecutive wrong attempts, option to drop to previous level
- **Enhanced Feedback**: Shows pinyin and meaning for both correct and incorrect answers
- **Real-time XP Saving**: Immediate backend persistence of XP gains for proper level progression
- **Simplified UI**: Single clean level progress bar showing XP progress to next level
- **Complete Pinyin Integration**: All vocabulary levels include accurate pinyin pronunciation guides

## External Dependencies

### Core Infrastructure
- **Database**: Neon PostgreSQL serverless database
- **Session Store**: connect-pg-simple for PostgreSQL session management
- **File Processing**: Browser-based PDF text extraction (placeholder for PDF.js integration)

### AI Services
- **OpenAI API**: GPT-4o model for text generation, translation, and conversation
- **Browser Speech APIs**: Web Speech API for text-to-speech and speech recognition

### UI Framework
- **shadcn/ui**: Complete component library built on Radix UI primitives
- **Radix UI**: Accessible, unstyled UI components
- **Tailwind CSS**: Utility-first CSS framework
- **Lucide React**: Icon library

### Development Tools
- **Vite**: Build tool with HMR and development server
- **TypeScript**: Type safety across frontend and backend
- **Drizzle Kit**: Database migrations and schema management
- **ESBuild**: Fast JavaScript bundling for production
- **Replit Integration**: Development environment with runtime error overlay

### Form & Validation
- **React Hook Form**: Form state management
- **Zod**: Schema validation for type-safe data handling
- **Drizzle Zod**: Integration between Drizzle ORM and Zod validation