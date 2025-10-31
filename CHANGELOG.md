# Changelog

All notable changes to the Mon Toit platform will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Planned for 3.2.0
- Full Multi-LLM AI Assistant system
- Electronic Lease with ONECI CEV integration
- Agency Mandate Management
- Advanced Maintenance System with contractors
- Enhanced Dashboards with customizable widgets

## [3.1.0] - 2025-10-31

### Added

#### AI-Powered Features
- **Recommendation Engine**: Intelligent property recommendations based on user behavior, preferences, and history
- **Property Comparison Tool**: Side-by-side comparison of up to 10 properties with visual indicators
- **Trending Properties**: Real-time trending score calculation based on views, favorites, and inquiries
- **Smart Property Scoring**: Multi-factor algorithm for personalized recommendations

#### Multi-Role Management
- **User Role Assignments**: Support for users with multiple roles (tenant, landlord, agency)
- **Role Switching**: Seamless switching between roles with audit trail
- **Role History Tracking**: Complete logging of role changes with IP and user agent
- **Primary Role Selection**: Set default role for faster navigation

#### New Pages & Components
- **Recommendations Page** (`src/pages/Recommendations.tsx`): Three-tab interface (For You, Trending, New)
- **Property Comparison** (`src/components/PropertyComparison.tsx`): Interactive comparison modal
- **Recommendation Engine** (`src/services/ai/recommendationEngine.ts`): Core AI logic

#### Database Enhancements
- 5 new tables: `user_role_assignments`, `role_switch_history`, `property_comparisons`, `recommendation_history`, `ai_interactions`
- 3 new columns on properties table: `recommendation_score`, `trending_score`, `last_recommended_at`
- 4 new SQL functions: `calculate_trending_score()`, `update_all_trending_scores()`, `get_user_active_role()`, `switch_user_role()`
- 12 new RLS policies for secure multi-role access

### Changed
- Updated package name from `vite-react-typescript-starter` to `mon-toit-platform`
- Version bumped from `0.0.0` to `3.1.0`
- Enhanced property scoring system with AI-powered metrics
- Improved user experience with personalized content

### Security
- Comprehensive RLS policies on all new tables
- Role-based access control for multi-role users
- Audit trail for all role switches
- Secure AI interaction logging

### Performance
- Build time: 13.40s
- Bundle optimization recommendations noted
- Indexed all recommendation-related columns
- Efficient scoring algorithms (<100ms for 12 properties)

## [0.1.0] - 2025-10-29

### Added

#### Infrastructure
- Initial React + TypeScript + Vite project setup
- Supabase backend configuration
- Tailwind CSS design system
- ESLint and TypeScript configuration

#### Authentication & Users
- Email/password authentication via Supabase
- User registration for tenants, owners, and agencies
- User profile management
- Role-based access control
- Session management

#### Property Management
- Property listing creation and management
- Property search with filters (type, city, price, bedrooms)
- Property detail pages
- Image upload to Supabase Storage
- View counter for properties
- Public access to available properties
- Mapbox integration for property locations

#### Messaging System
- Real-time messaging between users
- Conversation threads
- Message notifications
- "Start Conversation" functionality

#### Visit Scheduling
- Visit request system
- Visit approval/rejection workflow
- Visit calendar
- Visit notifications

#### Rental Applications
- Tenant application submission
- Application review and management
- Application status tracking

#### Lease Contracts
- Contract creation system
- Contract status management (draft, active, expired, terminated)
- Contract viewing and details

#### Payments
- Payment history tracking
- Mobile Money transaction integration
- Payment status management

#### Verification System
- User verification framework
- ONECI identity verification integration
- CNAM verification integration
- Smile ID facial verification integration
- Tenant scoring system
- Achievement badges
- Certification status tracking

#### Favorites & Alerts
- Favorite properties system
- Price alerts
- Saved searches

#### Administrative
- API key management
- API usage logging
- Owner dashboard
- Property analytics

### Edge Functions
- `send-email` - Email notifications via Resend
- `send-sms` - SMS notifications via Brevo
- `cnam-verification` - CNAM affiliation verification
- `oneci-verification` - CNI document verification
- `smile-id-verification` - Facial recognition verification
- `mobile-money-payment` - Mobile money payment processing
- `cryptoneo-signature` - Electronic signature integration

### Database Schema
- 17 database migrations establishing core schema
- Row Level Security (RLS) enabled on all tables
- Comprehensive RLS policies for data access control
- Storage buckets for property images and documents

## Release Notes

### Epic 1: Identity Verification & ANSUT Certification
- ✅ Core verification infrastructure
- ✅ API integrations framework
- ✅ Scoring system foundation
- 🔄 In Progress: Complete ONECI integration
- 🔄 In Progress: Complete CNAM integration
- 🔄 In Progress: Complete Smile ID integration
- 📅 Planned: Certification badge display
- 📅 Planned: Certification reminders

### Epic 2: Electronic Signature (CryptoNeo)
- ✅ Contract generation system
- ✅ PDF generation infrastructure
- 🔄 In Progress: CryptoNeo API integration
- 🔄 In Progress: Signature workflow
- 📅 Planned: Digital certificate management
- 📅 Planned: Multi-party signature flow

### Epic 3: Mobile Money Payments
- ✅ Payment tracking infrastructure
- ✅ Mobile Money transaction table
- 📅 Planned: Orange Money integration
- 📅 Planned: MTN Money integration
- 📅 Planned: Moov Money integration
- 📅 Planned: Wave integration
- 📅 Planned: Payment receipts
- 📅 Planned: Automatic landlord transfers

### Future Epics
- Epic 4: Multi-channel Notifications
- Epic 5: Interactive Maps & Geolocation
- Epic 6: Dashboards & Statistics
- Epic 7: Agency Management
- Epic 8: Advanced Search & Favorites
- Epic 9: Maintenance & Support
- Epic 10: Reviews & Reputation
- Epic 11: Platform Administration
- Epic 12: Performance & SEO

## Migration Guide

### Migrating to Zustand (In Progress)

If you're using the old Context API pattern:

```typescript
// Old
import { useAuth } from './contexts/AuthContext';
const { user, signIn, signOut } = useAuth();

// New (coming soon)
import { useAuthStore } from './stores/authStore';
const { user, signIn, signOut } = useAuthStore();
```

### Migrating to New API Layer (In Progress)

```typescript
// Old
import { supabase } from './lib/supabase';
const { data } = await supabase.from('properties').select('*');

// New (coming soon)
import { propertyRepository } from './api/repositories/propertyRepository';
const properties = await propertyRepository.getAll();
```

## Known Issues

- No automated testing currently implemented
- Some TypeScript `any` types need proper typing
- Manual routing in App.tsx needs migration to React Router
- No CI/CD pipeline yet
- Some components exceed recommended file size
- Missing error boundaries
- No performance monitoring
- Mobile responsiveness needs improvement in some areas

## Acknowledgments

- SOMET PATRICK - Product Owner
- Epic 2 currently in active development
- Target: Production-ready by Q1 2026
