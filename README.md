# CollectOps

**Collection Operations & Cash Reconciliation Management System**

An enterprise-style frontend demo inspired by the collection workflows used in NBFC/HFC lending operations — agents collecting customer EMI payments, depositing cash into bank accounts, and supervisors reconciling cash positions. All data is fictional and persisted in `localStorage`. No real banking integrations or payments.

## Tech Stack

- React 19 + JavaScript ES6+ (functional components & hooks only)
- Vite 6
- Tailwind CSS v4 (`@tailwindcss/vite`, `@theme` design tokens)
- React Router v7 (protected routes, nested layouts)
- Recharts · Lucide React · Axios (mock service layer)
- Context API (`AuthContext`, `DataContext`) + LocalStorage persistence

## Getting Started

```bash
npm install
npm run dev
```

Open the printed local URL (default `http://localhost:5173`).

## Demo Credentials

| Role | Email | Password |
|---|---|---|
| Collection Manager | `manager@collectops.demo` | `demo123` |
| Supervisor | `supervisor@collectops.demo` | `demo123` |

You can also choose **Register** on the login screen to create a demo account. Registered users are stored in localStorage and can sign in after refresh.

## Features

### 1. Dashboard
- KPIs: collection today, monthly target (with % achieved), pending EMI, overdue accounts, cash collected, cash deposited, cash in hand
- Charts: daily collection bar, 6-month trend vs target, top agents, branch distribution
- Date-range presets and branch filter applied globally

### 2. Collection Agents
- 20 seeded agents; add/edit via validated modal forms
- Derived columns: assigned customers, collected amount, pending/completed visits
- Performance view with target progress bar and recent collections
- Customer assignment modal (searchable checkbox list, reassign support)

### 3. Customers & Loan Accounts
- 50 customers with loan accounts, EMI, outstanding, overdue tracking
- Search + branch/agent/status filters (including "Unassigned")
- Edit modal syncs status and branch automatically

### 4. Cash Collections
- Record collections: customer picker auto-fills loan/EMI/agent
- Sequential `TXN-#####` IDs, unique `RCP` references, no future dates
- Recording reduces customer outstanding and updates all KPIs

### 5. Cash Reconciliation (core module)
- Per-agent cash position: `cash in hand = cash collected − verified deposits`
- Deposits validated: cannot exceed available cash (in hand − pending), unique UTR
- Supervisor approve/reject flow; rejection requires a reason
- Flags: Reconciled / High Holding (≥ ₹50k) / Mismatch (negative)

### 6. Reports
- Daily collection, agent performance, branch-wise, cash deposit, pending reconciliation
- From/To date + branch filters; CSV export of the filtered view

### 7. Audit Logs
- Every mutation logged: collections, agent CRUD, assignments, customer edits, deposit lifecycle
- Timestamp, user, color-coded action, reference ID, details

## Project Structure

```
src/
├── components/
│   ├── agents/         # AgentFormModal, AgentPerformanceModal, AssignCustomersModal
│   ├── collections/    # RecordCollectionModal
│   ├── customers/      # CustomerFormModal
│   ├── reconciliation/ # DepositFormModal, DepositReviewModal
│   ├── charts/         # ChartCard
│   ├── layout/         # Sidebar, Topbar, ProtectedRoute
│   └── ui/             # Button, Input, Select, Modal, Badge, KpiCard,
│                       # DataTable (sort+pagination), SearchInput, Pagination,
│                       # EmptyState, PageHeader
├── constants/          # Routes, status enums, storage keys
├── context/            # AuthContext, DataContext
├── hooks/              # useLocalStorage, useDebounce
├── layouts/            # AppLayout (sidebar + topbar + Outlet)
├── mock/               # users.js, seed.js (deterministic generator)
├── pages/              # Login, Dashboard, Agents, Customers, Collections,
│                       # Reconciliation, Reports, AuditLogs, NotFound
├── services/           # api.js (axios + latency), authService, dataService
└── utils/              # formatters, storage, idGenerator, csv
```

## React Concepts Demonstrated

- **Context API** for cross-cutting state (auth session + app database) — no prop drilling
- **Custom hooks** (`useAuth`, `useData`, `useDebounce`, `useLocalStorage`)
- **Derived state via `useMemo`** — KPIs, filtered rows, chart data recomputed only when inputs change
- **`useCallback`** for stable mutation handlers in context
- **Controlled forms** with validation, error display, and submit-via-`form` attribute
- **Protected routes** — `ProtectedRoute` wrapper redirects unauthenticated users and returns them post-login
- **Nested routing** — `AppLayout` renders `<Outlet/>` for module pages
- **Service layer** — mock API (`authService`, `dataService`) isolates persistence so a real backend can replace localStorage without touching UI
- **Reusable generic components** — `DataTable` handles sorting/pagination/empty state via a column config
- **Deterministic seeding** — PRNG (`mulberry32`) generates stable fictional data; persisted once to localStorage

## Business Rules Enforced

- Deposits cannot exceed an agent's available cash (in hand − pending deposits)
- Deposit reference numbers must be unique
- Rejected deposits require a reason; approvals record the verifier
- Collection references must be unique; payment dates cannot be in the future
- All mutations persist to localStorage and are reflected across modules + audit log

## Test Cases (Smoke)

| # | Test | Expected |
|---|---|---|
| 1 | Open app logged out | Redirect to `/login` |
| 2 | Login with demo credentials | Dashboard loads, KPIs populated |
| 3 | Refresh | Session + all data persist (localStorage) |
| 4 | Record a cash collection | Appears in Collections; dashboard cash in hand increases |
| 5 | Submit deposit > available cash | Validation error blocks submission |
| 6 | Approve a pending deposit | Cash in hand decreases; audit log written |
| 7 | Export a report | CSV downloads with filtered rows |
| 8 | Collapse sidebar / resize to mobile | Icon rail / overlay sidebar works |
| 9 | Log out | Session cleared → `/login` |

To reset demo data, clear `collectops_*` keys in browser localStorage — the database re-seeds on next load.

## Disclaimer

Portfolio demonstration only. Not affiliated with Credility or any financial institution. Contains no real customer data.
