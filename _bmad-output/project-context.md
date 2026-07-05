---
project_name: 'intelligent-procurement-inventory'
user_name: 'Administrator'
date: '2026-07-05'
sections_completed:
  ['technology_stack', 'language_rules', 'framework_rules', 'component_patterns', 'form_handling', 'server_action_patterns', 'testing_rules', 'critical_rules']
existing_patterns_found: 52
---

# Project Context for AI Agents

_This file contains critical rules and patterns that AI agents must follow when implementing code in this project. Focus on unobvious details that agents might otherwise miss._

---

## Technology Stack & Versions

| Technology | Version | Purpose |
|------------|---------|---------|
| Next.js | 16.2.4 | React framework (App Router) |
| React | 19.2.4 | UI library |
| TypeScript | 5.x | Type safety |
| Prisma | 6.0.0 | ORM (PostgreSQL) |
| Tailwind CSS | 4.x | Styling |
| Nodemailer | 9.0.3 | Email service |
| Vitest | 4.1.6 | Testing |
| ESLint | 9.x | Linting |
| Zod | 4.4.3 | Schema validation |
| Radix UI | 1.4.3 | UI primitives |
| shadcn | 4.7.0 | UI components |
| OpenAI | 4.104.0 | AI integration (Groq) |
| Google GenAI | 2.1.0 | AI integration |
| jose | 6.2.3 | JWT tokens |
| bcrypt | 6.0.0 | Password hashing |
| lucide-react | 1.14.0 | Icons |
| decimal.js | 10.6.0 | Decimal precision |
| clsx + tailwind-merge | — | `cn()` utility |

## Critical Implementation Rules

### Data & Validation

- **PATCH-style updates**: All update Zod schemas use `.partial()` — every field optional, only `id` required in the request body.
- **camelCase↔snake_case mapping**: Server actions receive camelCase from validators, map to snake_case for Prisma DB fields (`reorderPoint`→`reorder_point`, `componentType`→`component_type`).
- **Nullable fields**: Use `?? undefined` (NOT `?? null`) when passing nullable optional fields to Prisma. `null` = "set to null", `undefined` = "leave unchanged".
- **Zod strings**: Always use `.trim().max()` on string fields — no trailing whitespace.
- **`unitPrice` optional**: `unitPrice` on RequestItem is optional user input. `total` is auto-calculated server-side when both `quantity` and `unitPrice` are present.
- **Decimal serialization**: Prisma `Decimal` fields must be serialized to `string` before transmitting to client. Never send raw Decimal objects.
- **Enum matching**: Ensure all enum values match Prisma enum exactly — string comparison, no typos.

### Server Actions

- **FormData server actions**: All server actions accept `FormData`, not JSON. Parse with `.get()` and manual type conversion (`parseInt` for numbers, explicit boolean checks).
- **Return shape**: Server actions return `{ success: boolean, message?: string, errors?: Record<string, string[]> }` — never throw on validation errors.
- **Revalidation**: Call `revalidatePath()` after mutations. The path must match the actual Next.js App Router route exactly.
- **Auth actions**: Login, logout, forgot-password, and reset-password are in `app/_actions/auth.ts`. `logout()` calls `redirect()` internally (caught by Next.js — wrap in try/catch in client handlers).
- **Soft-delete semantic**: `LaboratoryRoom`, `ComputerUnit` (combined), `InventoryItem`, `PurchaseRequest` use soft-delete (`deleted` flag). `ComputerComponent` and `RequestItem` use hard cascade-delete through parent — they omit `deleted`/`created_by`/`updated_by` fields.
- **No `created_by`/`updated_by` on children**: `ComputerComponent` and `RequestItem` omit these fields. Only top-level entities have them.
- **Session in actions**: Use `getSession()` from `lib/auth.ts`. Admin-gated actions must check `session.role === 'ADMIN'`.
- **PR auto-numbering**: `pr_number` format is `PR-YYYYMMDD-RRRRRR` (date + 6 random uppercase alphanumeric).

### Component Patterns

- **Modal pattern**: Add/edit forms use `<div className="fixed inset-0 z-50 bg-black/50">` overlay with `useTransition` for pending state.
- **No optimistic updates**: All mutations use `window.location.reload()` after success.
- **Page architecture**: Server `page.tsx` → `*Client.tsx` (client component) → `components/<Form>.tsx` for modals. Types go in `types.ts`.
- **Search/filter/sort**: Client-side via `useMemo` with helper `<SortHeader>` component. Filter state managed with `useState`.
- **Status badges**: Color-coded badges use `bg-{color}-100 text-{color}-800` pattern.
- **Session auth on pages**: Server pages call `getSession()` and redirect on fail. Admin pages additionally check `session.role`.
- **Stock indicators**: Visual badges (OK=green, LOW=yellow, CRITICAL=red) with progress bars. Reusable `<StockIndicator>` component. **Low stock threshold**: `quantity <= reorder_point` (not `<`).
- **Navigation**: `isActiveLink(pathname, href)` — exact match for `/dashboard`, prefix match (`startsWith(href + "/")`) for sub-routes. Mobile bottom nav renders first 5 items with `shortLabel` on small screens. Sidebar uses `bg-[#121212]`, active state `bg-[#402020]`, collapsed via `useState<boolean>` + `rotate-180` on chevron.
- **Timestamps**: `formatDate()` utility — relative ("Just now", "Xh ago", "Xd ago") for recent, absolute ("Mon DD, YYYY") for older. Used on list views.
- **Pagination**: Server-rendered page via `?page=N` query param. Client-side pagination controls use `window.location.href` navigation (no client router).

### Form Handling

- **FormData.get() safety**: `.get()` can return `null`. Handle with `??` default or `if (!value) return { error }`.
- **Numeric fields**: Parse with `Number()` or `parseInt()` with `NaN` check before passing to validator.
- **Enum/select fields**: Compare to enum values as strings. Use Zod `.refine()` or `.transform()` for enum validation.
- **Trimmed strings**: Apply `.trim()` on all string form inputs to prevent whitespace-only values.
- **Delete confirmation modal**: Use fixed overlay `<div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">` wrapping a card with Cancel+Delete buttons. Use `useTransition` for pending state. `alert()` for error feedback.

### Project Structure (No `src/` directory)

- Code is flat at root: `app/`, `components/`, `lib/`, `prisma/`.
- `components/ui/` houses Radix UI/shadcn primitives (button, input, select, toast-container).
- `components/` has app-specific components (navigation, ChatBubble, SuggestionCards).
- `lib/validators/` has all Zod schemas organized by domain.
- `lib/email.ts` — nodemailer-based email service for password resets.
- `app/_actions/` has all server actions organized by domain.
- `app/proxy.ts` is the RBAC middleware (not traditional `middleware.ts`), uses `config.matcher`. PUBLIC_ROUTES = `["/", "/login", "/forgot-password", "/reset-password"]`. ADMIN_ROUTES = `["/dashboard/admin", "/dashboard/users", "/dashboard/settings"]`.
- `app/(auth)/` route group for login, forgot-password, and reset-password pages.
- `app/dashboard/` has all protected pages with `layout.tsx` auth guard.

### Testing Rules

- **Vitest** with jsdom environment. Config in `vitest.config.ts`, setup in `vitest.setup.ts`.
- **ATDD tests** exist for AI Chat (story 5-3): `AIChat.test.tsx`, `ChatInput.test.tsx`, `ChatMessage.test.tsx`.
- Test files sit alongside or in `__tests__/` directories.
- Use `@testing-library/react` for component tests.
- Run with: `npm test` (watch) or `npm run test:run` (single run).

### Critical Don't-Miss Rules

- **No `src/` directory**: Import paths are flat — `from '@/app/...'`, `from '@/components/...'`, `from '@/lib/...'`.
- **App name is "Procurvin"** — displayed in header `<DashboardHeader>` and metadata `<title>`.
- **Dark sidebar**: `#121212` background, maroon `#402020` active state. Collapsible on desktop.
- **Mobile**: BottomNavigation with first 5 nav items. Chat page redirects mobile to dashboard.
- **CSS variables**: Department palette — grays (#ebebeb, #a9a9a9, #121212) primary, maroon (#402020) accent, gold (#e0c020) highlight, crimson (#800000) destructive. Defined as CSS custom properties in `:root` and exposed via `@theme inline {}` block as Tailwind v4 theme colors (`bg-dept-maroon`, `text-dept-gold`, etc.).
- **Fonts**: Nunito (sans) + JetBrains Mono via `next/font/google`. CSS variables `--font-sans` and `--font-mono` set on `<html>`. Reference via `font-sans`/`font-mono` Tailwind classes or `var(--font-sans)`.
- **Tailwind CSS v4**: Uses `@import "tailwindcss"` (not `@tailwind base/components/utilities`). Also imports `tw-animate-css`. No `tailwind.config.ts` — theme via `@theme inline {}` in `globals.css`.
- **Dark mode**: Via `@media (prefers-color-scheme: dark)` — no class-based toggle. Lighter accent (#5c2e2e) in dark mode.
- **Toast notifications**: Use `useToast()` from `lib/toast-context.tsx`. Variants: success/error/warning/info.
- **AI integration**: Groq via OpenAI SDK (`llama-3.1-8b-instant` model, 5s timeout). Fallback on 503/504/429/network error returns dashboard stats.
- **Component types**: 9 enum values — MOTHERBOARD, PROCESSOR, MEMORY, HDD, MONITOR, KEYBOARD, MOUSE, AVR, OPTICAL_DRIVE.
- **Purchase statuses**: DRAFT→REQUESTED→APPROVED→REJECTED|FULFILLED. Transition rules enforced in server actions.
- **Fulfill increments inventory**: When PR goes APPROVED→FULFILLED, inventory quantities increase in a Prisma transaction.
- **Email service**: `lib/email.ts` uses nodemailer with SMTP env vars (`SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, `SMTP_FROM_NAME`, `SMTP_FROM`, `APP_URL`). Branded HTML emails with maroon/gold Procurvin styling.
- **Password reset flow**: `/forgot-password` sends email with token link. `/reset-password?token=X` validates token (JOSE/jwt), shows error page if missing/invalid. `PasswordResetToken` model with `expires_at`.
- **Seed data**: Admin `admin@example.com / admin123`, Staff `staff@example.com / staff123`. Seed script drops existing data before inserting (`deleteMany` on all tables).
- **button:not(:disabled) cursor pointer**: Set in `globals.css` globally — all non-disabled buttons get pointer cursor.
- **slide-in animation**: `@keyframes slide-in` (opacity 0→1 + translateX 100px→0) with `.animate-slide-in` utility class.
