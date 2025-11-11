# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

```bash
# Development
npm run dev          # Start development server (http://localhost:5173)
npm run build        # Build for production
npm run preview      # Preview production build

# Code Quality
npm run lint         # Run ESLint
npm run lint:fix     # Fix ESLint issues automatically
npm run format       # Format code with Prettier
npm run typecheck    # TypeScript type checking

# Testing
npm run test         # Run tests in watch mode
npm run test:ui      # Run tests with UI interface
npm run test:coverage # Generate coverage report

# Code Quality (Additional)
npm run format:check # Check code formatting without making changes
```

## Project Architecture

### High-Level Structure

**Mon Toit** is a React-based real estate platform for Ivory Coast, built with TypeScript and following a role-based architecture pattern. The platform connects tenants, property owners, agencies, and trust agents with ANSUT certification.

### Core Technologies
- **Frontend**: React 18.3 + TypeScript 5.5 (strict mode)
- **Routing**: React Router v6 with lazy loading and code splitting
- **State Management**: Zustand (client) + React Query (server state)
- **Styling**: Tailwind CSS with custom scrapbook design system
- **Backend**: Supabase (PostgreSQL + Auth + Storage + Edge Functions)
- **Build Tool**: Vite 5.4
- **Testing**: Vitest + Testing Library

### Directory Structure (Role-Based)

```
src/
├── pages/
│   ├── admin/         # Admin dashboard and management (11 pages)
│   ├── agency/        # Real estate agency features (5 pages)
│   ├── user/          # User features (23 pages)
│   ├── trust-agent/   # Trust agent features (4 pages)
│   ├── marketplace/   # Property marketplace (8 pages)
│   └── common/        # Shared pages (About, Legal, etc.) (9 pages)
├── components/
│   ├── ui/           # Reusable UI components (Header, Footer, Layout)
│   └── auth/         # Authentication components
├── api/
│   └── repositories/ # Repository pattern for data access (7 repos)
├── hooks/            # Custom React hooks (React Query)
├── stores/           # Zustand stores
├── types/            # TypeScript type definitions
└── utils/            # Utility functions
```

### Key Architectural Patterns

#### 1. Repository Pattern
All database operations go through repositories in `src/api/repositories/`:
- `propertyRepository.ts` - Property CRUD and search
- `userRepository.ts` - User management and profiles
- `leaseRepository.ts` - Contract and lease operations
- `messageRepository.ts` - Messaging system
- `applicationRepository.ts` - Rental applications
- `paymentRepository.ts` - Payment processing
- `maintenanceRepository.ts` - Maintenance requests

#### 2. Role-Based Access Control
Protected routes use the `ProtectedRoute` component with role-based permissions:
```typescript
<ProtectedRoute allowedRoles={['admin']}>
  <AdminDashboard />
</ProtectedRoute>
```
Roles: `admin`, `proprietaire`, `locataire`, `agence`, `trust_agent`

#### 3. Layout System
The `Layout` component conditionally renders Header/Footer based on route:
- **No Layout**: `/connexion`, `/inscription`, `/messages`, `/auth/callback`
- **No Header/Footer**: Admin dashboards, contracts, verification pages
- **Full Layout**: Most public and user pages

#### 4. Lazy Loading & Code Splitting
All pages are lazy-loaded through React Router for optimal performance:
```typescript
const AdminDashboard = lazy(() => import('../pages/admin/AdminDashboard'));
```

### Environment Configuration

The project uses comprehensive environment variable configuration in `.env`:
- **Supabase**: Database URL, anon keys, service role keys
- **External Services**: Mapbox, Azure OpenAI, Google Gemini, Smile ID
- **Communication**: RESEND (email), Brevo (SMS), Firebase (push)
- **Payment**: Orange Money, MTN Mobile Money, Moov Money, Wave
- **Government APIs**: ONECI, CNAM, CEV (Ivory Coast services)

Copy `.env.example` to `.env` and configure all required services.

### Design System

#### Color Palette
- **Olive**: `#86B53E` (primary brand)
- **Cyan**: `#06B6D4` (secondary)
- **Coral**: `#FF6B6B` (accent)
- **Terracotta**: `#E74C3C` (CTA buttons)

#### Components
- **Buttons**: `btn-primary`, `btn-secondary` classes
- **Cards**: `card-scrapbook` with rotation effects
- **Icons**: Lucide React icons throughout
- **Layout**: Responsive with mobile-first approach

### Testing Strategy

- **Unit Tests**: Component testing with Vitest + Testing Library
- **Integration Tests**: Repository and API layer testing
- **E2E Tests**: User flow testing (planned)
- **Coverage Target**: 70% (Phase 2)

### Git Hooks & Code Quality

The project uses Husky for Git hooks and lint-staged for pre-commit checks:
- **Pre-commit**: Runs lint and format on staged files
- **Pre-push**: Runs typecheck and tests
- All commits must follow conventional commit format

### Development Workflow

1. **Feature Development**: Create feature branches from `develop`
2. **Code Review**: Pull requests require review
3. **Testing**: All tests must pass before merge
4. **Deployment**:
   - `develop` → Staging (auto-deploy)
   - `main` → Production (auto-deploy)

### Key Files to Understand

- `src/routes/index.tsx` - All route definitions with lazy loading (80+ routes)
- `src/components/ui/Layout.tsx` - Main layout component with conditional rendering
- `src/components/ui/ProtectedRoute.tsx` - Route protection with role-based access
- `src/api/repositories/index.ts` - Repository exports and data access layer
- `vite.config.ts` - Build configuration with path aliases (`@/` → `src/`)

### Database Schema (Supabase)

Key tables managed through repositories:
- `users` - User profiles and roles
- `properties` - Property listings
- `leases` - Rental contracts
- `messages` - User communications
- `applications` - Rental applications
- `payments` - Transaction records
- `maintenance_requests` - Maintenance issues

### Development Workflow

1. **Feature Development**: Create feature branches from `develop`
2. **Code Review**: Pull requests require review
3. **Testing**: All tests must pass before merge
4. **Deployment**:
   - `develop` → Staging (auto-deploy)
   - `main` → Production (auto-deploy)

### Common Development Tasks

**Adding a New Page:**
1. Create component in appropriate role-based directory
2. Add lazy import and route in `src/routes/index.tsx`
3. Wrap with `ProtectedRoute` if authentication needed
4. Test navigation and permissions

**Adding New API Endpoint:**
1. Create/update repository in `src/api/repositories/`
2. Add React Query hook in `src/hooks/`
3. Update TypeScript types in `src/types/`
4. Test with proper error handling

**Running Single Tests:**
```bash
# Run specific test file
npm test src/components/__tests__/Component.test.tsx

# Run tests matching pattern
npm test -- --grep "component name"
```

**Environment Setup:**
1. Copy `.env.example` to `.env`
2. Configure Supabase project keys
3. Set up external service API keys
4. Run `npm install` and `npm run dev`

### Mobile Money Integration

The platform integrates with Ivory Coast mobile money providers:
- Orange Money, MTN Mobile Money, Moov Money, Wave
- All transactions processed through secure API endpoints
- Environment configurable (sandbox/production)

### ANSUT Certification

Platform features ANSUT (Autorité Nationale de la Sécurité et de la Fiabilité des Transactions Numériques) certification:
- Identity verification through ONECI
- Biometric verification via Smile ID
- Digital contract signing with legal validity
- Trust agent system for dispute resolution

This architecture ensures scalability, security, and maintainability while serving the specific needs of the Ivory Coast real estate market.