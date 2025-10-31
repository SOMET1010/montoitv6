# 🚀 EPICs 14-17: Quick Start Guide

**Pour:** Équipe de développement
**Version:** 3.3.0
**Mise à jour:** 31 Octobre 2025

---

## ⚡ Démarrage Rapide (5 min)

### 📚 Documents à Lire (Ordre de priorité)

1. **EPICS_14_17_SUMMARY.md** (20 min) ← **COMMENCEZ ICI**
   - Vue d'ensemble rapide
   - Objectifs business
   - ROI et budget

2. **ROADMAP_V3.3.0.md** (30 min)
   - Planning 11 semaines
   - Allocation ressources
   - Risques et mitigation

3. **EPICS_14_17_USER_STORIES.md** (2-3h)
   - Spécifications détaillées
   - Critères d'acceptation
   - Schémas database
   - **Référence principale développement**

---

## 🎯 Par Rôle

### Développeur Backend

**Focus:** Epic 14 (CEV ONECI) et Epic 16 (Maintenance)

**À lire en priorité:**
- US-064: API ONECI Soumission (page 12-15)
- US-065: Webhook ONECI (page 15-19)
- US-078: Attribution Auto Prestataires (page 67-70)

**Tables database à créer:**
- `cev_requests` (Epic 14)
- `contractors` (Epic 16)
- `maintenance_assignments` (Epic 16)

**APIs externes:**
- ONECI CEV API (credentials requis)
- Webhooks ONECI (configuration)

**Outils:**
- Supabase edge functions
- PostgreSQL functions
- Cron jobs

---

### Développeur Frontend/Full-Stack

**Focus:** Epic 15 (Mandats) et Epic 17 (Dashboards)

**À lire en priorité:**
- US-071: Création Mandat (page 49-54)
- US-081: Widgets Drag-and-Drop (page 78-82)
- US-082: Alertes AI Insights (page 82-86)

**Composants à créer:**
- Formulaire mandat (multi-step)
- Dashboard widgets système
- Report builder
- Centre notifications

**Bibliothèques:**
- react-grid-layout (widgets drag-and-drop)
- jsPDF (génération rapports)
- Web Push API (notifications)

---

### QA Engineer

**Focus:** Tests critiques et intégration

**Scénarios prioritaires:**
1. **CEV end-to-end:**
   - Demande → Soumission ONECI → Webhook → Certificat émis

2. **Mandat complet:**
   - Création → Signature → Activation → Rapport mensuel

3. **Maintenance workflow:**
   - Demande → Matching prestataires → Photos → Validation

**Test types:**
- Unit tests (coverage > 80%)
- Integration tests (APIs externes)
- E2E tests (Playwright)
- Performance tests (charge)

**Environnements:**
- Dev: Tests manuels
- Staging: Validation complète
- Prod: Smoke tests post-deploy

---

### Designer UI/UX

**Focus:** Interfaces utilisateur et expérience

**Pages à designer:**
1. Landing page CEV (Epic 14, US-070)
2. Dashboard mandats agence (Epic 15, US-072)
3. Widgets library (Epic 17, US-081)
4. Centre notifications (Epic 17, US-084)

**Composants:**
- Cartes widgets (30+ designs)
- Formulaires multi-étapes
- Visualisations données (charts)
- Modals et dropdowns

**Outils:**
- Figma (designs)
- Tailwind CSS (implémentation)
- Lucide React (icônes)

---

### Product Owner

**Focus:** Backlog et validation

**Responsabilités:**
- Prioriser User Stories
- Clarifier critères acceptation
- Valider démos Sprint Review
- UAT (User Acceptance Testing)
- Communication stakeholders

**Réunions:**
- Sprint Planning (2h, bi-mensuel)
- Daily Standups (15min, quotidien)
- Sprint Review (1h, bi-mensuel)
- Sprint Retrospective (1h, bi-mensuel)

**Outils:**
- Jira/Linear (task tracking)
- Notion (documentation)
- Slack (communication)

---

## 📋 Checklist Avant Sprint 18

### Infrastructure

**Environnements:**
- [ ] Dev: http://localhost:5173
- [ ] Staging: https://staging.montoit.ci
- [ ] Prod: https://montoit.ci

**Accès:**
- [ ] Repository GitHub
- [ ] Supabase (dev + staging + prod)
- [ ] Azure OpenAI API keys
- [ ] API ONECI credentials ⚠️ (en attente)
- [ ] Jira/Linear project
- [ ] Figma designs

**Tools:**
- [ ] VS Code + extensions
- [ ] Node.js 18+
- [ ] Git configured
- [ ] Supabase CLI
- [ ] Playwright (tests E2E)

---

### Database Migrations

**Ordre d'exécution:**

**Sprint 18 (Epic 14 - CEV):**
```sql
-- Migration 1: CEV Requests
20251101_add_cev_requests_table.sql
- Table: cev_requests
- Indexes
- RLS policies

-- Migration 2: CEV Analytics
20251101_add_cev_analytics.sql
- Table: cev_analytics_snapshots
- Functions: generate_cev_analytics_snapshot()
- Cron job: daily snapshot
```

**Sprint 20 (Epic 15 - Mandats):**
```sql
-- Migration 3: Agency Mandates
20251202_add_agency_mandates.sql
- Table: agency_mandates
- Table: mandate_monthly_reports
- Functions
- RLS policies
```

**Sprint 22 (Epic 16 - Maintenance):**
```sql
-- Migration 4: Contractors
20260106_add_contractors_system.sql
- Table: contractors
- Table: maintenance_assignments
- Functions: matching algorithm
- RLS policies
```

**Sprint 23 (Epic 17 - Dashboards):**
```sql
-- Migration 5: Dashboards
20251223_add_dashboards_widgets.sql
- Table: dashboard_layouts
- Table: ai_insights
- Table: report_templates
- Table: report_executions
- Table: notification_preferences
- Functions
- RLS policies
```

---

## 🔧 Setup Environnement Dev

### 1. Clone et Install

```bash
# Clone repo
git clone https://github.com/montoit/platform.git
cd platform

# Install dependencies
npm install

# Copy env
cp .env.example .env.local

# Configure env variables
# VITE_SUPABASE_URL=...
# VITE_SUPABASE_ANON_KEY=...
# AZURE_OPENAI_ENDPOINT=...
# AZURE_OPENAI_API_KEY=...
# (voir .env.example pour liste complète)
```

### 2. Database Setup

```bash
# Link to Supabase project
npx supabase link --project-ref your-project-ref

# Run migrations
npx supabase db push

# Seed data (optionnel)
npm run db:seed
```

### 3. Run Dev Server

```bash
# Start dev server
npm run dev

# Open browser
http://localhost:5173

# Run tests
npm test

# Run E2E tests
npm run test:e2e
```

---

## 📐 Architecture Overview

### Stack Technique

**Frontend:**
- React 18 + TypeScript
- Vite (build tool)
- Tailwind CSS
- Lucide React (icons)
- React Router (navigation)

**Backend:**
- Supabase (Database + Auth + Storage)
- PostgreSQL (database)
- Edge Functions (serverless)
- Row Level Security (RLS)

**AI/ML:**
- Azure OpenAI (GPT-4, GPT-3.5 Turbo)
- LLM Orchestrator (intelligent routing)
- AI Legal Assistant
- Fraud detection

**APIs Externes:**
- ONECI CEV (certification)
- InTouch (paiements)
- Mapbox (cartes)
- CryptoNeo (signature électronique)

---

### Structure Dossiers

```
project/
├── src/
│   ├── components/       # Composants réutilisables
│   │   ├── ui/          # Composants UI de base
│   │   └── charts/      # Graphiques
│   ├── pages/           # Pages de l'app
│   │   ├── Admin/       # Pages admin
│   │   ├── Agency/      # Pages agences
│   │   ├── Owner/       # Pages propriétaires
│   │   └── Tenant/      # Pages locataires
│   ├── services/        # Services métier
│   │   ├── ai/          # Services AI
│   │   └── api/         # API clients
│   ├── hooks/           # React hooks custom
│   ├── stores/          # State management (Zustand)
│   ├── types/           # TypeScript types
│   └── utils/           # Utilitaires
├── supabase/
│   ├── migrations/      # Database migrations
│   └── functions/       # Edge functions
├── tests/
│   ├── unit/           # Tests unitaires
│   ├── integration/    # Tests intégration
│   └── e2e/            # Tests E2E (Playwright)
└── docs/               # Documentation
```

---

### Conventions Code

**Naming:**
- Components: PascalCase (`UserProfile.tsx`)
- Functions: camelCase (`getUserById()`)
- Constants: UPPER_SNAKE_CASE (`MAX_FILE_SIZE`)
- CSS classes: kebab-case (`user-profile-card`)

**Files:**
- 1 composant par fichier
- Co-located tests (`UserProfile.test.tsx`)
- Index files pour exports (`components/ui/index.ts`)

**TypeScript:**
- Strict mode enabled
- No `any` (use `unknown` si nécessaire)
- Interfaces pour props
- Types pour data

**Git:**
- Branches: `feature/epic-14-cev-requests`
- Commits: `feat(epic-14): add CEV request form`
- PR: 2 reviewers minimum

---

## 🧪 Testing Strategy

### Unit Tests (Jest/Vitest)

**Cible:** Functions, utilities, hooks

```typescript
// Example: services/ai/llmOrchestrator.test.ts
describe('LLMOrchestrator', () => {
  it('selects GPT-4 for legal queries', () => {
    const model = llmOrchestrator.selectOptimalModel({
      requiresExpertise: 'legal',
      ...
    });
    expect(model).toBe('gpt-4');
  });
});
```

**Coverage:** > 80%

---

### Integration Tests

**Cible:** API calls, database, edge functions

```typescript
// Example: integration/cev-workflow.test.ts
describe('CEV Workflow', () => {
  it('creates CEV request and submits to ONECI', async () => {
    // Create request
    const request = await createCEVRequest(data);
    expect(request.status).toBe('pending_documents');

    // Submit to ONECI
    const result = await submitToONECI(request.id);
    expect(result.status).toBe('submitted');
    expect(result.oneci_reference).toBeDefined();
  });
});
```

---

### E2E Tests (Playwright)

**Cible:** User flows complets

```typescript
// Example: e2e/cev-request.spec.ts
test('landlord can request CEV certificate', async ({ page }) => {
  // Login
  await page.goto('/auth');
  await page.fill('#email', 'landlord@test.ci');
  await page.fill('#password', 'password');
  await page.click('button[type="submit"]');

  // Navigate to contract
  await page.goto('/contracts/123');

  // Click CEV button
  await page.click('button:has-text("Obtenir Certificat CEV")');

  // Fill form
  await page.fill('#landlord-cni', 'CI0123456789');
  await page.setInputFiles('#cni-front', 'fixtures/cni-front.jpg');
  // ...

  // Submit
  await page.click('button:has-text("Soumettre")');

  // Verify
  await expect(page.locator('.success-message')).toBeVisible();
});
```

---

## 🐛 Debugging Tips

### Common Issues

**1. API ONECI timeout:**
```typescript
// Augmenter timeout
const response = await fetch(url, {
  signal: AbortSignal.timeout(60000) // 60s
});
```

**2. RLS policies bloquent requête:**
```sql
-- Vérifier policies
SELECT * FROM pg_policies WHERE tablename = 'cev_requests';

-- Tester avec admin
SET ROLE postgres;
SELECT * FROM cev_requests;
```

**3. Build errors TypeScript:**
```bash
# Clean cache
rm -rf node_modules/.vite
npm run build
```

**4. Database migration failed:**
```bash
# Rollback
npx supabase db reset

# Re-apply
npx supabase db push
```

---

### Debug Tools

**Browser DevTools:**
- Network tab (API calls)
- Console (errors)
- React DevTools (components)

**VS Code Extensions:**
- ESLint
- Prettier
- TypeScript
- Supabase
- Playwright Test

**Supabase Dashboard:**
- Table Editor
- SQL Editor
- Logs
- Storage

---

## 📞 Support et Communication

### Channels Slack

- **#dev-epic-14-cev** - Epic 14 discussions
- **#dev-epic-15-mandats** - Epic 15 discussions
- **#dev-epic-16-maintenance** - Epic 16 discussions
- **#dev-epic-17-dashboards** - Epic 17 discussions
- **#dev-general** - Questions générales
- **#dev-bugs** - Bug reports
- **#dev-reviews** - Code reviews

### Meetings

**Daily Standup:** 9h30, 15min
- What I did yesterday
- What I'll do today
- Blockers

**Sprint Planning:** Lundi, 10h, 2h
- Review backlog
- Select User Stories
- Estimate points
- Define Sprint Goal

**Sprint Review:** Vendredi, 15h, 1h
- Demo features
- Stakeholder feedback
- Acceptance validation

**Sprint Retrospective:** Vendredi, 16h, 1h
- What went well
- What to improve
- Action items

---

## 🎯 Sprint 18 (Premier Sprint) - Epic 14

### Dates: 4 Nov - 15 Nov 2025 (2 semaines)

### Sprint Goal
"Implémenter workflow demande CEV complet avec intégration API ONECI."

### User Stories
1. **US-063:** Demande Certificat CEV (21 pts)
2. **US-064:** API ONECI Soumission (21 pts)
3. **US-065:** Webhook ONECI Statut (13 pts)
4. **US-066:** Affichage Vérification CEV (13 pts)

**Total:** 68 points

### Capacity
- 2 devs × 2 semaines × 40h = 160h
- Vélocité cible: 60-70 points/sprint
- **Sprint 18 = 68 points ✅ Réaliste**

### Tasks Sprint 18

**Semaine 1:**

**DEV1 (Backend):**
- [ ] Jour 1-2: Migration database `cev_requests`
- [ ] Jour 3-4: Edge function `oneci-cev-submit`
- [ ] Jour 5: Edge function `oneci-cev-webhook`
- [ ] Tests unitaires API calls

**DEV2 (Frontend):**
- [ ] Jour 1-2: Page formulaire demande CEV
- [ ] Jour 3: Upload documents + validation
- [ ] Jour 4-5: Intégration paiement 5K FCFA
- [ ] Tests composants

**Semaine 2:**

**DEV1:**
- [ ] Jour 6-7: Webhook ONECI handlers
- [ ] Jour 8: Notifications statut CEV
- [ ] Jour 9-10: Tests intégration ONECI
- [ ] Documentation API

**DEV2:**
- [ ] Jour 6-7: Page vérification publique CEV
- [ ] Jour 8: QR Code scanning
- [ ] Jour 9: Modal certificat display
- [ ] Jour 10: Tests E2E workflow complet

**QA1:**
- Tests manuels continus
- Automation tests critiques
- Bug reports et retests

---

### Definition of Done Sprint 18

- [x] Toutes US complétées
- [x] Tests passent (unit + integration + E2E)
- [x] Code reviewed et merged
- [x] Déployé sur staging
- [x] Démo au Product Owner
- [x] Documentation à jour
- [x] Pas de bugs bloquants

---

## 🚀 Ready to Start!

**Prochaines étapes:**

1. ✅ **Lire ce guide** (fait!)
2. ⏳ **Setup environnement** (30 min)
3. ⏳ **Lire US-063 à US-066** (1h)
4. ⏳ **Sprint Planning** (Lundi 4 Nov, 10h)
5. ⏳ **Start coding!** 🎉

**Questions?**
- Slack: #dev-general
- Email: tech-lead@montoit.ci
- Documentation: [EPICS_14_17_USER_STORIES.md](./EPICS_14_17_USER_STORIES.md)

---

**Bonne chance et bon code! 💪**

---

**Document Version:** 1.0
**Créé le:** 31 Octobre 2025
**Pour:** Équipe Dev Mon Toit v3.3.0
**Mis à jour:** Avant chaque Sprint
