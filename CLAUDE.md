# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Build and Development Commands

### Root Level (Full Stack)
- `npm run dev` - Start both client and server in development mode
- `npm run build` - Build the full application (client + server)
- `npm start` - Start production server
- `npm run check` - Run TypeScript type checking

### Client Only (client/ directory)
- `cd client && npm run dev` - Start Vite dev server on port 5173
- `cd client && npm run build` - Build client for production
- `cd client && npm run preview` - Preview production client build

### Database Operations
- `npm run db:push` - Push schema changes to database using Drizzle Kit
- Database runs on PostgreSQL, configured in `drizzle.config.ts`
- Schema defined in `db/schema.ts` with Drizzle ORM

## Architecture Overview

### Technology Stack
- **Frontend**: React 18 + TypeScript, Vite build tool
- **Backend**: Express.js with TypeScript, running on Node.js
- **Database**: PostgreSQL with Drizzle ORM
- **Styling**: TailwindCSS with Radix UI components
- **Routing**: Wouter for client-side routing
- **State Management**: React Query for server state, React Context for theme
- **Email**: Resend API for transactional emails
- **Data Storage**: Airtable for form submissions

### Project Structure
```
├── client/               # React frontend application
│   ├── src/
│   │   ├── components/   # Reusable UI components
│   │   ├── pages/        # Route components
│   │   ├── contexts/     # React contexts (ThemeContext)
│   │   ├── hooks/        # Custom React hooks
│   │   └── lib/          # Utilities and configurations
├── server/               # Express backend API
│   ├── controllers/      # Request handlers
│   ├── middleware/       # Authentication and other middleware
│   ├── services/         # External service integrations
│   └── routes.ts         # API route definitions
├── db/                   # Database schema and configuration
└── scripts/              # Utility scripts and migrations
```

### Key Features
- **Multi-page Business Website**: Services, about, contact, client onboarding
- **Theme System**: Dark/light mode with user preference detection
- **Form Processing**: Contact forms and client onboarding with email notifications
- **Authentication**: JWT-based auth system (currently minimal usage)
- **Responsive Design**: Mobile-first with Tailwind responsive classes

### Frontend Architecture
- **Component Library**: Radix UI primitives with custom Tailwind styling
- **Routing**: File-based route structure using Wouter
- **State Management**: React Query for API calls, Context API for global state
- **Styling Pattern**: Utility-first CSS with component variants using `class-variance-authority`
- **Image Handling**: Static assets in `client/public/`, referenced without path prefixes

### Backend Architecture
- **API Routes**: RESTful endpoints under `/api/` prefix
- **Services**: Modular external integrations (Airtable, Resend email)
- **Database**: Drizzle ORM with PostgreSQL, schema-first approach
- **Environment**: Configuration through `.env` file

### External Integrations
- **Airtable**: Form submission storage (contact forms, onboarding)
- **Resend**: Email service for customer confirmations and admin notifications
- **PostgreSQL**: Primary database for user accounts and blog posts

## Development Workflow

### Database Changes
1. Modify schema in `db/schema.ts`
2. Run `npm run db:push` to apply changes
3. Drizzle Kit handles migrations automatically

### Adding New Pages
1. Create component in `client/src/pages/`
2. Add route in `client/src/App.tsx`
3. Follow existing patterns for SEO, responsive design, and theming

### Form Integration
- All forms POST to `/api/contact` or `/api/client-onboarding`
- Automatic Airtable storage and email notifications
- Form validation using Zod schemas and react-hook-form

### Environment Variables
Required for development:
- `DATABASE_URL` - PostgreSQL connection string
- `RESEND_API_KEY` - Email service API key
- `AIRTABLE_API_KEY` - Airtable integration
- `AIRTABLE_BASE_ID` - Airtable base identifier
- `JWT_SECRET` - Authentication secret

## Testing and Quality

### Type Checking
- Run `npm run check` before commits
- TypeScript strict mode enabled
- All components should be properly typed

### Build Verification
- Always run `npm run build` to verify production build
- Check both client and server build successfully
- Verify static assets are properly referenced

## Deployment

### Production Build
- `npm run build` creates optimized client build and server bundle
- Static files served from `dist/public/`
- Server runs from `dist/index.js`

### Environment Setup
- Production requires all environment variables
- Database URL must point to production PostgreSQL instance
- Email and Airtable APIs configured for production use