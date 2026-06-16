# Manufacturing SalesOps Platform

Imp note --> Log in as a manger to be able to see all the features and with dummy data,to test a employee choose bda it would have no dummy data create some and see back the manager profile and watch the updated changes

Single-tenant Manufacturing Sales Operations platform for managing leads, quotations, tasks, and team performance with role-based dashboards and real-time updates.

---

## Tech Stack

### Backend
- **Runtime**: Node.js (Express 5)
- **Database**: MongoDB with Mongoose ODM (MongoDB Atlas)
- **Auth**: Clerk (`@clerk/express`) — JWT session tokens
- **PDF**: PDFKit — server-side quotation PDF generation
- **Real-time**: Pusher Channels — WebSocket event broadcasting
- **Testing**: Jest + Supertest + MongoMemoryServer

### Frontend
- **Framework**: React 19 with Vite 8
- **Routing**: react-router-dom v7
- **State**: TanStack React Query (server state) + Zustand (client state)
- **Auth**: Clerk React SDK with token forwarding
- **Styling**: Tailwind CSS v4 via `@tailwindcss/vite` plugin
- **Charts**: Recharts (PipelineChart, LeadSourcesChart, RevenueTrendChart)
- **Drag and Drop**: `@hello-pangea/dnd` for Kanban
- **WebGL**: `ogl` for animated gradient background (Grainient)
- **Icons**: `@untitledui/icons` (sidebar, topbar) + `lucide-react` (KPI cards)
- **Forms/UI**: react-aria-components, react-aria
- **Class merging**: tailwind-merge (through `cx` utility)
- **Testing**: Vitest + Testing Library + jsdom

---

## External UI Components and Libraries

### Component Library (local)
The frontend includes a set of reusable primitives under `src/components/`:
- **Avatar** (with online indicator, company icon, count groups)
- **Badge** (pill, badge, modern variants with color system)
- **Button** (primary, secondary, tertiary, link variants)
- **Checkbox**, **Toggle**, **Radio buttons**, **Tooltip**
- **Dropdown** (with menu items and icons)
- **Table** (react-aria-components driven, sortable columns, selectable rows)
- **Charts**: PipelineChart (vertical bar), LeadSourcesChart (donut), RevenueTrendChart (area), bar-chart, pie-chart-xs, line-chart-02
- **Navigation**: NavList, NavItem, NavButton, SidebarSectionDividers with config-driven item rendering

### Why These Libraries
- **Recharts over alternatives**: React-native, declarative API, TailwindCSS compatible via className passthrough, lightweight compared to d3 wrapper approaches
- **@hello-pangea/dnd over react-beautiful-dnd**: Maintained fork of the canonical React drag-and-drop library
- **ogl over three.js**: Minimal WebGL2 abstraction — only 8KB for the animated gradient use case
- **@untitledui/icons + lucide-react**: UntitledUI for navigation icons (matching the Tailwind design system), Lucide for KPI cards (broader icon set for data/metrics)
- **Zustand over Redux/Context**: Minimal boilerplate for the single client-state concern (auth store)
- **TanStack React Query over SWR/RTK Query**: Best-in-class cache invalidation, polling, and mutation management for REST APIs
- **PDFKit over puppeteer/jspdf**: Server-side generation with no browser dependency, lower memory footprint

---

## Repository Structure

```
BDA_Module/
  backend/
    src/
      app.js                          # Express app entry, middleware setup, route mounting
      config/database.js              # Mongoose connection
      middleware/
        auth.js                       # Clerk authenticate + role-based authorize guards
        errorHandler.js               # Global error handler
      modules/
        activities/                   # Activity CRUD (notes, calls, meetings per lead)
        auditLogs/                    # Audit trail for entity changes
        clients/                      # Client records (auto-created when lead is won)
        leads/                        # Lead pipeline CRUD + stage transitions + reassignment
        quotations/                   # Quotation CRUD + PDF generation + stage auto-sync
        reminders/                    # Due today / overdue / upcoming tasks endpoint
        tasks/                        # Task CRUD with priority and due dates
        users/                        # User sync + onboarding + role management
      services/pusher.js              # Pusher broadcasting helper
    scripts/seed.js                   # Demo data seeder
    tests/                            # Jest test suite (model + route tests)
    jest.config.js
    package.json
  frontend/
    src/
      App.jsx                         # Root: ClerkProvider, QueryClient, routes
      main.jsx                        # React entry
      pages/                          # Route-level page components
        Dashboard.jsx                 # Role-based dashboard with KPI cards + charts + widgets
        LeadsPage.jsx                 # Kanban board + lead management
        TasksPage.jsx                 # Task list with filtering and actions
        QuotationsPage.jsx            # Quotation list with status management and PDF
        UsersPage.jsx                 # User table with role editing + manager report panel
        OnboardingPage.jsx            # First-time setup (name, role, company)
        SignInPage.jsx / SignUpPage.jsx
      components/
        AppLayout.jsx                 # Sidebar + TopBar + content outlet
        Sidebar.jsx                   # Collapsible navigation with icon-only mode
        TopBar.jsx                    # Logo, company info, reminders bell, UserButton
        KanbanBoard.jsx               # Drag-and-drop pipeline board
        KanbanColumn.jsx / LeadCard.jsx
        LeadDetailPanel.jsx           # Slide-over lead detail with tabs
        CreateLeadModal.jsx / CreateTaskModal.jsx / CreateQuotationModal.jsx / EditQuotationModal.jsx
        UserReportPanel.jsx           # Manager slide-over BDA performance report
        Grainient.jsx                 # WebGL animated background
        application/                  # Table, Charts, Navigation components
        base/                         # Avatar, Badges, Buttons, Checkbox, Dropdown, Toggle, Tooltip
        foundations/                  # Logo, Dot icon, Icon components
      hooks/                          # React Query hooks + Pusher + breakpoint
        useLeads.js, useTasks.js, useQuotations.js, useActivities.js
        useUsers.js, useReminders.js, usePusher.js, use-breakpoint.ts
      services/
        api.js                        # Axios instance with Clerk auth interceptor
      store/
        authStore.js                  # Zustand store
      utils/
        cx.ts                         # tailwind-merge classname utility
        is-react-component.ts
      test/                           # Vitest setup + component tests
    vite.config.js
    package.json
```

---

## API Endpoints

### Leads
| Method | Path | Description |
|--------|------|-------------|
| GET | /api/leads | List leads (query: stage, assignedTo, search) |
| GET | /api/leads/:id | Get single lead |
| POST | /api/leads | Create lead |
| PATCH | /api/leads/:id | Update lead |
| DELETE | /api/leads/:id | Delete lead (admin/manager) |
| PATCH | /api/leads/:id/stage | Stage transition (auto-creates Client on won) |
| PATCH | /api/leads/:id/assign | Reassign lead |

### Tasks
| Method | Path | Description |
|--------|------|-------------|
| GET | /api/tasks | List tasks (query: status, priority, leadId) |
| GET | /api/tasks/:id | Get single task |
| POST | /api/tasks | Create task |
| PATCH | /api/tasks/:id | Update task |
| DELETE | /api/tasks/:id | Delete task |

### Quotations
| Method | Path | Description |
|--------|------|-------------|
| GET | /api/quotations | List quotations (query: leadId, status) |
| GET | /api/quotations/:id | Get single quotation |
| POST | /api/quotations | Create quotation (auto-generated Q-YYYY-NNNN) |
| PATCH | /api/quotations/:id | Update (version bumps on status change) |
| DELETE | /api/quotations/:id | Delete quotation |
| GET | /api/quotations/:id/pdf | Download PDF |

### Activities
| Method | Path | Description |
|--------|------|-------------|
| GET | /api/activities | List activities (query: leadId) |
| POST | /api/activities | Create activity |

### Clients
| Method | Path | Description |
|--------|------|-------------|
| GET | /api/clients | List clients |
| GET | /api/clients/:id | Get single client |
| POST | /api/clients | Create client |

### Users
| Method | Path | Description |
|--------|------|-------------|
| GET | /api/users/me | Get current authenticated user |
| PATCH | /api/users/me/onboard | Set name, role, company (first-time setup) |
| GET | /api/users | List users (filtered by role for BDA) |
| GET | /api/users/:id | Get user by ID (admin/manager) |
| PATCH | /api/users/:id/role | Update role (admin only) |

### Reminders
| Method | Path | Description |
|--------|------|-------------|
| GET | /api/reminders | Overdue / due today / upcoming tasks |

### Webhooks (Clerk)
| Method | Path | Description |
|--------|------|-------------|
| POST | /api/webhooks/clerk | Svix-verified Clerk user lifecycle (user.created, user.updated, user.deleted). Role is never read from the payload. |

### Health
| Method | Path | Description |
|--------|------|-------------|
| GET | /api/health | Liveness probe (no auth) |

---

## Database Collections

### User
clerkId, name, email, imageUrl, role (admin/manager/bda), department, company

### Lead
companyName, contactPerson, email, phone, industry, source, currentStage (new/contacted/requirement_gathered/quotation_sent/negotiation/won/lost), expectedDealValue, assignedTo, createdBy, notes

### Task
title, description, leadId, assignedTo, dueDate, priority (low/medium/high), status (pending/completed)

### Quotation
leadId, quotationNumber, items (productName, quantity, unitPrice, totalPrice, moq, deliveryEstimate), subtotal, tax, grandTotal, status (draft/sent/revised/accepted/rejected), version, createdBy

### Activity
leadId, userId, type (call/note/meeting/follow_up/chat_update), message

### Client
leadId, companyName, contactPerson, email, phone, gstNumber, address, accountManager

### AuditLog
userId, action, entityType, entityId, oldValue, newValue

---

## Key Features

### Role-Based Access
Three roles: admin, manager, bda. BDAs see only their own leads/tasks/quotations. Managers see all team data. Admins additionally manage user roles. Authorization is enforced server-side via Clerk middleware guards.

### Lead Pipeline (Kanban)
Drag-and-drop board with seven stages (new through lost). Stage transitions auto-trigger side effects: quotation_sent upgrades draft quotes to sent, won creates a Client record. Leads can be filtered by search and stage.

### Quotation Management
Itemized quotations with manufacturing-specific fields (MOQ, delivery estimates). Auto-numbering scheme (Q-YYYY-NNNN). Version tracking with auto-increment on status changes. Bidirectional sync with lead stages (sent advances lead stage, accepted closes as won). PDF generation via PDFKit with professional layout.

### Real-Time Updates
Pusher WebSocket channels broadcast events for leads, tasks, quotations, and activities. The frontend usePusher hook subscribes to all channels and invalidates the relevant TanStack React Query caches, keeping multi-session UIs synchronized without polling.

### Dashboard
Role-based dashboards. BDA view: monthly target progress bar, active leads, quotations sent, tasks due today, pipeline funnel chart, lead sources donut chart, today's action items with Done button, hot leads in negotiation. Manager view: total pipeline value, MTD revenue won, win/loss ratio, pending approvals, pipeline funnel, team leaderboard bar chart, revenue trend area chart, recent wins feed, stalled deals alert.

### User Reports (Manager)
Click any user in the Users page to open a slide-over panel showing: KPI stats (total leads, won, tasks completed, quotations), pipeline bar chart, pipeline value and win rate, scrollable task list with status, quotation list with amounts, and lead list with stages.

### Onboarding
First-time sign-in redirects to /onboard where the user sets their name, role (manager/bda), and company. Company is pre-filled and read-only for this single-tenant setup. Onboarding gate guards all protected routes.

### PDF Download
Quotations generate server-side PDFs via PDFKit. Frontend fetches via axios with Clerk JWT token for authenticated download. Downloads use blob response with proper filename.

### Animated Background
Grainient component renders a real-time animated gradient using WebGL2 via the ogl library. It auto-pauses when the tab is hidden (Page Visibility API) or offscreen (IntersectionObserver). Semi-transparent panels (bg-white/80, backdrop-blur-sm) allow the gradient to show through.

### Reminders
The reminders endpoint aggregates tasks into three groups: overdue, due today, and upcoming (next 3 days). The bell icon in the topbar shows a badge count and opens a dropdown with color-coded left-border accent items (red for overdue, yellow for due today, blue for upcoming).

### Clerk Webhook (Identity Sync)
`POST /api/webhooks/clerk` keeps the local `User` collection in sync with Clerk. The route is mounted BEFORE `express.json()` and verifies the Svix signature (`svix-id`, `svix-timestamp`, `svix-signature`) on the raw body; bad signatures return 401, stale timestamps return 410. Handled events: `user.created` / `user.updated` (idempotent upsert by `clerkId`, default role `bda` on create), `user.deleted` (hard delete), unknown events ack with 200 to stop Svix retries. **Role is never read from the Clerk payload** - role changes go exclusively through `PATCH /api/users/:id/role` (admin only) so that Clerk's client-writable `publicMetadata` cannot be used for self-promotion.

### Admin Bootstrap
Set `BOOTSTRAP_ADMIN_EMAILS=you@gmail.com` in the backend env. On every server cold start, `ensureBootstrapAdmins()` scans for that email and, **if and only if the database currently has zero admin rows**, promotes the matching user to `admin` and writes an `AuditLog` entry with `action: 'system.bootstrap_admin'`. The same promotion runs on every authenticated request and on every webhook delivery, so a user who signs in before the webhook arrives is still promoted. After the first admin exists, the bootstrap is permanently a no-op - new emails added to the env var are ignored. This is how you recover admin access after a DB wipe without manual Mongo surgery.

### Rate Limiting
`express-rate-limit` is mounted at three levels, all per-IP and env-overridable: `webhookLimiter` (100 / 5 min) on `/api/webhooks/*`, `generalLimiter` (300 / 5 min) on every authenticated route, and `sensitiveLimiter` (20 / 5 min) on `PATCH /api/users/:id/role` only. 429 responses use standard `RateLimit-*` headers.

### CORS
`backend/src/config/cors.js` reads `CORS_ALLOWED_ORIGINS` and rejects unknown origins with a warning log. In production on Vercel, the frontend and API share an origin so CORS is a no-op; the allowlist is consulted in development only. The Clerk webhook route is server-to-server and is intentionally mounted before CORS so Svix deliveries aren't subject to browser-origin checks.

### Auth Boundary (Clerk + Custom)
Two layers, deliberately scoped: Clerk's `clerkMiddleware` (from `@clerk/express`) attaches session info to the request; the custom `authenticate` middleware then upserts the local `User` row keyed by `clerkId` (using `findOneAndUpdate` with `$setOnInsert: { role: 'bda' }` so it's race-safe against the webhook handler and never overwrites an existing role). The frontend sends the Clerk JWT via an axios interceptor (`Bearer <token>`) so the API gets auth on every request without depending on browser cookies. CORS is the only place these layers interact.

---

## Environment Variables

### Backend (.env)
A complete template lives at the repo root in `.env.example`. Required keys:

```
PORT=5000
NODE_ENV=development
MONGO_URI=mongodb+srv://<user>:<pass>@cluster/<db>
CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...
CLERK_WEBHOOK_SECRET=whsec_...   # from Clerk dashboard -> Webhooks -> Signing Secret
BOOTSTRAP_ADMIN_EMAILS=you@gmail.com  # comma-separated; first admin gets auto-promoted
CORS_ALLOWED_ORIGINS=http://localhost:3000,http://localhost:5173  # dev only; same-origin in prod
PUSHER_APP_ID=<id>
PUSHER_KEY=<key>
PUSHER_SECRET=<secret>
PUSHER_CLUSTER=<cluster>
# Optional rate-limit overrides (defaults shown):
# RATE_LIMIT_WINDOW_MS=300000
# RATE_LIMIT_GENERAL_MAX=300
# RATE_LIMIT_WEBHOOK_MAX=100
# RATE_LIMIT_SENSITIVE_MAX=20
```

### Frontend (.env)
```
VITE_API_BASE_URL=http://localhost:5000/api
VITE_CLERK_PUBLISHABLE_KEY=pk_test_...
VITE_PUSHER_KEY=<key>
VITE_PUSHER_CLUSTER=<cluster>
```

---

## Getting Started

```bash
# Backend
cd backend
npm install
cp ../.env.example ../.env  # env file lives at repo root; fill in your values
npm run dev

# Frontend
cd frontend
npm install
# frontend has no .env.example yet; create frontend/.env with the four VITE_* keys shown above
npm run dev

# Seed demo data (optional)
cd backend
node scripts/seed.js
```


### One-time post-deploy setup

1. **Configure the Clerk webhook** in the Clerk dashboard:
   Webhooks -> Add endpoint -> URL `https://<your-vercel-domain>/api/webhooks/clerk`
   -> subscribe to `user.created`, `user.updated`, `user.deleted` -> copy the
   Signing Secret into the `CLERK_WEBHOOK_SECRET` Vercel env var.
2. **Set `BOOTSTRAP_ADMIN_EMAILS`** in Vercel env to your real email (comma-separated
   if multiple). Sign in once to claim admin; the variable is then ignored for
   everyone else.
3. **Configure CORS** via `CORS_ALLOWED_ORIGINS` if you ever serve the API from a
   different origin than the dashboard. Same-origin on Vercel is the default.
