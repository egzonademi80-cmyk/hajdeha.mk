# HAJDE HA - Multi-Restaurant QR Digital Menu Platform

## Overview

HAJDE HA is a full-stack web application serving as a multi-restaurant QR digital menu platform for Tetovë. The platform is designed exclusively for displaying restaurant menus - there is no online ordering, payments, or customer accounts. Customers scan QR codes at restaurant tables to view digital menus, and restaurant owners can manage their menus through an admin panel.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Routing**: Wouter (lightweight React router)
- **State Management**: TanStack React Query for server state caching and synchronization
- **Styling**: Tailwind CSS with shadcn/ui component library (New York style)
- **Animations**: Framer Motion for page transitions and UI animations
- **Form Handling**: React Hook Form with Zod validation
- **Build Tool**: Vite with custom Replit integration plugins

### Backend Architecture
- **Runtime**: Node.js with Express
- **Language**: TypeScript using ESM modules
- **API Design**: RESTful endpoints with typed contracts defined in `shared/routes.ts`
- **Authentication**: Passport.js with local strategy, session-based auth using express-session
- **Password Hashing**: Node.js crypto module (scrypt)

### Data Layer
- **Database**: PostgreSQL
- **ORM**: Drizzle ORM with drizzle-zod for schema validation
- **Schema Location**: `shared/schema.ts` (shared between client and server)
- **Migrations**: Drizzle Kit (`npm run db:push`)

### Project Structure
```
├── client/          # React frontend
│   └── src/
│       ├── components/ui/  # shadcn/ui components
│       ├── hooks/          # Custom React hooks (auth, restaurants, menu items)
│       ├── pages/          # Route components (Home, PublicMenu, Admin pages)
│       └── lib/            # Utilities and query client
├── server/          # Express backend
│   ├── routes.ts    # API route handlers
│   ├── storage.ts   # Database access layer (IStorage interface)
│   ├── db.ts        # Database connection
│   └── auth.ts      # Authentication setup with Passport
├── shared/          # Shared code (types, schemas, API contracts)
│   ├── schema.ts    # Drizzle database schema (users, restaurants, menuItems)
│   └── routes.ts    # API contract definitions with Zod validation
└── migrations/      # Database migrations
```

### Key Design Patterns
- **Shared Types**: Database schemas and API contracts are defined in `shared/` and used by both client and server, ensuring type safety across the stack
- **Storage Interface**: `IStorage` interface in `server/storage.ts` abstracts database operations, making it easy to swap implementations
- **API Contracts**: `shared/routes.ts` defines typed API routes with Zod schemas for input/output validation

## External Dependencies

### Database
- **PostgreSQL**: Primary data store, connected via `DATABASE_URL` environment variable
- **Drizzle ORM**: Type-safe database queries and schema management

### Authentication
- **Passport.js**: Authentication middleware with local strategy
- **express-session**: Session management for authenticated users

### UI Components
- **shadcn/ui**: Pre-built accessible React components (New York style variant)
- **Radix UI**: Underlying primitives for shadcn components
- **Tailwind CSS**: Utility-first CSS framework

### Key Libraries
- **TanStack React Query**: Server state management and caching
- **Zod**: Schema validation for API inputs and form data
- **Framer Motion**: Animation library for smooth UI transitions
- **Lucide React**: Icon library