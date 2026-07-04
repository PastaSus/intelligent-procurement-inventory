---
project_name: 'intelligent-procurement-inventory'
user_name: 'Administrator'
date: '2026-07-04'
sections_completed:
  ['technology_stack', 'language_rules', 'framework_rules', 'component_patterns', 'form_handling', 'server_action_patterns', 'testing_rules', 'critical_rules']
existing_patterns_found: 32
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
- **Stock indicators**: Visual badges (OK=green, LOW=yellow, CRITICAL=red) with progress bars. Reusable `<StockIndicator>` component.

### Form Handling

- **FormData.get() safety**: `.get()` can return `null`. Handle with `??` default or `if (!value) return { error }`.
- **Numeric fields**: Parse with `Number()` or `parseInt()` with `NaN` check before passing to validator.
- **Enum/select fields**: Compare to enum values as strings. Use Zod `.refine()` or `.transform()` for enum validation.
- **Trimmed strings**: Apply `.trim()` on all string form inputs to prevent whitespace-only values.

### Project Structure (No `src/` directory)

- Code is flat at root: `app/`, `components/`, `lib/`, `prisma/`.
- `components/ui/` houses Radix UI/shadcn primitives (button, input, select, toast-container).
- `components/` has app-specific components (navigation, ChatBubble, SuggestionCards).
- `lib/validators/` has all Zod schemas organized by domain.
- `app/_actions/` has all server actions organized by domain.
- `app/proxy.ts` is the RBAC middleware (not traditional `middleware.ts`), uses `config.matcher`.
- `app/(auth)/` route group for login and forgot-password pages.
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
- **CSS variables**: Department palette — grays (#ebebeb, #a9a9a9, #121212) primary, maroon (#402020) accent, gold (#e0c020) highlight, crimson (#800000) destructive.
- **Toast notifications**: Use `useToast()` from `lib/toast-context.tsx`. Variants: success/error/warning/info.
- **AI integration**: Groq via OpenAI SDK (`llama-3.1-8b-instant` model, 5s timeout). Fallback on 503/504/429/network error returns dashboard stats.
- **Component types**: 9 enum values — MOTHERBOARD, PROCESSOR, MEMORY, HDD, MONITOR, KEYBOARD, MOUSE, AVR, OPTICAL_DRIVE.
- **Purchase statuses**: DRAFT→REQUESTED→APPROVED→REJECTED|FULFILLED. Transition rules enforced in server actions.
- **Fulfill increments inventory**: When PR goes APPROVED→FULFILLED, inventory quantities increase in a Prisma transaction.
