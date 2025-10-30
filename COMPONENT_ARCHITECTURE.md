# 🏗️ User-Centric Components Architecture

## Component Hierarchy & Integration

```
┌─────────────────────────────────────────────────────────────────┐
│                      MON TOIT PLATFORM                          │
│                   (Production v3.5 Complete)                    │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ├─── 🔵 LOCATAIRE (70%)
                              ├─── 🟠 PROPRIETAIRE (25%)
                              └─── 🟢 AGENCE (5%)
                              │
        ┌─────────────────────┴─────────────────────┐
        │                                           │
┌───────▼────────┐                         ┌───────▼────────┐
│  CORE SYSTEM   │                         │  USER LAYER    │
└────────────────┘                         └────────────────┘
│                                           │
├─ Auth Context                             ├─ Profile Detection
├─ Database (Supabase)                      ├─ Role-Based Routing
├─ Edge Functions                           └─ Permission Checks
├─ Storage
└─ Real-time


┌──────────────────────────────────────────────────────────────────┐
│                    NEW COMPONENTS (User-Centric)                 │
└──────────────────────────────────────────────────────────────────┘

1. ONBOARDING LAYER
   ┌────────────────────────────────────────────────┐
   │  OnboardingTooltip.tsx                         │
   │  ├─ Multi-step guided tours                    │
   │  ├─ Progress tracking                          │
   │  ├─ LocalStorage persistence                   │
   │  └─ Profile-specific flows                     │
   └────────────────────────────────────────────────┘
          │
          └─► Triggers: First visit, Feature updates
          └─► Storage: localStorage('${profile}-onboarding')

2. HELP SYSTEM
   ┌────────────────────────────────────────────────┐
   │  ContextualHelp.tsx                            │
   │  ├─ Inline tooltips                            │
   │  ├─ 4 types (info, tip, warning, success)      │
   │  ├─ Positioned (top, bottom, left, right)      │
   │  └─ Dismissible popup                          │
   └────────────────────────────────────────────────┘
          │
          └─► Usage: Any form, complex feature, or workflow
          └─► Props: tips[], position, className

3. QUICK ACTIONS HUB
   ┌────────────────────────────────────────────────┐
   │  ProfileQuickActions.tsx                       │
   │  ├─ Profile detection (useAuth)                │
   │  ├─ 6 actions per profile                      │
   │  ├─ Color-coded categories                     │
   │  └─ Verification reminder                      │
   └────────────────────────────────────────────────┘
          │
          ├─► Locataire Actions:
          │   • Search, Messages, Payment, Contract, Maintenance, Score
          │
          ├─► Proprietaire Actions:
          │   • Add Property, Properties, Applications, Messages, Stats, Maintenance
          │
          └─► Agence Actions:
              • Dashboard, Properties, Team, Commissions, CRM, Reports

4. WELCOME EXPERIENCE
   ┌────────────────────────────────────────────────┐
   │  ProfileWelcome.tsx                            │
   │  ├─ Personalized greeting                      │
   │  ├─ 3 relevant statistics                      │
   │  ├─ 3 actionable tips                          │
   │  └─ Primary & secondary CTAs                   │
   └────────────────────────────────────────────────┘
          │
          └─► Display: Dashboard landing, First login
          └─► Data: Dynamic from profile type

5. TRUST SYSTEM
   ┌────────────────────────────────────────────────┐
   │  TrustIndicator.tsx                            │
   │  ├─ 5-point score calculation                  │
   │  │  • ONECI (2 pts)                            │
   │  │  • CNAM (1 pt)                              │
   │  │  • ANSUT (2 pts)                            │
   │  ├─ Visual progress bar                        │
   │  ├─ Verification breakdown                     │
   │  └─ Rating integration                         │
   └────────────────────────────────────────────────┘
          │
          └─► Display: Profiles, Property listings, Applications
          └─► Sizes: sm, md, lg | Modes: compact, detailed

6. ENHANCED SEARCH
   ┌────────────────────────────────────────────────┐
   │  EnhancedSearch.tsx                            │
   │  ├─ Recent searches (localStorage)             │
   │  ├─ Quick filter pills                         │
   │  ├─ Advanced filters toggle                    │
   │  └─ Profile-specific suggestions               │
   └────────────────────────────────────────────────┘
          │
          ├─► Quick Filters:
          │   • Popular cities (6)
          │   • Price ranges (4)
          │   • Property types
          │
          └─► Smart Features:
              • Autocomplete from history
              • One-click presets
              • Recent searches memory

7. MESSAGE TEMPLATES
   ┌────────────────────────────────────────────────┐
   │  MessageTemplates.tsx                          │
   │  ├─ 8 pre-written templates                    │
   │  ├─ 4 categories (visite, info, nego, maint)   │
   │  ├─ Profile filtering                          │
   │  └─ One-click insertion                        │
   └────────────────────────────────────────────────┘
          │
          └─► Categories:
              • 📅 Visite (visit requests)
              • 📄 Information (inquiries)
              • 📍 Négociation (price discussion)
              • ⏰ Maintenance (repairs)


┌──────────────────────────────────────────────────────────────────┐
│                    INTEGRATION POINTS                            │
└──────────────────────────────────────────────────────────────────┘

HOME PAGE (/)
├─ ProfileWelcome          (if authenticated)
├─ EnhancedSearch          (hero section)
└─ ContextualHelp          (feature explanations)

DASHBOARD (/dashboard/*)
├─ OnboardingTooltip       (first visit)
├─ ProfileQuickActions     (sidebar/header)
├─ TrustIndicator          (profile widget)
└─ ContextualHelp          (inline help)

SEARCH PAGE (/recherche)
├─ EnhancedSearch          (main component)
├─ TrustIndicator          (on property cards)
└─ ContextualHelp          (filter explanations)

MESSAGES (/messages)
├─ MessageTemplates        (compose area)
├─ TrustIndicator          (contact profiles)
└─ ContextualHelp          (feature tips)

PROFILE (/profil)
├─ TrustIndicator          (prominent display)
├─ ProfileQuickActions     (action shortcuts)
└─ OnboardingTooltip       (verification guide)

PROPERTY DETAIL (/propriete/:id)
├─ TrustIndicator          (owner trust)
├─ MessageTemplates        (contact owner)
└─ ContextualHelp          (application process)


┌──────────────────────────────────────────────────────────────────┐
│                    DATA FLOW                                     │
└──────────────────────────────────────────────────────────────────┘

USER LOGIN
    │
    ├─► AuthContext updates
    │      │
    │      └─► Profile loaded from Supabase
    │             │
    │             ├─► user_type detected
    │             ├─► verification_status loaded
    │             └─► profile_setup_completed checked
    │
    └─► Profile-specific components render
           │
           ├─► ProfileWelcome (personalized)
           ├─► ProfileQuickActions (filtered)
           ├─► TrustIndicator (calculated)
           └─► OnboardingTooltip (if first visit)


SEARCH FLOW
    │
    ├─► EnhancedSearch component
    │      │
    │      ├─► Load recent searches (localStorage)
    │      ├─► Display quick filters
    │      └─► User selects/types
    │
    └─► Search executed
           │
           ├─► Query Supabase
           ├─► Results with TrustIndicator
           └─► Save to recent searches


MESSAGE FLOW
    │
    ├─► Messages page
    │      │
    │      ├─► Load conversations
    │      └─► Display MessageTemplates
    │
    └─► User composes
           │
           ├─► Select template (optional)
           ├─► Customize message
           └─► Send via Supabase


┌──────────────────────────────────────────────────────────────────┐
│                    STATE MANAGEMENT                              │
└──────────────────────────────────────────────────────────────────┘

Global State (AuthContext)
├─ user: User | null
├─ profile: Profile | null
├─ session: Session | null
└─ loading: boolean

Component State (Local)
├─ OnboardingTooltip
│   ├─ currentStep: number
│   └─ isVisible: boolean
│
├─ ContextualHelp
│   └─ isOpen: boolean
│
├─ EnhancedSearch
│   ├─ filters: SearchFilters
│   ├─ showAdvanced: boolean
│   └─ recentSearches: string[]
│
└─ MessageTemplates
    └─ isOpen: boolean

Persistent State (LocalStorage)
├─ onboarding-${userType}-complete: boolean
├─ recentSearches: string[]
└─ help-dismissed-${feature}: boolean


┌──────────────────────────────────────────────────────────────────┐
│                    PERFORMANCE OPTIMIZATION                      │
└──────────────────────────────────────────────────────────────────┘

Bundle Optimization
├─ Lazy loading: MapboxMap
├─ Code splitting: Route-based
├─ Tree shaking: Enabled
└─ Minification: Production build

Render Optimization
├─ Memoization: Profile detection
├─ Conditional rendering: Profile-specific
├─ Event delegation: Click handlers
└─ Debouncing: Search input (300ms)

Storage Optimization
├─ LocalStorage: Recent searches (max 5)
├─ SessionStorage: Temporary filters
└─ Memory: Component state only


┌──────────────────────────────────────────────────────────────────┐
│                    ACCESSIBILITY (a11y)                          │
└──────────────────────────────────────────────────────────────────┘

All Components Include:
├─ ARIA labels
├─ Keyboard navigation
├─ Screen reader support
├─ Focus management
├─ Color contrast (WCAG AA)
└─ Semantic HTML


┌──────────────────────────────────────────────────────────────────┐
│                    MONITORING & ANALYTICS                        │
└──────────────────────────────────────────────────────────────────┘

Track Events:
├─ onboarding_started
├─ onboarding_completed
├─ onboarding_skipped
├─ help_opened
├─ quick_action_clicked
├─ template_used
├─ search_performed
└─ trust_indicator_viewed

Metrics:
├─ Time to first action
├─ Feature adoption rate
├─ Onboarding completion %
├─ Help system usage
├─ Search efficiency
└─ Template adoption


┌──────────────────────────────────────────────────────────────────┐
│                    BUILD OUTPUT                                  │
└──────────────────────────────────────────────────────────────────┘

✓ 2015 modules transformed
✓ Built in 13.88s
✓ 0 errors, 0 warnings
✓ Gzip size optimized
✓ Production ready

Assets:
├─ index.html (1.88 kB)
├─ CSS (89.95 kB → 12.74 kB gzip)
├─ JS Core (1,271.77 kB → 331.86 kB gzip)
└─ JS Mapbox (1,668.20 kB → 462.79 kB gzip)


═══════════════════════════════════════════════════════════════════
                        READY FOR DEPLOYMENT 🚀
═══════════════════════════════════════════════════════════════════
