# TravelLoom - AI Travel Planning Platform

## Overview

TravelLoom is a full-stack web application that provides AI-powered travel planning services. The application features a React frontend with a Node.js/Express backend, utilizing PostgreSQL for data persistence and Stripe for payment processing. The platform offers tiered subscription plans and chat-based interaction for travel planning.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Routing**: Wouter for client-side routing
- **State Management**: React Query (TanStack Query) for server state management
- **UI Components**: Shadcn/ui component library built on Radix UI primitives
- **Styling**: Tailwind CSS with CSS variables for theming
- **Build Tool**: Vite for development and production builds

### Backend Architecture
- **Runtime**: Node.js with Express.js framework
- **Language**: TypeScript with ES modules
- **API Pattern**: REST API with JSON responses
- **Session Management**: Express sessions with PostgreSQL storage
- **Authentication**: Replit Auth (OpenID Connect) integration

### Database Architecture
- **Database**: PostgreSQL with Neon serverless driver
- **ORM**: Drizzle ORM for type-safe database operations
- **Schema Management**: Drizzle Kit for migrations and schema management
- **Connection Pooling**: Neon serverless connection pooling

## Key Components

### Authentication System
- **Provider**: Replit Auth using OpenID Connect
- **Session Storage**: PostgreSQL-backed sessions with connect-pg-simple
- **User Management**: Automatic user creation/updates on authentication
- **Route Protection**: Middleware-based authentication checks

### Payment Integration
- **Provider**: Stripe for subscription management
- **Plans**: Starter (free with limited conversations), Pro ($25/month), Agency (from $49/month - contact sales)
- **Payment Flow**: Stripe Elements for Pro plan, email contact for Agency plan
- **Free Plan**: Immediate access to limited functionality without payment required

### Chat System
- **Conversations**: Persistent chat conversations per user
- **Messages**: Threaded messages within conversations
- **Real-time Updates**: React Query for optimistic updates
- **Message Types**: User and assistant message support
- **AI Integration**: OpenAI o3 (o3-2025-04-16) for enhanced reasoning capabilities in travel advisor responses
- **Auto-titling**: AI-generated conversation titles from first message

### UI Component System
- **Base Library**: Radix UI primitives for accessibility
- **Styling**: Class Variance Authority for component variants
- **Theming**: CSS custom properties with light/dark mode support
- **Icons**: Lucide React icon library

## Data Flow

### Authentication Flow
1. User clicks login → Redirected to Replit Auth
2. Successful auth → User data upserted to database
3. Session created → User redirected to chat interface
4. Protected routes check session validity

### Payment Flow
1. User selects plan → Stripe customer created
2. Payment method collected → Subscription created
3. Webhook confirms payment → User plan updated
4. Access granted to premium features

### Chat Flow
1. User creates conversation → Stored in database
2. User sends message → Optimistically updated in UI
3. Message persisted → Real-time sync via React Query
4. AI response generated → Added to conversation thread

### Access Control Flow
1. User authenticates → Firebase user created/updated
2. User must select payment plan → Required before chat access
3. Plan selection → Updates user subscription fields in database
4. Chat access → Protected routes verify plan selection
5. API protection → All conversation/message endpoints require active plan
6. Free plan access → Immediate starter plan access with conversation limits

## External Dependencies

### Core Dependencies
- **@neondatabase/serverless**: PostgreSQL serverless driver
- **drizzle-orm**: Type-safe ORM for database operations
- **@stripe/stripe-js**: Stripe client-side SDK
- **@stripe/react-stripe-js**: React components for Stripe
- **@tanstack/react-query**: Server state management
- **passport**: Authentication middleware
- **openai**: o4-mini integration for AI responses

### UI Dependencies
- **@radix-ui/***: Accessible UI primitive components
- **tailwindcss**: Utility-first CSS framework
- **class-variance-authority**: Component variant management
- **lucide-react**: Icon library

### Development Dependencies
- **vite**: Build tool and development server
- **typescript**: Type safety and tooling
- **tsx**: TypeScript execution for development
- **esbuild**: Fast JavaScript bundler for production

## Deployment Strategy

### Build Process
- **Frontend**: Vite builds React app to `dist/public`
- **Backend**: esbuild bundles server code to `dist/index.js`
- **Assets**: Static assets served from build output

### Environment Configuration
- **Database**: `DATABASE_URL` for PostgreSQL connection
- **Authentication**: Replit Auth environment variables
- **Payments**: Stripe API keys (public/secret)
- **Sessions**: `SESSION_SECRET` for session encryption

### Production Considerations
- **Database**: Requires PostgreSQL database provisioning
- **Environment**: Production NODE_ENV for optimizations
- **Security**: HTTPS required for authentication and payments
- **Monitoring**: Error handling and logging middleware included

### Development vs Production
- **Development**: Hot reloading with Vite middleware
- **Production**: Static file serving with Express
- **Database**: Shared schema across environments
- **Authentication**: Environment-specific OAuth configuration