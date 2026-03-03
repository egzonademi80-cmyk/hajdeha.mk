# HAJDE HA - Multi-Restaurant QR Digital Menu Platform

## Overview

HAJDE HA is a full-stack web application serving as a multi-restaurant QR digital menu platform for Tetovë. The platform is designed exclusively for displaying restaurant menus - there is no online ordering, payments, or customer accounts. Customers scan QR codes at restaurant tables to view menus, or access them directly from the website. Only restaurant owners can log in to manage their venues and menu items.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Routing**: Wouter (lightweight React router)
- **State Management**: TanStack React Query for server state
- **Styling**: Tailwind CSS with shadcn/ui component library (New York style)
- **Animations**: Framer Motion for page transitions
- **Form Handling**: React Hook Form with Zod validation
- **Build Tool**: Vite with custom plugins for Replit integration

### Backend Architecture
- **Runtime**: Node.js with Express
- **Language**: TypeScript (ESM modules)
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
│       ├── hooks/          # Custom React hooks
│       ├── pages/          # Route components
│       └── lib/            # Utilities
├── server/          # Express backend
│   ├── routes.ts    # API route handlers
│   ├── storage.ts   # Database access layer
│   └── auth.ts      # Authentication setup
├── shared/          # Shared code (types, schemas, API contracts)
│   ├── schema.ts    # Drizzle database schema
│   └── routes.ts    # API contract definitions
└── migrations/      # Database migrations
```

### Key Design Decisions

1. **Shared Type Safety**: Database schema and API contracts are defined in `shared/` directory, enabling full type safety between frontend and backend.

2. **Mobile-First Design**: The UI is optimized for mobile devices since customers primarily scan QR codes on phones.

3. **No Customer Accounts**: Simplified architecture - only restaurant owners authenticate. Public menu pages require no login.

4. **Slug-Based URLs**: Restaurants are accessed via human-readable slugs (`/restaurant/{slug}`) for QR code simplicity.

## External Dependencies

### Database
- **PostgreSQL**: Primary database, connection via `DATABASE_URL` environment variable

### Authentication
- **express-session**: Server-side session management
- **passport / passport-local**: Username/password authentication

### UI Component Library
- **shadcn/ui**: Pre-built accessible components using Radix UI primitives
- **Radix UI**: Underlying headless component library
- **Lucide React**: Icon library

### Build & Development
- **Vite**: Frontend build tool with HMR
- **esbuild**: Server bundling for production
- **tsx**: TypeScript execution for development

### Required Environment Variables
- `DATABASE_URL`: PostgreSQL connection string
- `SESSION_SECRET`: (optional, has default) Secret for session encryption