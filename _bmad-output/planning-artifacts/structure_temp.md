## Project Structure & Boundaries

### Complete Project Directory Structure

```
intelligent-procurement-inventory/
│
├── README.md
├── package.json
├── next.config.ts
├── tsconfig.json
├── postcss.config.mjs
├── eslint.config.mjs
├── .env.local                    # Gitignored (local only)
├── .env.example                  # Template for DATABASE_URL, GEMINI_API_KEY, SESSION_SECRET
├── .gitignore
├── pnpm-lock.yaml
├── pnpm-workspace.yaml
│
├── app/                                    # Next.js App Router
│   ├── globals.css                         # Tailwind + shadcn CSS variables
│   ├── layout.tsx                          # Root layout (fonts, providers)
│   ├── page.tsx                            # Landing page (login redirect if auth)
│   ├── not-found.tsx                        # 404 page
│   ├── error.tsx                            # Error boundary
│   ├── loading.tsx                          # Root loading UI
│   │
│   ├── _actions/                            # Server Actions (barrel export via index.ts)
│   │   ├── index.ts                         # Re-exports all actions
│   │   ├── auth.ts                          # login, logout, register, resetPassword
│   │   ├── inventory.ts                     # createInventoryItem, updateInventoryItem, deleteInventoryItem
│   │   ├── vendors.ts                       # createVendor, updateVendor, deleteVendor
│   │   ├── purchase-orders.ts               # createPO, updatePOStatus, approvePO
│   │   └── dashboard.ts                    # getDashboardStats, getLowStockItems
│   │
│   ├── (auth)/                              # Public routes group (no layout protection)
│   │   ├── layout.tsx                       # Auth layout (minimal, no nav)
│   │   ├── login/
│   │   │   ├── page.tsx                    # Login form
│   │   │   └── components/
│   │   │       └── LoginForm.tsx           # Client component with form
│   │   ├── register/
│   │   │   ├── page.tsx                    # Registration form
│   │   │   └── components/
│   │   │       └── RegisterForm.tsx
│   │   └── forgot-password/
│   │       ├── page.tsx                    # Email input for reset
│   │       └── components/
│   │           └── ForgotPasswordForm.tsx
│   │
│   ├── (dashboard)/                         # Protected routes group
│   │   ├── layout.tsx                       # Dashboard layout (sidebar, header, user menu)
│   │   ├── dashboard/
│   │   │   ├── page.tsx                    # Main dashboard with stats + low stock alerts
│   │   │   ├── loading.tsx                 # Dashboard loading UI
│   │   │   └── components/
│   │   │       ├── StatsCards.tsx           # Total items, low stock count (Server)
│   │   │       ├── LowStockTable.tsx        # Low stock items table (Server)
│   │   │       └── AIChat/
│   │   │           ├── AIChat.tsx           # Chat interface (Client - 'use client')
│   │   │           ├── ChatMessage.tsx       # Individual message component
│   │   │           └── ChatInput.tsx        # Input form for questions
│   │   │
│   │   ├── inventory/
│   │   │   ├── page.tsx                    # Inventory list with filters, pagination
│   │   │   ├── loading.tsx
│   │   │   ├── new/
│   │   │   │   ├── page.tsx               # Add new inventory item form
│   │   │   │   └── components/
│   │   │   │       └── InventoryForm.tsx   # Form (Client)
│   │   │   └── [inventory_id]/
│   │   │       ├── page.tsx                # Edit inventory item
│   │   │       └── components/
│   │   │           └── InventoryForm.tsx   # Pre-filled form (Client)
│   │   │
│   │   ├── vendors/
│   │   │   ├── page.tsx                    # Vendor list
│   │   │   ├── new/
│   │   │   │   ├── page.tsx               # Add vendor form
│   │   │   │   └── components/
│   │   │   │       └── VendorForm.tsx
│   │   │   └── [vendor_id]/
│   │   │       ├── page.tsx                # Edit vendor
│   │   │       └── components/
│   │   │           └── VendorForm.tsx
│   │   │
│   │   ├── purchase-orders/
│   │   │   ├── page.tsx                    # PO list (draft, approved, sent)
│   │   │   ├── new/
│   │   │   │   ├── page.tsx               # Create PO
│   │   │   │   └── components/
│   │   │   │       ├── POForm.tsx          # PO form (Client)
│   │   │   │       └── AddItemDialog.tsx  # Add line items dialog
│   │   │   └── [po_id]/
│   │   │       ├── page.tsx                # View/approve PO
│   │   │       └── components/
│   │   │           ├── POStatusBadge.tsx   # Draft/Approved/Sent badge
│   │   │           └── POActions.tsx       # Approve, Export, Send buttons
│   │   │
│   │   └── settings/
│   │       └── page.tsx
│   │
│   └── api/                                 # API Routes
│       ├── dashboard/
│       │   └── route.ts                     # GET /api/dashboard - stats + alerts
│       ├── ai/
│       │   └── chat/
│       │       └── route.ts                 # POST /api/ai/chat - Gemini proxy
│       ├── inventory/
│       │   └── route.ts                    # GET /api/inventory - paginated list
│       └── vendors/
│           └── route.ts                    # GET /api/vendors - list
│
├── components/                              # Shared UI components
│   ├── ui/                                # shadcn/ui components
│   │   ├── button.tsx
│   │   ├── input.tsx
│   │   ├── table.tsx
│   │   ├── dialog.tsx
│   │   ├── select.tsx
│   │   ├── badge.tsx
│   │   ├── toast.tsx
│   │   └── ...
│   ├── layout/
│   │   ├── Sidebar.tsx                    # Dashboard sidebar navigation
│   │   ├── Header.tsx                     # Top header with user menu
│   │   └── Breadcrumbs.tsx               # Breadcrumb navigation
│   └── common/
│       ├── EmptyState.tsx                  # "No items found" state
│       ├── Pagination.tsx                  # Reusable pagination
│       ├── ConfirmDialog.tsx               # Delete confirmation dialog
│       └── LoadingSpinner.tsx             # Loading indicator
│
├── lib/                                   # Utility functions and configurations
│   ├── prisma.ts                         # Prisma client singleton
│   ├── auth.ts                            # Session management, password hashing
│   ├── validators/                         # Zod schemas for validation
│   │   ├── inventory.ts                   # Inventory item schema
│   │   ├── vendor.ts                     # Vendor schema
│   │   ├── purchase-order.ts              # PO schema
│   │   └── auth.ts                       # Login/register schema
│   ├── ai.ts                              # Gemini API integration
│   └── utils.ts                           # cn() helper + misc utilities
│
├── types/                                  # TypeScript type definitions
│   ├── inventory.ts                       # TInventory, TInventoryForm
│   ├── vendor.ts                         # TVendor, TVendorForm
│   ├── purchase-order.ts                  # TPurchaseOrder, TPOStatus
│   ├── user.ts                           # TUser, TRole
│   └── api.ts                           # API response types
│
├── prisma/
│   ├── schema.prisma                     # Database schema (Prisma)
│   ├── prisma.config.ts                  # Prisma configuration
│   └── migrations/                       # Database migrations
│
├── generated/                             # Generated code
│   └── prisma/                          # Prisma client output
│       └── client/
│
├── middleware.ts                          # Next.js middleware (auth check)
│
├── public/                                # Static assets
│   ├── favicon.ico
│   ├── logo.svg
│   └── images/
│
├── docs/                                  # Project documentation
│
├── _bmad/                                 # BMad method config
│
└── _bmad-output/                          # Planning artifacts
    ├── planning-artifacts/
    │   ├── prd.md
    │   └── architecture.md
    ├── implementation-artifacts/
    └── test-artifacts/
```

### Architectural Boundaries

**API Boundaries:**

- **Server Actions:** Mutation operations - live in `/app/_actions/`
- **API Routes:** Data fetching + external API proxy - live in `/app/api/`
- **Authentication boundary:** Middleware protects all `/(dashboard)/*` routes
- **Data access boundary:** All queries go through Prisma Client (`lib/prisma.ts`)

**Component Boundaries:**

- **Server Components (default):** Pages, layouts, data-display components
- **Client Components (`'use client'`):** Forms, dialogs, interactive UI
- **Shared components:** Co-located with routes when specific, `/components/` when reused
- **shadcn/ui boundary:** All UI primitives in `/components/ui/` - never modify directly

**Service Boundaries:**

- **Authentication service:** `lib/auth.ts`
- **AI service:** `lib/ai.ts`
- **Validation service:** `/lib/validators/`

**Data Boundaries:**

- **Prisma schema:** Single source of truth in `prisma/schema.prisma`
- **Type definitions:** `/types/` folder
- **Database connection:** Singleton pattern in `lib/prisma.ts`

### Requirements to Structure Mapping

**Feature/Epic Mapping:**

| Epic/Feature             | Directory/Files                                                                                   |
| ------------------------ | ------------------------------------------------------------------------------------------------- |
| **User Authentication**  | `app/(auth)/*`, `app/_actions/auth.ts`, `lib/auth.ts`                                             |
| **Inventory Management** | `app/(dashboard)/inventory/*`, `app/_actions/inventory.ts`, `types/inventory.ts`                  |
| **Vendor Management**    | `app/(dashboard)/vendors/*`, `app/_actions/vendors.ts`, `types/vendor.ts`                         |
| **Purchase Orders**      | `app/(dashboard)/purchase-orders/*`, `app/_actions/purchase-orders.ts`, `types/purchase-order.ts` |
| **AI Chat Interface**    | `app/(dashboard)/dashboard/components/AIChat/*`, `app/api/ai/chat/route.ts`, `lib/ai.ts`          |
| **Dashboard & Alerts**   | `app/(dashboard)/dashboard/*`, `app/_actions/dashboard.ts`, `app/api/dashboard/route.ts`          |

**Cross-Cutting Concerns:**

| Concern                 | Location                                                                          |
| ----------------------- | --------------------------------------------------------------------------------- |
| **Authentication**      | `middleware.ts`, `lib/auth.ts`, `app/_actions/auth.ts`                            |
| **Validation**          | `/lib/validators/*.ts`, Server Actions use these schemas                          |
| **Error Handling**      | Server Actions return `{ success, error }`, API Routes return `{ error, status }` |
| **Loading States**      | `loading.tsx` files, `useTransition()` in Client Components                       |
| **Toast Notifications** | shadcn `useToast()` in Client Components after Server Action                      |

### Integration Points

**Internal Communication:**

- **Pages → Server Actions:** Import directly from `app/_actions/`
- **Client Components → Server Actions:** Forms use `action={createInventoryItem}`
- **Server Components → API Routes:** `fetch('/api/dashboard')` for data
- **Components → Shared UI:** Import from `@/components/ui/` or `@/components/common/`

**External Integrations:**

- **Gemini API:** Proxied through `app/api/ai/chat/route.ts`
- **PostgreSQL Database:** Accessed via Prisma Client (`lib/prisma.ts`)
- **Vercel Deployment:** Automatic via Git push

**Data Flow:**

1. **User action** → Client Component or Server Component
2. **Server Action** triggered → validates with Zod → calls Prisma → returns `{ success, data }`
3. **API Route** called (for GET) → Prisma query → returns `{ data, status }`
4. **UI updates** via `revalidatePath()` or `fetch()`

### File Organization Patterns

**Configuration Files:**

- Root level: `next.config.ts`, `tsconfig.json`, `postcss.config.mjs`
- Prisma: `prisma/schema.prisma`, `prisma/prisma.config.ts`
- Environment: `.env.local` (gitignored), `.env.example` (committed)

**Source Organization:**

- **By feature:** Each feature has its own route folder with co-located components
- **Shared utilities:** `/lib/` for auth, database, validation, AI
- **Types:** `/types/` folder with one file per domain entity

**Test Organization:**

- (Future) Co-located: `__tests__/component.test.tsx` next to component
- (Future) E2E: `/e2e/` folder with Playwright/Cypress

**Asset Organization:**

- Static images: `/public/images/`
- Dynamic assets (future): Consider `/uploads/` or cloud storage

### Development Workflow Integration

**Development Server Structure:**

- `pnpm dev` runs Next.js with Turbopack
- Hot reload updates Server Components automatically
- Server Actions revalidate paths to refresh data

**Build Process Structure:**

- `pnpm build` - Next.js production build
- `pnpm postinstall` - runs `prisma generate`
- Vercel build uses `pnpm build` automatically

**Deployment Structure:**

- **Vercel:** Connects to Git repo, auto-deploys on push to `main`
- **Environment vars:** Set in Vercel dashboard
- **Database:** Supabase/Neon free tier
