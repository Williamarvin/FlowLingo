# MandarinMaster - Chinese Language Learning Platform

## Overview

MandarinMaster is a comprehensive Chinese language learning platform that provides interactive tools for studying Mandarin. The application features a complete progress tracking system with user levels, XP points, streak tracking, and adaptive difficulty. Key features include text generation with click-to-translate, AI-powered conversations that adapt to user level, universal media reader (PDF, video, audio, images), vocabulary management with spaced repetition, initial assessment testing, and enhanced progressive practice sessions with mandatory retry system and adaptive difficulty adjustment. Built as a full-stack web application with a React frontend and Express backend using PostgreSQL for complete data persistence.

### Recent Updates (August 2025)
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