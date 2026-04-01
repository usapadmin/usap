# US Apparel — Full Build Scoping Doc
## Build the entire system end-to-end, right now

### Architecture

```
Next.js App (single app, multiple pages)
├── /                    → Dashboard (executive overview)
├── /catalog             → B2B Catalog (dynamic pricing by tier)
├── /orders              → Order Management (lifecycle tracking)
├── /inventory           → Live Inventory Tracker
├── /reorder             → AI Smart Reorder Predictions
├── /customers           → Customer CRM
├── /portal              → Customer-facing portal (login, order, track)
└── /api/                → API routes
    ├── /api/orders      → Order CRUD + QB sync
    ├── /api/inventory   → Inventory sync
    ├── /api/customers   → Customer CRUD
    ├── /api/pricing     → Dynamic pricing engine
    ├── /api/shipping    → ShipStation integration
    ├── /api/reorder     → AI prediction engine
    └── /api/auth        → Supabase auth wrapper

Supabase (PostgreSQL)
├── customers            → B2B accounts, tiers, contacts
├── products             → Full catalog (from scrape)
├── inventory            → Stock levels per SKU
├── orders               → Order lifecycle
├── order_items          → Line items per order
├── pricing_tiers        → Tier definitions + rules
├── customer_pricing     → Customer-to-tier mapping
├── reorder_predictions  → AI predictions
└── shipping             → Tracking numbers, status

Tech Stack:
- Next.js 15 (App Router)
- Tailwind CSS + shadcn/ui
- Supabase (DB + Auth + Realtime)
- Chart.js (dashboards)
- Claude API (AI predictions)
- Deployed on Netlify
```

---

## Phases & Tasks

### PHASE 1: Database + Seed Data (Agent 1)
- [x] Create Supabase schema (all tables above)
- [x] Seed with real US Apparel product data (scraped)
- [x] Seed demo customers, orders, inventory levels
- [x] Set up Supabase Auth (admin + customer roles)
- [x] Create pricing tiers (Platinum/Gold/Silver)

### PHASE 2: Core App Scaffolding (Agent 2)
- [x] Initialize Next.js 15 project
- [x] Set up Tailwind + shadcn/ui
- [x] Create layout (sidebar nav, topbar, glass theme matching demo)
- [x] Set up Supabase client connection
- [x] Create auth pages (login/signup)

### PHASE 3: Dashboard + Analytics (Agent 3)
- [x] Executive dashboard page (revenue, orders, customers, inventory KPIs)
- [x] Revenue chart (by product line, monthly)
- [x] Category donut chart
- [x] Recent orders widget
- [x] Top products widget
- [x] Low stock alerts

### PHASE 4: B2B Catalog + Dynamic Pricing (Agent 4)
- [x] Product catalog page with filters (category, subcategory)
- [x] Dynamic pricing — shows tier price based on logged-in customer
- [x] Product detail pages
- [x] "Add to Order" functionality (cart)
- [x] Auto-generate PDF price sheet per tier

### PHASE 5: Order Management (Agent 5)
- [x] Order list page (with status filters)
- [x] Order detail page (line items, timeline, status)
- [x] Create new order flow
- [x] Order status lifecycle (pending → processing → shipped → delivered)
- [x] API routes for order CRUD

### PHASE 6: Inventory Tracker (Agent 6)
- [x] Inventory dashboard (stock levels, capacity, incoming)
- [x] Critical/low/healthy stock views
- [x] Reorder buttons
- [x] Stock level history chart
- [x] Real-time updates via Supabase Realtime

### PHASE 7: Customer CRM (Agent 7)
- [x] Customer list with tier badges
- [x] Customer detail page (order history, LTV, top products)
- [x] Tier management (assign/change tiers)
- [x] Customer onboarding flow
- [x] Contact management

### PHASE 8: AI Smart Reorder (Agent 8)
- [x] Reorder prediction page
- [x] AI engine (analyzes order frequency per customer)
- [x] Confidence scoring
- [x] "Send Reminder" action
- [x] Overdue restock alerts

### PHASE 9: Customer Portal (Agent 9)
- [x] Customer login (separate from admin)
- [x] Customer sees THEIR catalog with THEIR pricing
- [x] Customer can place orders
- [x] Customer can track order status
- [x] Customer can view invoices

### PHASE 10: Deploy (Agent 10)
- [x] Build + deploy to Netlify
- [x] Connect Supabase production
- [x] Test all flows end-to-end
- [x] Generate demo credentials

---

## Agent Assignment

| Agent | Phase | Description |
|-------|-------|-------------|
| Agent 1 | Phase 1 | Database schema + seed data |
| Agent 2 | Phase 2 + 3 | App scaffolding + Dashboard |
| Agent 3 | Phase 4 | B2B Catalog + Pricing |
| Agent 4 | Phase 5 + 6 | Orders + Inventory |
| Agent 5 | Phase 7 + 8 | CRM + AI Reorder |
| Agent 6 | Phase 9 + 10 | Customer Portal + Deploy |

Total: 6 parallel agents building simultaneously
