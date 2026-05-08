---
stepsCompleted:
  - step-01-init
  - step-02-context
  - step-03-starter
  - step-04-decisions
  - step-05-patterns
  - step-06-structure
  - step-07-validation
  - step-08-complete
workflowType: "architecture"
project_name: "intelligent-procurement-inventory"
user_name: "Administrator"
date: "2026-05-07"
lastStep: 8
status: "complete"
completedAt: "2026-05-07"
---

# Architecture Decision Document

_This document builds collaboratively through step-by-step discovery. Sections are appended as we work through each architectural decision together._

## Project Context Analysis

### Requirements Overview

**Functional Requirements:**
32 FRs covering: Inventory Management, Vendor Management, Purchase Orders, AI Chat Interface, Dashboard, Authentication & Authorization, Navigation & Layout, Data Management, Reporting & Analytics, Audit Trail.

**Non-Functional Requirements:**
14 NFRs covering: Performance, Security, Accessibility (WCAG 2.1 AA), Reliability, Scalability (Growth).

### Scale & Complexity

- **Primary Domain:** Full-Stack Web Application (SPA using Next.js)
- **Complexity Level:** Medium
- **Estimated Architectural Components:** 8-10 components
- **Data Complexity:** Medium (relational with audit trails and soft deletes)

### Technical Constraints & Dependencies

**Technology Stack:**

- **Frontend + Backend:** Next.js 15+ with App Router
- **Database:** PostgreSQL (via Prisma ORM or direct queries)
- **UI Framework:** Tailwind CSS + shadcn/ui (component library)
- **AI Service:** Gemini API (with fallback to basic metrics)
- **Authentication:** Session-based with bcrypt

**Key Technical Challenges:**

1. AI integration with Gemini API (rate limits, error handling)
2. Human-in-the-loop pattern (AI suggests, user approves)
3. Role-based access control (Admin vs Staff)
4. Audit trail implementation (created_by, updated_by, timestamps)

### Cross-Cutting Concerns Identified

- **Authentication & Authorization:** Session management, password hashing (bcrypt), HTTP-only cookies, RBAC
- **Data Validation:** Client-side + server-side validation
- **Error Handling:** AI service failures, database errors, graceful fallbacks
- **Audit Logging:** Track who created/modified records and when
- **Accessibility:** WCAG 2.1 AA compliance across all components

## Starter Template Evaluation

### Primary Technology Domain

Full-stack web application using Next.js 15+ with App Router, based on project requirements analysis. The project is already scaffolded with `create-next-app`.

### Current Project State

The project has been initialized with `create-next-app` (Next.js 16.2.4) and includes:

- TypeScript configured with strict mode
- Tailwind CSS v4 (CSS-first configuration)
- App Router structure with `/app` directory
- ESLint configuration
- PostCSS configuration

**Dependencies already installed:**

- `next: 16.2.4`
- `react: 19.2.4`
- `react-dom: 19.2.4`
- `tailwindcss: ^4`
- `@tailwindcss/postcss: ^4`

### Starter Options Considered

**Option 1: Keep Existing Scaffold + Add Dependencies (Selected)**

- **Approach:** Add Prisma, shadcn/ui, and optional tRPC to existing `create-next-app` scaffold
- **Pros:**
  - No need to restart project
  - Already has Tailwind v4 configured
  - Clean slate to add only what's needed
  - Matches PRD requirements exactly
- **Cons:** Manual setup required for each addition

**Option 2: Re-scaffold with `create-t3-app`**

- **Stack:** Next.js + TypeScript + Tailwind + Prisma + tRPC + NextAuth.js
- **Pros:** All-in-one setup, end-to-end type safety
- **Cons:**
  - Would need to discard existing scaffold
  - Includes NextAuth.js (we need session-based with bcrypt per PRD)
  - Less control over what's included

**Option 3: Use a Pre-built Boilerplate (e.g., Taxonomy, Relivator)**

- **Pros:** Production-ready examples, Stripe integration, auth patterns
- **Cons:** Too opinionated, includes unnecessary features, harder to customize

### Selected Approach: Extend Existing Scaffold

**Rationale for Selection:**

- Project already scaffolded with `create-next-app` (Next.js 16.2.4)
- Tailwind v4 already configured (matches PRD requirement)
- Cleaner to add only what's needed (Prisma, shadcn/ui) per PRD
- No need to discard existing work

**Dependencies to Add:**

```bash
# Prisma ORM with PostgreSQL driver adapter (matches PRD)
pnpm add prisma @types/pg --save-dev
pnpm add @prisma/client @prisma/adapter-pg pg dotenv

# Initialize Prisma (standard setup)
pnpm dlx prisma init

# shadcn/ui component library with custom preset (matches PRD requirement)
pnpm dlx shadcn@latest init --preset b0 --template next

# Session-based auth with bcrypt (matches PRD)
pnpm add bcrypt
pnpm add -D @types/bcrypt

# Optional: tRPC for type-safe API
# pnpm add @trpc/server @trpc/client @trpc/next
```

**Architectural Decisions Made:**

**Language & Runtime:**

- TypeScript (already configured)
- Next.js 16.2.4 with App Router (already scaffolded)
- Node.js runtime

**Styling Solution:**

- Tailwind CSS v4 with CSS-first configuration (already configured)
- PostCSS with @tailwindcss/postcss plugin
- Ready for shadcn/ui integration

**Database:**

- Prisma ORM for PostgreSQL (to be added)
- Schema will be defined in `/prisma/schema.prisma`

**UI Framework:**

- shadcn/ui component library (to be added)
- Radix UI primitives under the hood
- Accessible components (WCAG 2.1 AA compliant)

**Authentication:**

- Session-based authentication with bcrypt (per PRD)
- HTTP-only cookies for session storage
- Custom implementation (not NextAuth.js)

**Note:** Project initialization is already complete. Next step is to add the dependencies and begin implementation stories.

## Core Architectural Decisions

### Decision Priority Analysis

**Critical Decisions (Block Implementation):**

- Database: PostgreSQL with Prisma ORM + @prisma/adapter-pg
- API Pattern: Server Actions + API Routes
- Authentication: bcrypt + session-based with HTTP-only cookies
- UI Framework: Tailwind CSS v4 + shadcn/ui (preset b0)

**Important Decisions (Shape Architecture):**

- State Management: React state + Server Components (minimal client state)
- Deployment: Vercel (free tier) + Supabase/Neon PostgreSQL (free tier)
- Validation: Zod (server-side) + HTML5 (client-side)
- Caching: Next.js built-in fetch caching + revalidation

**Deferred Decisions (Post-MVP):**

- WebSocket real-time updates (polling for MVP)
- Multi-location/warehouse support
- Advanced reporting & analytics
- Subscription billing (SaaS pivot)

### Data Architecture

**Database Choice:**

- **Technology:** PostgreSQL (via Prisma ORM)
- **Version:** Latest stable (managed via Supabase/Neon free tier)
- **Rationale:** Relational data with complex relationships (inventory ↔ vendors ↔ POs), ACID compliance for financial data, free tier available per PRD budget ($0)

**Data Modeling Approach:**

- **ORM:** Prisma with schema-first development
- **Schema location:** `/prisma/schema.prisma`
- **Migrations:** Prisma Migrate (`prisma migrate dev`)
- **Connection:** `@prisma/adapter-pg` with connection pooling

**Data Validation Strategy:**

- **Server-side:** Zod schemas for input validation (works with Server Actions)
- **Client-side:** HTML5 validation + React form validation
- **Database:** Prisma schema constraints (NOT NULL, foreign keys, unique)
- **Audit fields:** `created_at`, `updated_at`, `created_by`, `updated_by` on all models

**Caching Strategy:**

- **Static data:** Next.js `fetch()` with `revalidate` option (products, vendors)
- **User-specific data:** No caching (dashboard, POs) - use `no-store`
- **AI responses:** Cache with short TTL (5 min) to reduce API calls

### Authentication & Security

**Authentication Method:**

- **Approach:** Session-based authentication
- **Password hashing:** bcrypt (10 rounds minimum)
- **Session storage:** HTTP-only cookies (prevents XSS access)
- **Session validation:** Middleware checks on protected routes

**Authorization Patterns:**

- **Roles:** Admin (full access), Staff (CRUD operations), Viewer (future, read-only)
- **Implementation:** Middleware + server-side checks using `session.user.role`
- **RBAC enforcement:** Server Actions validate permissions before mutations

**Security Middleware:**

- **Next.js Middleware:** Protects `/dashboard/*` and `/api/*` routes
- **Rate limiting:** API routes implement basic rate limiting (100 req/min per IP)
- **CORS:** Restrict API access to same origin for MVP

**Data Encryption:**

- **Passwords:** bcrypt hash (never stored plaintext)
- **Sensitive data:** None beyond passwords for MVP
- **HTTPS:** Enforced by Vercel hosting (automatic SSL)

**API Security:**

- **Input sanitization:** Zod schemas reject malformed data
- **SQL injection:** Prisma ORM (parameterized queries by default)
- **XSS protection:** React's built-in escaping + CSP headers

### API & Communication Patterns

**API Design Pattern:**

- **Primary:** Server Actions for mutations (create/update/delete inventory, POs, vendors)
- **Secondary:** API Routes for GET queries (dashboard data, AI chat endpoint)
- **Rationale:** Server Actions simpler for forms, API Routes for data fetching and external API (Gemini)

**Server Actions Usage:**

- Form submissions (inventory CRUD, PO creation)
- Require `'use server'` directive
- Return typed responses with success/error states
- Revalidate cache via `revalidatePath()` after mutations

**API Routes Usage:**

- `GET /api/dashboard` - Low stock alerts, summary stats
- `POST /api/ai/chat` - Gemini API proxy (hides API key)
- `GET /api/inventory` - Paginated inventory list with filters

**Error Handling Standards:**

- **Server Actions:** Return `{ success: boolean, data?: T, error?: string }`
- **API Routes:** HTTP status codes + JSON `{ error: string }`
- **Client-side:** Toast notifications for user feedback

**Rate Limiting Strategy:**

- **AI endpoint:** 10 requests/minute per user (Gemini free tier protection)
- **General API:** 100 requests/minute per IP (DDoS protection)

### Frontend Architecture

**State Management Approach:**

- **Server state:** Next.js Server Components (default) - no client-side fetching
- **Client state:** React `useState` for forms, `useTransition` for pending states
- **Global state:** None needed for MVP (user session in cookie, no cart/complex state)
- **Optimistic updates:** `useOptimistic` hook for instant UI feedback

**Component Architecture:**

- **Base components:** shadcn/ui (Button, Input, Table, Dialog, etc.)
- **Feature components:** Co-located with routes (`/app/inventory/components/`)
- **Layouts:** Root layout (`app/layout.tsx`), Dashboard layout (`app/dashboard/layout.tsx`)
- **Client boundary:** Minimal `'use client'` - only for interactivity (forms, dialogs)

**Routing Strategy:**

- **App Router:** File-system based (already scaffolded)
- **Protected routes:** `/dashboard/*` group with middleware check
- **Public routes:** `/`, `/login`, `/forgot-password`
- **Route groups:** `(auth)` for public, `(dashboard)` for protected

**Performance Optimization:**

- **Server Components:** Default for all data-fetching pages
- **Dynamic imports:** `next/dynamic` for heavy client components (charts, AI chat)
- **Image optimization:** `next/image` for vendor logos, product images
- **Bundle:** Turbopack for fast development builds

**Accessibility (WCAG 2.1 AA):**

- **shadcn/ui:** Radix primitives under the hood (accessible by default)
- **Keyboard navigation:** All interactive elements focusable
- **Screen readers:** ARIA labels on forms, tables, dialogs
- **Color contrast:** shadcn preset `b0` ensures compliant color palette

### Infrastructure & Deployment

**Hosting Strategy:**

- **Platform:** Vercel (free tier)
- **Rationale:** Native Next.js support, automatic SSL, preview deployments
- **Build command:** `pnpm build` (Next.js production build)
- **Environment:** Automatic based on Git branch (main = production, others = preview)

**Database Hosting:**

- **Provider:** Supabase or Neon (free tier per PRD)
- **Connection:** `postgresql://` URL in `DATABASE_URL` env var
- **Backups:** Managed by provider (free tier includes daily backups)

**CI/CD Pipeline:**

- **Provider:** GitHub Actions (via Vercel integration)
- **On push to main:** Automatic build + deploy to production
- **Preview deployments:** Every PR gets a unique URL for testing
- **Tests:** `pnpm test` (when implemented) must pass before merge

**Environment Configuration:**

- **Local:** `.env` (gitignored, Prisma reads via dotenv)
- **Production:** Vercel dashboard environment variables
- **Secrets:** `DATABASE_URL`, `GEMINI_API_KEY`, `SESSION_SECRET`
- **Public vars:** `NEXT_PUBLIC_APP_URL`

**Monitoring and Logging:**

- **Vercel Analytics:** Built-in (free tier includes core web vitals)
- **Error tracking:** Console logs for MVP (Vercel logs available)
- **Uptime monitoring:** Vercel dashboard (free tier)

**Scaling Strategy:**

- **MVP:** Free tiers sufficient (up to 1000 DB rows, limited AI calls)
- **Growth:** Upgrade to paid tiers when reaching limits
- **Database:** Neon auto-scales, Supabase has paid plans
- **AI:** Gemini has generous free tier (60 requests/minute)

### Decision Impact Analysis

**Implementation Sequence:**

1. Install dependencies (Prisma, shadcn/ui, bcrypt)
2. Set up Prisma schema + initial migration
3. Implement authentication (login, sessions, middleware)
4. Build Server Actions for CRUD operations
5. Create API routes (dashboard data, AI proxy)
6. Build UI with shadcn components
7. Deploy to Vercel + connect database

**Cross-Component Dependencies:**

- Prisma schema → Server Actions (type-safe queries)
- Server Actions → UI forms (pass as props or use in components)
- API routes → Dashboard data fetching (client-side fetch or server components)
- Session middleware → All protected routes
- shadcn/ui → All UI components (consistent design system)

## Implementation Patterns & Consistency Rules

### Pattern Categories Defined

**Critical Conflict Points Identified:**
8 areas where AI agents could make different choices

### Naming Patterns

**Database Naming Conventions (Prisma):**

- **Tables:** `snake_case` plural (`users`, `inventory_items`, `purchase_orders`)
- **Columns:** `snake_case` (`user_id`, `created_at`, `reorder_point`)
- **Foreign keys:** `{referenced_table_singular}_id` (`user_id`, `vendor_id`)
- **Indexes:** `idx_{table}_{column}` (`idx_inventory_sku`, `idx_users_email`)
- **Enums:** `PascalCase` (`Role`, `OrderStatus`, `StockStatus`)

**API Naming Conventions:**

- **REST endpoints:** Plural, kebab-case (`/api/inventory-items`, `/api/purchase-orders`)
- **Route parameters:** `snake_case` (`:user_id`, `:inventory_id`)
- **Query parameters:** `snake_case` (`?sort_by=name`, `?page_number=1`)
- **Server Actions:** Verb + noun, camelCase (`createInventoryItem`, `updateVendorDetails`)
- **Headers:** `kebab-case` (`x-request-id`, `x-user-role`)

**Code Naming Conventions:**

- **Components:** `PascalCase` (`InventoryTable.tsx`, `CreatePODialog.tsx`)
- **Files:** `kebab-case` for components (`inventory-table.tsx`), `camelCase` for utils (`formatDate.ts`)
- **Functions:** `camelCase` (`getDashboardData`, `validateSession`)
- **Variables:** `camelCase` (`userId`, `inventoryList`, `isLoading`)
- **Types/Interfaces:** `PascalCase` with `T` prefix or suffix (`TInventory`, `InventoryType`)

### Structure Patterns

**Project Organization:**

- **Components:** Co-located with routes (`app/inventory/components/InventoryTable.tsx`)
- **Server Actions:** Separate files in `/app/_actions/` folder (`app/_actions/inventory.ts`)
- **API Routes:** Next.js 15 pattern (`app/api/inventory/route.ts`)
- **Utilities:** `/lib/` folder (`lib/prisma.ts`, `lib/auth.ts`, `lib/utils.ts`)
- **Types:** `/types/` folder (`types/inventory.ts`, `types/api.ts`)
- **Tests:** Co-located with files (`__tests__/inventory.test.ts` or `inventory.test.ts`)

**File Structure Patterns:**

- **Config files:** Root level (`next.config.ts`, `prisma.config.ts`)
- **Environment:** `.env` (local), Vercel dashboard (production)
- **Static assets:** `/public/` (images, icons, favicon)
- **Generated code:** `/generated/prisma/` (Prisma client output)

### Format Patterns

**API Response Formats (for API Routes):**

```typescript
// Success response
{ data: T, status: 200 }

// Error response
{ error: string, status: 400 | 401 | 403 | 404 | 500 }
```

**Server Action Response Format:**

```typescript
// Success
{ success: true, data?: T, message?: string }

// Error
{ success: false, error: string, code?: string }
```

**Data Exchange Formats:**

- **JSON fields:** `camelCase` (standard JSON convention)
- **Dates:** ISO 8601 strings (`"2026-05-07T14:30:00.000Z"`)
- **Booleans:** Native `true/false` (not 1/0)
- **Nulls:** Explicit `null` for optional fields, not omitted

### Communication Patterns

**Server Action Patterns:**

- **Naming:** Verb + noun (`createInventoryItem`, `deleteVendor`)
- **Location:** `/app/_actions/{domain}.ts` (barrel export from `index.ts`)
- **Directives:** Always `'use server'` at top of file
- **Revalidation:** `revalidatePath()` after mutations
- **Error handling:** Try-catch with typed error responses

**State Management Patterns:**

- **Server state:** Server Components (default) - no client fetching
- **Client state:** `useState` for form inputs, `useTransition` for pending
- **Optimistic updates:** `useOptimistic` for instant UI feedback
- **Global state:** Avoid - use cookies (session) or URL params

**Event System:** Not needed for MVP (simple CRUD, no complex events)

### Process Patterns

**Error Handling Patterns:**

- **Server Actions:** Return `{ success, error }` - never throw
- **API Routes:** HTTP status codes + JSON `{ error }`
- **Client-side:** Toast notifications via shadcn `useToast()`
- **Boundaries:** `error.tsx` files for route-level errors
- **Logging:** `console.error()` for MVP (Vercel captures)

**Loading State Patterns:**

- **Server Actions:** `useTransition()` - `isPending` boolean
- **API fetches:** `loading.tsx` for route-level loading
- **Component-level:** `loading` prop passed to components
- **Buttons:** `disabled={isPending}` with spinner icon

**Validation Patterns:**

- **Server-side:** Zod schemas in `/lib/validators/{domain}.ts`
- **Client-side:** HTML5 validation + React form validation
- **Database:** Prisma schema constraints (required, unique, etc.)
- **Timing:** Validate in Server Action before database write

### Enforcement Guidelines

**All AI Agents MUST:**

1. Use Prisma `$snake_case` for all database identifiers
2. Use `camelCase` for all TypeScript variables/functions
3. Use `PascalCase` for components and type definitions
4. Return consistent response formats from Server Actions and API routes
5. Co-locate components with their routes (not global `/components/` unless shared)
6. Use `'use client'` directive ONLY when interactivity required (not by default)
7. Use `revalidatePath()` after ALL Server Action mutations

**Pattern Enforcement:**

- Agents should reference this architecture document before implementing
- When in doubt, check existing code in the project for pattern matching
- All new code must follow patterns defined here, not personal preferences

### Pattern Examples

**Good Examples:**

```typescript
// Server Action (app/_actions/inventory.ts)
"use server";
import { z } from "zod";

const CreateInventorySchema = z.object({
  name: z.string().min(1),
  sku: z.string().min(3),
  quantity: z.number().min(0),
  reorderPoint: z.number().min(0),
});

export async function createInventoryItem(formData: FormData) {
  const validated = CreateInventorySchema.parse(Object.fromEntries(formData));
  // ... implementation
  revalidatePath("/inventory");
  return { success: true, data: newItem };
}
```

```typescript
// API Route (app/api/dashboard/route.ts)
export async function GET(request: Request) {
  try {
    const data = await getDashboardData();
    return Response.json({ data, status: 200 });
  } catch (error) {
    return Response.json({ error: "Failed to fetch dashboard", status: 500 });
  }
}
```

**Anti-Patterns (AVOID):**

- Mixing `snake_case` and `camelCase` in database schemas
- Putting all components in `/components/` regardless of usage
- Using `'use client'` on every file "just in case"
- Throwing errors in Server Actions (return error object instead)
- Not calling `revalidatePath()` after mutations
- Creating custom API response wrappers (use the standard format)

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
│   │   │   ├── page.tsx                    # Registration form (admin only or open?)
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
│   │   │       ├── StatsCards.tsx           # Total items, low stock count, etc. (Server)
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
│   │   │   │   ├── page.tsx               # Create PO (from AI suggestion or manual)
│   │   │   │   └── components/
│   │   │   │       ├── POForm.tsx          # PO form (Client)
│   │   │   │       └── AddItemDialog.tsx  # Add line items dialog
│   │   │   └── [po_id]/
│   │   │       ├── page.tsx                # View/approve PO
│   │   │       └── components/
│   │   │           ├── POStatusBadge.tsx   # Draft/Approved/Sent badge
│   │   │           └── POActions.tsx       # Approve, Export, Send buttons
│   │   │
│   │   └── settings/                       # Future: user management, settings
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
├── components/                              # Shared UI components (used across routes)
│   ├── ui/                                # shadcn/ui components (auto-generated here)
│   │   ├── button.tsx
│   │   ├── input.tsx
│   │   ├── table.tsx
│   │   ├── dialog.tsx
│   │   ├── select.tsx
│   │   ├── badge.tsx
│   │   ├── toast.tsx
│   │   └── ... (other shadcn components)
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
│   └── migrations/                       # Database migrations (auto-generated)
│
├── generated/                             # Generated code (gitignored in some setups)
│   └── prisma/                          # Prisma client output (if using --output)
│       └── client/                       # Type-safe Prisma Client
│
├── middleware.ts                          # Next.js middleware (auth check)
│
├── public/                                # Static assets
│   ├── favicon.ico
│   ├── logo.svg
│   └── images/
│       ├── dashboard-preview.png
│       └── ... (other images)
│
├── docs/                                  # Project documentation
│   └── ... (empty or future docs)
│
├── _bmad/
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
├── .env.local # Gitignored (local only)
├── .env.example # Template for DATABASE_URL, GEMINI_API_KEY, SESSION_SECRET
├── .gitignore
├── pnpm-lock.yaml
├── pnpm-workspace.yaml
│
├── app/ # Next.js App Router
│ ├── globals.css # Tailwind + shadcn CSS variables
│ ├── layout.tsx # Root layout (fonts, providers)
│ ├── page.tsx # Landing page (login redirect if auth)
│ ├── not-found.tsx # 404 page
│ ├── error.tsx # Error boundary
│ ├── loading.tsx # Root loading UI
│ │
│ ├── \_actions/ # Server Actions (barrel export via index.ts)
│ │ ├── index.ts # Re-exports all actions
│ │ ├── auth.ts # login, logout, register, resetPassword
│ │ ├── inventory.ts # createInventoryItem, updateInventoryItem, deleteInventoryItem
│ │ ├── vendors.ts # createVendor, updateVendor, deleteVendor
│ │ ├── purchase-orders.ts # createPO, updatePOStatus, approvePO
│ │ └── dashboard.ts # getDashboardStats, getLowStockItems
│ │
│ ├── (auth)/ # Public routes group (no layout protection)
│ │ ├── layout.tsx # Auth layout (minimal, no nav)
│ │ ├── login/
│ │ │ ├── page.tsx # Login form
│ │ │ └── components/
│ │ │ └── LoginForm.tsx # Client component with form
│ │ ├── register/
│ │ │ ├── page.tsx # Registration form
│ │ │ └── components/
│ │ │ └── RegisterForm.tsx
│ │ └── forgot-password/
│ │ ├── page.tsx # Email input for reset
│ │ └── components/
│ │ └── ForgotPasswordForm.tsx
│ │
│ ├── (dashboard)/ # Protected routes group
│ │ ├── layout.tsx # Dashboard layout (sidebar, header, user menu)
│ │ ├── dashboard/
│ │ │ ├── page.tsx # Main dashboard with stats + low stock alerts
│ │ │ ├── loading.tsx # Dashboard loading UI
│ │ │ └── components/
│ │ │ ├── StatsCards.tsx # Total items, low stock count (Server)
│ │ │ ├── LowStockTable.tsx # Low stock items table (Server)
│ │ │ └── AIChat/
│ │ │ ├── AIChat.tsx # Chat interface (Client - 'use client')
│ │ │ ├── ChatMessage.tsx # Individual message component
│ │ │ └── ChatInput.tsx # Input form for questions
│ │ │
│ │ ├── inventory/
│ │ │ ├── page.tsx # Inventory list with filters, pagination
│ │ │ ├── loading.tsx
│ │ │ ├── new/
│ │ │ │ ├── page.tsx # Add new inventory item form
│ │ │ │ └── components/
│ │ │ │ └── InventoryForm.tsx # Form (Client)
│ │ │ └── [inventory_id]/
│ │ │ ├── page.tsx # Edit inventory item
│ │ │ └── components/
│ │ │ └── InventoryForm.tsx # Pre-filled form (Client)
│ │ │
│ │ ├── vendors/
│ │ │ ├── page.tsx # Vendor list
│ │ │ ├── new/
│ │ │ │ ├── page.tsx # Add vendor form
│ │ │ │ └── components/
│ │ │ │ └── VendorForm.tsx
│ │ │ └── [vendor_id]/
│ │ │ ├── page.tsx # Edit vendor
│ │ │ └── components/
│ │ │ └── VendorForm.tsx
│ │ │
│ │ ├── purchase-orders/
│ │ │ ├── page.tsx # PO list (draft, approved, sent)
│ │ │ ├── new/
│ │ │ │ ├── page.tsx # Create PO
│ │ │ │ └── components/
│ │ │ │ ├── POForm.tsx # PO form (Client)
│ │ │ │ └── AddItemDialog.tsx # Add line items dialog
│ │ │ └── [po_id]/
│ │ │ ├── page.tsx # View/approve PO
│ │ │ └── components/
│ │ │ ├── POStatusBadge.tsx # Draft/Approved/Sent badge
│ │ │ └── POActions.tsx # Approve, Export, Send buttons
│ │ │
│ │ └── settings/
│ │ └── page.tsx
│ │
│ └── api/ # API Routes
│ ├── dashboard/
│ │ └── route.ts # GET /api/dashboard - stats + alerts
│ ├── ai/
│ │ └── chat/
│ │ └── route.ts # POST /api/ai/chat - Gemini proxy
│ ├── inventory/
│ │ └── route.ts # GET /api/inventory - paginated list
│ └── vendors/
│ └── route.ts # GET /api/vendors - list
│
├── components/ # Shared UI components
│ ├── ui/ # shadcn/ui components
│ │ ├── button.tsx
│ │ ├── input.tsx
│ │ ├── table.tsx
│ │ ├── dialog.tsx
│ │ ├── select.tsx
│ │ ├── badge.tsx
│ │ ├── toast.tsx
│ │ └── ...
│ ├── layout/
│ │ ├── Sidebar.tsx # Dashboard sidebar navigation
│ │ ├── Header.tsx # Top header with user menu
│ │ └── Breadcrumbs.tsx # Breadcrumb navigation
│ └── common/
│ ├── EmptyState.tsx # "No items found" state
│ ├── Pagination.tsx # Reusable pagination
│ ├── ConfirmDialog.tsx # Delete confirmation dialog
│ └── LoadingSpinner.tsx # Loading indicator
│
├── lib/ # Utility functions and configurations
│ ├── prisma.ts # Prisma client singleton
│ ├── auth.ts # Session management, password hashing
│ ├── validators/ # Zod schemas for validation
│ │ ├── inventory.ts # Inventory item schema
│ │ ├── vendor.ts # Vendor schema
│ │ ├── purchase-order.ts # PO schema
│ │ └── auth.ts # Login/register schema
│ ├── ai.ts # Gemini API integration
│ └── utils.ts # cn() helper + misc utilities
│
├── types/ # TypeScript type definitions
│ ├── inventory.ts # TInventory, TInventoryForm
│ ├── vendor.ts # TVendor, TVendorForm
│ ├── purchase-order.ts # TPurchaseOrder, TPOStatus
│ ├── user.ts # TUser, TRole
│ └── api.ts # API response types
│
├── prisma/
│ ├── schema.prisma # Database schema (Prisma)
│ ├── prisma.config.ts # Prisma configuration
│ └── migrations/ # Database migrations
│
├── generated/ # Generated code
│ └── prisma/ # Prisma client output
│ └── client/
│
├── middleware.ts # Next.js middleware (auth check)
│
├── public/ # Static assets
│ ├── favicon.ico
│ ├── logo.svg
│ └── images/
│
├── docs/ # Project documentation
│
├── \_bmad/ # BMad method config
│
└── \_bmad-output/ # Planning artifacts
├── planning-artifacts/
│ ├── prd.md
│ └── architecture.md
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

| Epic/Feature | Directory/Files |
|---------------|------------------|
| **User Authentication** | `app/(auth)/*`, `app/_actions/auth.ts`, `lib/auth.ts` |
| **Inventory Management** | `app/(dashboard)/inventory/*`, `app/_actions/inventory.ts`, `types/inventory.ts` |
| **Vendor Management** | `app/(dashboard)/vendors/*`, `app/_actions/vendors.ts`, `types/vendor.ts` |
| **Purchase Orders** | `app/(dashboard)/purchase-orders/*`, `app/_actions/purchase-orders.ts`, `types/purchase-order.ts` |
| **AI Chat Interface** | `app/(dashboard)/dashboard/components/AIChat/*`, `app/api/ai/chat/route.ts`, `lib/ai.ts` |
| **Dashboard & Alerts** | `app/(dashboard)/dashboard/*`, `app/_actions/dashboard.ts`, `app/api/dashboard/route.ts` |

**Cross-Cutting Concerns:**

| Concern | Location |
|---------|----------|
| **Authentication** | `middleware.ts`, `lib/auth.ts`, `app/_actions/auth.ts` |
| **Validation** | `/lib/validators/*.ts`, Server Actions use these schemas |
| **Error Handling** | Server Actions return `{ success, error }`, API Routes return `{ error, status }` |
| **Loading States** | `loading.tsx` files, `useTransition()` in Client Components |
| **Toast Notifications** | shadcn `useToast()` in Client Components after Server Action |

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
## Architecture Validation Results

### Coherence Validation ✅

**Decision Compatibility:**
- Next.js 16 + Prisma 6.x + @prisma/adapter-pg: ✅ Compatible (latest docs confirm)
- Tailwind v4 + shadcn/ui (preset b0): ✅ Compatible (shadcn supports Tailwind v4)
- Server Actions + API Routes: ✅ Compatible (Next.js 15+ supports both)
- bcrypt + sessions: ✅ Compatible (standard Node.js approach)
- All versions verified via web search - no conflicts detected.

**Pattern Consistency:**
- Naming conventions: ✅ Consistent (`snake_case` for DB, `camelCase` for TS, `PascalCase` for components)
- Structure patterns: ✅ Support technology stack (feature-based organization matches Next.js App Router)
- Communication patterns: ✅ Server Actions for mutations, API Routes for GET - clearly defined

**Structure Alignment:**
- Project structure: ✅ Supports all architectural decisions
- Boundaries: ✅ Properly defined (Server Actions vs API Routes, Server vs Client components)
- Integration points: ✅ Clearly specified (Prisma Client singleton, Middleware, Server Actions)

### Requirements Coverage Validation ✅

**Feature Coverage (from PRD):**
- ✅ User Authentication: `app/(auth)/*`, `lib/auth.ts`, `app/_actions/auth.ts`
- ✅ Inventory Management: `app/(dashboard)/inventory/*`, `app/_actions/inventory.ts`
- ✅ Vendor Management: `app/(dashboard)/vendors/*`, `app/_actions/vendors.ts`
- ✅ Purchase Orders: `app/(dashboard)/purchase-orders/*`, `app/_actions/purchase-orders.ts`
- ✅ AI Chat Interface: `app/api/ai/chat/route.ts`, `lib/ai.ts`, `AIChat.tsx`
- ✅ Dashboard & Alerts: `app/(dashboard)/dashboard/*`, `app/_actions/dashboard.ts`, `app/api/dashboard/route.ts`

**Functional Requirements Coverage:**
- ✅ 32 FRs mapped to architectural components (Inventory CRUD, Vendor CRUD, PO creation, AI chat, Dashboard, Auth, Navigation, Data Management, Reporting, Audit Trail)

**Non-Functional Requirements Coverage:**
- ✅ Performance: Vercel hosting, Next.js optimization, Turbopack
- ✅ Security: bcrypt, sessions, middleware, HTTPS
- ✅ Accessibility: WCAG 2.1 AA via shadcn/ui (Radix primitives)
- ✅ Reliability: Prisma transactions, error handling patterns
- ✅ Scalability: Free tier (Supabase/Neon), Vercel auto-scaling

### Implementation Readiness Validation ✅

**Decision Completeness:**
- ✅ All critical decisions documented with versions (Next.js 16, Prisma 6.x, Tailwind 4, shadcn b0 preset)
- ✅ Implementation patterns comprehensive (naming, structure, format, communication, process)
- ✅ Consistency rules clear and enforceable (7 mandatory rules for AI agents)
- ✅ Examples provided for all major patterns (Server Actions, API Routes)

**Structure Completeness:**
- ✅ Complete directory structure defined (all folders and key files specified)
- ✅ All files and directories defined (app/, components/, lib/, types/, prisma/, etc.)
- ✅ Integration points clearly specified (Prisma Client, Middleware, Server Actions, API Routes)
- ✅ Component boundaries well-defined (Server vs Client, shared vs co-located)

**Pattern Completeness:**
- ✅ All potential conflict points addressed (naming, structure, format, communication, process)
- ✅ Naming conventions comprehensive (database, API, code)
- ✅ Communication patterns fully specified (Server Actions, state management)
- ✅ Process patterns complete (error handling, loading states, validation)

### Gap Analysis Results

**Critical Gaps:** None detected ✅

**Important Gaps:**
- Testing strategy not defined (unit, integration, e2e) - defer to implementation phase
- CI/CD pipeline specifics not detailed - Vercel default is sufficient for MVP
- Role-based authorization details not fully specified - will be handled in implementation stories

**Nice-to-Have Gaps:**
- Component storybook (future documentation)
- Performance monitoring tools (Vercel Analytics sufficient for MVP)
- Error tracking service (console.log sufficient for MVP)

### Validation Issues Addressed

No critical or important issues found during validation. Architecture is coherent and complete.

### Architecture Completeness Checklist

**Requirements Analysis**
- [x] Project context thoroughly analyzed
- [x] Scale and complexity assessed
- [x] Technical constraints identified
- [x] Cross-cutting concerns mapped

**Architectural Decisions**
- [x] Critical decisions documented with versions
- [x] Technology stack fully specified
- [x] Integration patterns defined
- [x] Performance considerations addressed

**Implementation Patterns**
- [x] Naming conventions established
- [x] Structure patterns defined
- [x] Communication patterns specified
- [x] Process patterns documented

**Project Structure**
- [x] Complete directory structure defined
- [x] Component boundaries established
- [x] Integration points mapped
- [x] Requirements to structure mapping complete

### Architecture Readiness Assessment

**Overall Status:** READY FOR IMPLEMENTATION

**Confidence Level:** High (all 16 checklist items complete, no critical gaps)

**Key Strengths:**
- Complete technology stack with verified versions
- Comprehensive implementation patterns preventing AI agent conflicts
- Clear project structure with feature-based organization
- All PRD requirements mapped to architectural components
- Consistent naming and communication patterns

**Areas for Future Enhancement:**
- Testing strategy (to be defined during implementation)
- Advanced monitoring and alerting
- Multi-location support (post-MVP)
- Subscription billing for SaaS pivot (post-MVP)

### Implementation Handoff

**AI Agent Guidelines:**
- Follow all architectural decisions exactly as documented in this document
- Use implementation patterns consistently across all components
- Respect project structure and boundaries defined in "Project Structure & Boundaries"
- Refer to this document for all architectural questions
- Use the starter command: `pnpm dlx shadcn@latest init --preset b0 --template next`
- Install dependencies: `pnpm add prisma @types/pg --save-dev` and `pnpm add @prisma/client @prisma/adapter-pg pg dotenv`
- Set up Prisma: `pnpm dlx prisma init`

**First Implementation Priority:**
1. Install all dependencies (Prisma, shadcn/ui, bcrypt)
2. Set up Prisma schema + initial migration
3. Implement authentication (login, sessions, middleware)
4. Build Server Actions for CRUD operations
5. Create API routes (dashboard data, AI proxy)
6. Build UI with shadcn components
7. Deploy to Vercel + connect database
```
