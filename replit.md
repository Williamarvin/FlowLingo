# FlowLingo - Multi-Language Learning Platform

## Overview

FlowLingo is a comprehensive language learning platform specializing in Chinese (Mandarin), with plans for multi-language expansion. It features multi-user authentication, secure session management, and protected learning routes. Core capabilities include progress tracking with user levels, XP, streaks, and adaptive difficulty. Key features are text generation with click-to-translate, AI-powered adaptive conversations, a voice translator with instant Mandarin-to-English translation, a universal media reader (PDF, video, audio, images), vocabulary management with spaced repetition, initial assessment testing, enhanced progressive practice sessions with mandatory retries and adaptive difficulty, an HSK-based level selection system with 50 unique topic-based levels, and a gamified sticker collection system with over 100 animated animal stickers awarded on every level up. The platform aims to provide an engaging and effective learning experience, built as a full-stack web application with a React frontend, Express backend, and PostgreSQL for data persistence.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Build Tool**: Vite
- **Routing**: Wouter
- **Styling**: Tailwind CSS with shadcn/ui component library
- **State Management**: TanStack Query (React Query) for server state management and caching
- **Component Architecture**: Modular components following atomic design principles

### Backend Architecture
- **Framework**: Express.js with TypeScript
- **Development Server**: TSX
- **Middleware**: Custom logging, JSON parsing, and error handling
- **Storage Layer**: Abstracted storage interface supporting memory and database
- **API Design**: RESTful endpoints for core features

### Database Schema
- **ORM**: Drizzle ORM
- **Database**: PostgreSQL (Neon serverless)
- **Tables**: `users` (authentication, profiles, stats), `vocabulary_words` (spaced repetition), `conversations` (AI chat history), `generated_texts` (Chinese content), `pdf_documents` (processed PDFs), `assessment_questions`, `assessment_results`, `practice_sessions`, `achievements`, `user_achievements`.

### Authentication & Session Management
- Session-based authentication using PostgreSQL session store
- JWT-based session management
- Protected routes
- Logout functionality

### AI Integration Architecture
- **OpenAI API**: GPT-4o for text generation, translation, and conversation
- **Text Generation**: Topic-based Chinese content creation with difficulty levels
- **Translation**: Character and phrase translation with pinyin support
- **Conversation**: AI-powered Mandarin conversation practice, adapting to user level
- **Speech**: Browser-based text-to-speech and speech recognition APIs
- **Progress Tracking**: XP system, level progression, streak tracking, achievement unlocking

### Enhanced Practice System
- **Mandatory Retry**: Incorrect answers must be retried until correct.
- **Adaptive Difficulty**: Option to drop to previous level after consecutive wrong attempts.
- **Enhanced Feedback**: Provides pinyin and meaning for answers.
- **Real-time XP Saving**: Immediate persistence of XP gains.
- **Simplified UI**: Single level progress bar.
- **Complete Pinyin Integration**: All vocabulary levels include accurate pinyin.

### UI/UX Decisions
- **Color Scheme**: Vibrant green gradients (green → emerald → teal) with glass morphism effects.
- **Mascot**: "Flow" the dolphin, symbolizing intelligence and communication.
- **Gamification**: Sticker collection system (100+ animated animal stickers) earned through level progression, with rarity tiers.
- **Progression Display**: Visual HSK level progression bars integrated into the navigation sidebar.
- **TTS Speed**: Reduced text-to-speech speed (0.5) for improved clarity.
- **Sidebar UI**: Compact sidebar with prominent user stats (level, XP, streak, hearts).

## External Dependencies

### Core Infrastructure
- **Database**: Neon PostgreSQL
- **Session Store**: connect-pg-simple

### AI Services
- **OpenAI API**: GPT-4o (for text generation, translation, conversation)
- **Browser Speech APIs**: Web Speech API (for text-to-speech and speech recognition)

### UI Framework
- **shadcn/ui**: Component library built on Radix UI primitives
- **Radix UI**: Accessible, unstyled UI components
- **Tailwind CSS**: Utility-first CSS framework
- **Lucide React**: Icon library

### Development Tools
- **Vite**: Build tool
- **TypeScript**: Type safety
- **Drizzle Kit**: Database migrations
- **ESBuild**: JavaScript bundling

### Form & Validation
- **React Hook Form**: Form state management
- **Zod**: Schema validation
- **Drizzle Zod**: ORM and validation integration