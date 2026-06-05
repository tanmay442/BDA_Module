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
| PATCH | /api/users/me/onboard | Set name, role (bda/manager only), company (first-time setup) |
| GET | /api/users | List users (filtered by role for BDA) |
| GET | /api/users/:id | Get user by ID (admin/manager) |
| PATCH | /api/users/:id/role | Update role (admin only) |

### Demo
| Method | Path | Description |
|--------|------|-------------|
| POST | /api/demo/switch-role | Switch the current user's role. **Only enabled when `ALLOW_DEMO_ROLE_SWITCH=true` on the backend** and the UI button is shown when `VITE_ALLOW_DEMO_SWITCH=true` on the frontend. |

### Reminders
| Method | Path | Description |
|--------|------|-------------|
| GET | /api/reminders | Overdue / due today / upcoming tasks |

---

## Database Collections

### User
clerkId, name, email, role (admin/manager/bda), department, company

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

### Demo Mode (Role Switcher)
For portfolio reviewers, the app exposes a safe way to switch between BDA and Manager views without breaking the regular security model. Enable it by setting both `ALLOW_DEMO_ROLE_SWITCH=true` (backend) and `VITE_ALLOW_DEMO_SWITCH=true` (frontend). A floating **"Demo: <current role>"** button appears in the bottom-right corner of the app; clicking it lets you swap to bda/manager/admin. The endpoint writes the new role to the authenticated user's record, and the React Query cache is invalidated so the UI updates immediately. **Leave both env vars unset in production.**

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

---

## Environment Variables

### Backend (.env)
```
PORT=5000
NODE_ENV=development
MONGO_URI=mongodb+srv://<user>:<pass>@cluster/<db>
CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...
PUSHER_APP_ID=<id>
PUSHER_KEY=<key>
PUSHER_SECRET=<secret>
PUSHER_CLUSTER=<cluster>
ALLOW_DEMO_ROLE_SWITCH=true   # set to false (or omit) in production
```

### Frontend (.env)
```
VITE_API_BASE_URL=http://localhost:5000/api
VITE_CLERK_PUBLISHABLE_KEY=pk_test_...
VITE_PUSHER_KEY=<key>
VITE_PUSHER_CLUSTER=<cluster>
VITE_ALLOW_DEMO_SWITCH=true   # set to false (or omit) in production
```

---

## Getting Started

```bash
# Backend
cd backend
npm install
cp .env.example .env  # fill in your values
npm run dev

# Frontend
cd frontend
npm install
cp .env.example .env  # fill in your values
npm run dev

# Seed demo data (optional)
cd backend
node scripts/seed.js
```
