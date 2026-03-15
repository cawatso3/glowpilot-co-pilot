# GlowPilot Architecture

## Overview

GlowPilot is a modern web application built with a React-based frontend and Supabase backend, designed to help beauty and wellness professionals manage their business operations, content creation, and client relationships.

## Technology Stack

### Frontend
- **Framework**: React 18.3.1 with TypeScript
- **Build Tool**: Vite 5.4.19
- **Routing**: React Router DOM 6.30.1
- **State Management**: TanStack Query (React Query) 5.83.0
- **UI Framework**: shadcn/ui with Radix UI primitives
- **Styling**: Tailwind CSS 3.4.17
- **Animations**: Framer Motion 12.36.0
- **Icons**: Lucide React 0.462.0
- **Form Handling**: React Hook Form 7.61.1 with Zod validation
- **Theme**: next-themes for dark/light mode support

### Backend & Services
- **Backend as a Service**: Supabase 2.99.1
  - Authentication
  - PostgreSQL Database
  - Real-time subscriptions
  - Row Level Security (RLS)
- **API Layer**: Supabase Client SDK

### Development Tools
- **Testing**: Vitest 3.2.4, Testing Library, Playwright 1.57.0
- **Linting**: ESLint 9.32.0 with TypeScript ESLint
- **Type Checking**: TypeScript 5.8.3
- **Package Manager**: npm/bun (lockfiles present for both)

## Application Architecture

### High-Level Structure

```
┌─────────────────────────────────────────────────────────┐
│                     Browser (Client)                     │
│  ┌───────────────────────────────────────────────────┐  │
│  │              React Application                     │  │
│  │  ┌─────────────────────────────────────────────┐  │  │
│  │  │  Pages (Routes)                             │  │  │
│  │  │  - Dashboard, Content, Calendar, etc.       │  │  │
│  │  └─────────────────────────────────────────────┘  │  │
│  │  ┌─────────────────────────────────────────────┐  │  │
│  │  │  Components (UI)                            │  │  │
│  │  │  - shadcn/ui, Custom Components             │  │  │
│  │  └─────────────────────────────────────────────┘  │  │
│  │  ┌─────────────────────────────────────────────┐  │  │
│  │  │  Hooks (Business Logic)                     │  │  │
│  │  │  - useAuth, useProfile, useContentIdeas     │  │  │
│  │  └─────────────────────────────────────────────┘  │  │
│  │  ┌─────────────────────────────────────────────┐  │  │
│  │  │  Integrations                               │  │  │
│  │  │  - Supabase Client, Types                   │  │  │
│  │  └─────────────────────────────────────────────┘  │  │
│  └───────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────┘
                          ↕
┌─────────────────────────────────────────────────────────┐
│                  Supabase Backend                        │
│  ┌───────────────────────────────────────────────────┐  │
│  │  Authentication Service                           │  │
│  │  - Email/Password, OAuth (Google, etc.)           │  │
│  └───────────────────────────────────────────────────┘  │
│  ┌───────────────────────────────────────────────────┐  │
│  │  PostgreSQL Database                              │  │
│  │  - Profiles, Clients, Content, Reviews, etc.      │  │
│  └───────────────────────────────────────────────────┘  │
│  ┌───────────────────────────────────────────────────┐  │
│  │  Real-time Subscriptions                          │  │
│  └───────────────────────────────────────────────────┘  │
│  ┌───────────────────────────────────────────────────┐  │
│  │  Row Level Security (RLS)                         │  │
│  └───────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────┘
                          ↕
┌─────────────────────────────────────────────────────────┐
│              Third-Party Integrations                    │
│  - Acuity Scheduling                                     │
│  - Square Appointments                                   │
│  - Vagaro                                                │
│  - Twilio (Messaging)                                    │
│  - Resend (Email)                                        │
└─────────────────────────────────────────────────────────┘
```

### Directory Structure

```
glowpilot/
├── src/
│   ├── components/          # Reusable UI components
│   │   ├── ui/             # shadcn/ui components
│   │   └── layout/         # Layout components (AppLayout, etc.)
│   ├── pages/              # Route-level page components
│   │   ├── Dashboard.tsx
│   │   ├── ContentPlanner.tsx
│   │   ├── CalendarPage.tsx
│   │   ├── ClientsPage.tsx
│   │   ├── CampaignsPage.tsx
│   │   ├── ReviewsPage.tsx
│   │   ├── SettingsPage.tsx
│   │   ├── Login.tsx
│   │   ├── Signup.tsx
│   │   └── Onboarding.tsx
│   ├── hooks/              # Custom React hooks
│   │   ├── useAuth.ts
│   │   ├── useProfile.ts
│   │   ├── useContentIdeas.ts
│   │   ├── useClients.ts
│   │   ├── useAppointments.ts
│   │   └── ...
│   ├── integrations/       # External service integrations
│   │   └── supabase/
│   │       ├── client.ts   # Supabase client configuration
│   │       └── types.ts    # Database type definitions
│   ├── lib/                # Utility functions
│   ├── types/              # TypeScript type definitions
│   ├── App.tsx             # Main application component
│   └── main.tsx            # Application entry point
├── public/                 # Static assets
├── docs/                   # Documentation
│   └── blueprints/         # Feature blueprints
├── supabase/               # Supabase configuration
├── vite.config.ts          # Vite configuration
├── tailwind.config.ts      # Tailwind CSS configuration
├── tsconfig.json           # TypeScript configuration
└── package.json            # Dependencies and scripts
```

## Core Features & Modules

### 1. Authentication & Authorization
- **Location**: `src/pages/Login.tsx`, `src/pages/Signup.tsx`, `src/hooks/useAuth.ts`
- **Features**:
  - Email/password authentication
  - OAuth providers (Google, etc.)
  - Protected routes with `AuthGuard` component
  - Session management via Supabase Auth

### 2. User Onboarding
- **Location**: `src/pages/Onboarding.tsx`
- **Features**:
  - First-time user setup flow
  - Profile completion tracking
  - `OnboardingGuard` ensures completion before app access

### 3. Dashboard
- **Location**: `src/pages/Dashboard.tsx`
- **Features**:
  - Overview of key metrics
  - Today's appointments
  - Content posting progress
  - Calendar gaps
  - Review statistics
  - Client status (lapsed clients)
  - Integration status indicators

### 4. Content Planning
- **Location**: `src/pages/ContentPlanner.tsx`
- **Features**:
  - AI-powered content idea generation
  - Content scheduling
  - Multi-platform posting
  - Content calendar view
  - Draft management

### 5. Calendar Management
- **Location**: `src/pages/CalendarPage.tsx`
- **Features**:
  - Appointment viewing and management
  - Calendar gap detection
  - Integration with booking platforms (Acuity, Square, Vagaro)

### 6. Client Management
- **Location**: `src/pages/ClientsPage.tsx`
- **Features**:
  - Client database
  - Client status tracking (active, lapsed)
  - Client communication history
  - Re-engagement campaigns

### 7. Campaign Management
- **Location**: `src/pages/CampaignsPage.tsx`
- **Features**:
  - Marketing campaign creation
  - Campaign tracking
  - Multi-channel campaigns (SMS, Email)

### 8. Review Management
- **Location**: `src/pages/ReviewsPage.tsx`
- **Features**:
  - Review aggregation
  - Response management
  - Rating analytics
  - Review request automation

### 9. Settings & Integrations
- **Location**: `src/pages/SettingsPage.tsx`
- **Features**:
  - Profile settings
  - Integration management
  - Notification preferences
  - Account settings

## Data Flow

### 1. Authentication Flow
```
User Login → Supabase Auth → Session Created → Profile Loaded → 
Check Onboarding → Redirect to Dashboard/Onboarding
```

### 2. Data Fetching Pattern
```
Component Mount → Custom Hook (useX) → TanStack Query → 
Supabase Client → Database → Cache → Component Render
```

### 3. Real-time Updates
```
Database Change → Supabase Realtime → Subscription → 
Query Invalidation → Component Re-render
```

## Security Architecture

### Row Level Security (RLS)
- All database tables protected with RLS policies
- Users can only access their own data
- Policies enforce user_id matching on queries

### Authentication
- JWT-based authentication via Supabase
- Secure session management
- OAuth integration for third-party providers

### Environment Variables
- Sensitive credentials stored in `.env` file
- Not committed to version control (`.gitignore`)
- Required variables:
  - Supabase URL
  - Supabase Anon Key
  - Third-party API keys

## Performance Optimizations

### Code Splitting
- Route-based code splitting via React Router
- Lazy loading of components where applicable

### Caching Strategy
- TanStack Query for intelligent data caching
- Stale-while-revalidate pattern
- Optimistic updates for better UX

### Build Optimization
- Vite for fast builds and HMR
- SWC for fast TypeScript compilation
- Tree shaking for minimal bundle size

## Deployment Architecture

### Build Process
```
Source Code → TypeScript Compilation → Vite Build → 
Static Assets → CDN/Hosting Platform
```

### Hosting
- Static site hosting (Lovable, Netlify, Vercel, etc.)
- Supabase for backend services
- Environment-specific configurations

## Scalability Considerations

### Frontend
- Component-based architecture for reusability
- Custom hooks for business logic separation
- Type-safe API layer with generated types

### Backend
- Supabase handles scaling automatically
- Connection pooling for database
- Edge functions for serverless compute (if needed)

### Database
- Indexed queries for performance
- Efficient query patterns via TanStack Query
- Real-time subscriptions for live updates

## Development Workflow

### Local Development
1. Clone repository
2. Install dependencies (`npm install`)
3. Configure environment variables
4. Start dev server (`npm run dev`)
5. Access at `http://localhost:8080`

### Testing
- Unit tests: `npm run test`
- Watch mode: `npm run test:watch`
- E2E tests: Playwright

### Build & Deploy
- Development build: `npm run build:dev`
- Production build: `npm run build`
- Preview: `npm run preview`

## Integration Points

### Booking Systems
- Acuity Scheduling
- Square Appointments
- Vagaro

### Communication
- Twilio (SMS)
- Resend (Email)

### Future Integrations
- Social media platforms (Instagram, Facebook, TikTok)
- Payment processors
- Analytics platforms
