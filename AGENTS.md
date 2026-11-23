# CollectOps Project Memory

## Project Overview
CollectOps is a fictional enterprise React demo for **Collection Operations & Cash Reconciliation** in NBFC/HFC-style lending. It simulates agent EMI collection, cash deposits, supervisor verification, and audit tracking. It is a frontend-only portfolio project with localStorage persistence and no real banking integrations.

## What Has Been Built

### Phase 1 — Foundation
- React 19 + Vite 6 + Tailwind CSS v4 + React Router v7
- Enterprise layout with collapsible sidebar and topbar
- Protected routes and demo login
- Reusable UI kit (Button, Input, Select, Modal, Badge, KpiCard, DataTable, SearchInput, Pagination, EmptyState, PageHeader)

### Phase 2 — Dashboard + Data Layer
- Deterministic mock data generator (20 agents, 50 customers, ~46 days of collections, deposits, audit logs)
- localStorage-backed service layer (`dataService`) + `DataContext`
- Dashboard KPIs and 4 charts (daily, monthly trend, agent-wise, branch-wise)
- Date range and branch filters

### Phase 3 — Agent Management
- Agent listing with search/branch/status filters
- Add/Edit agent modal with validation
- Agent performance modal (target progress + recent collections)
- Assign customers modal (checkbox list)
- Audit logging for agent actions

### Phase 4 — Customers & Loan Accounts
- Customer listing with search/branch/agent/status filters
- Edit customer modal (auto status/branch sync, agent reassignment)
- Overdue highlighting

### Phase 5 — Cash Collection Recording
- Record collection modal with auto-fill from selected customer
- Unique `TXN-#####` IDs and `RCP######` references
- Validation: required fields, no future dates, duplicate reference check
- Updates customer outstanding and dashboard KPIs

### Phase 6 — Cash Reconciliation
- Per-agent cash position table (collected, verified deposits, pending, cash in hand, flag)
- Submit deposit with business rules: amount <= available cash, unique UTR reference
- Supervisor approve/reject flow (rejection requires reason)
- Mismatch / High Holding flags
- Audit logging for deposit lifecycle

### Phase 7 — Reports & Audit Logs
- 5 report types: daily collection, agent performance, branch-wise, cash deposit, pending reconciliation
- Date range + branch filters
- CSV export
- Audit log viewer with search + action filter

### Phase 8 — Polish
- Modal Escape-to-close + scroll lock
- Bundle splitting (vendor/charts)
- Removed dead code
- Final README

### Additional Features
- User registration (stored in localStorage, auto-login)
- Topbar user dropdown with logout confirmation modal

## Architecture

```
src/
├── components/
│   ├── agents/ collections/ customers/ reconciliation/ charts/ layout/ ui/
├── constants/
├── context/            # AuthContext, DataContext
├── hooks/              # useLocalStorage, useDebounce
├── layouts/            # AppLayout
├── mock/               # users.js, seed.js (deterministic generator)
├── pages/              # All module pages
├── services/           # api.js, authService.js, dataService.js
└── utils/              # formatters, storage, idGenerator, csv
```

## Commands
- `npm install` — install dependencies
- `npm run dev` — dev server
- `npm run build` — production build (verified passing)

## Demo Credentials
- `manager@collectops.demo` / `demo123`
- `supervisor@collectops.demo` / `demo123`
- Or use the **Register** button on the login screen

## Business Rules
- Cash in hand = cash collected − verified deposits
- Deposit amount cannot exceed agent's available cash (in hand − pending deposits)
- Deposit reference (UTR) must be unique
- Rejected deposits require a reason
- Collection references must be unique; no future payment dates

## Notes
- Project is **complete for demo/portfolio scope**
- Not production-ready: no real backend, no real payments, plaintext demo passwords
- To reset data: clear `collectops_*` localStorage keys
