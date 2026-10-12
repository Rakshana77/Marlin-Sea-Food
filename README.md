# Marine Seafoods Management System (ERP & Mobile POS)

## Architecture Overview

```
marine-seafoods/
│
├── server/            # Existing Node.js + Express + Prisma + PostgreSQL API
│   ├── src/
│   │   ├── routes/    # Domain REST routes (Auth, Sales, Stock, Rates, Day End, etc.)
│   │   ├── services/  # Atomic transactional services (WAC, Stock, COGS, Reversals)
│   │   └── middleware/# JWT Authentication, RBAC (ADMIN, WORKER), CORS, Rate limiting
│   └── tests/         # Integration test suite (Phases 1-7)
│
├── src/               # Existing Desktop/Admin Web Dashboard (Vanilla JS + Tailwind)
│   ├── components/
│   ├── state/
│   └── views/
│
├── mobile-pwa/        # Phase 9: Progressive Web App (PWA) Mobile POS & Operations
│   ├── public/
│   │   ├── manifest.json
│   │   ├── sw.js
│   │   └── icons/
│   ├── src/
│   │   ├── api/       # Centralized API client (Auth, Sales, Stock, Rates, etc.)
│   │   ├── components/# Touch-first POS, Catalog cards, Keypad, Drawers, Modals
│   │   ├── features/  # Reactive POS cart store & state
│   │   ├── hooks/     # useAuth, useCart, useNetwork, usePWAInstall
│   │   ├── pages/     # Billing, Rates, Stock, History, Operations, Login
│   │   ├── styles/    # Tabular numeric styles, safe-area insets, print stylesheet
│   │   └── types/     # Domain models & API types matching backend
│   ├── index.html
│   ├── package.json
│   └── vite.config.ts
│
└── README.md
```

---

## Phase 9 — Progressive Web App (PWA) Mobile POS & Operations

Phase 9 replaces the originally planned native React Native mobile application with a production-grade, lightweight Progressive Web App (PWA) designed for Android phones, tablets, iPads, laptops, and desktop browsers.

### Key Capabilities

1. **Fast Seafood POS Billing**: Touch-first numeric keypad, decimal quantity entry (up to 3 decimal places for kg, e.g. `12.500 kg`), and quick quantity presets (`0.5 kg`, `1 kg`, `2 kg`, `5 kg`, `10 kg`).
2. **Buyer Selection & Creation**: Walk-in customer option (immediate cash/UPI settlement; credit forbidden) and existing buyer search, plus an in-flow "+ New Buyer" quick creation form with auto-selection.
3. **Cart & Atomic Confirmation**: Client-side preview with authoritative backend calculations. Generates an `idempotencyKey` per checkout to prevent duplicate billing upon network re-tries.
4. **Thermal Receipts & Printing**: High-contrast receipt modal with `@media print` thermal slip styling (58mm / 80mm ESC/POS compatible) featuring the required directive: `Thank you for your business.`
5. **Published Daily Rates**: Real-time lookup of today's published rates (`/api/daily-rates/current`) with role-based batch publishing for Admins.
6. **Perpetual Seafood Stock**: Real-time stock balances (`/api/stock`) and movement audit history (`/api/stock/movements`) with WAC average costs.
7. **Harbor Procurement / Collection**: Weighment entry (gross, tare, net weight), published spot purchase rates, advance recovery deduction, and net payable calculations (`/api/purchase-bills`).
8. **Fisherman Advance Visibility**: Separation of Fisherman Advance Recoverable from Supplier Settlement Payable.
9. **Wastage & Spoilage**: Admin loss recording (`/api/stock/wastage`) with non-negative stock guards.
10. **Operational Expenses & Wages**: Vouchers for ice, fuel, coolie wages, transport freight, and maintenance (`/api/expenses`).
11. **Day End Closing & Reconciliation**: Read-only preview for today's date (`/api/day-end/:date/preview`) displaying expected cash vs physical cash, expected stock vs physical stock, variances, and atomic day locking.
12. **Safe PWA & Offline Strategy**: App shell caching via Service Worker (`/sw.js`). Clear offline indicator blocking financial mutations without a live backend connection.

---

## Getting Started

### 1. Start Backend API
```bash
cd server
npm run dev
# Running on http://localhost:5000
```

### 2. Start Mobile PWA
```bash
# From workspace root
npm run dev:pwa
# Or from mobile-pwa directory
cd mobile-pwa
npm run dev
# Running on http://localhost:5174
```

### 3. Start Admin Web
```bash
# From workspace root
npm run dev:client
# Running on http://localhost:5173
```

---

## Testing & Quality Assurance

### Run Mobile PWA Tests
```bash
npm run test:pwa
```
- Validates cart calculation rules, decimal precision, discounts, walk-in credit guards.
- Validates W3C Web App Manifest compliance (name, theme color, icons, display mode).

### Run Backend Integration Tests
```bash
cd server
npm test
```
