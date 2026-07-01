---
project_name: 'intelligent-procurement-inventory'
user_name: 'Developer'
date: '2026-06-15'
sections_completed: ['technology_stack']
existing_patterns_found: 8
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
| OpenAI | 4.104.0 | AI integration |
| Google GenAI | 2.1.0 | AI integration |

## Critical Implementation Rules

### Data & Validation

- **PATCH-style updates**: All update Zod schemas use `.partial()` — every field optional, only `id` required in the request body.
- **camelCase↔snake_case mapping**: Server actions receive camelCase from validators, map to snake_case for Prisma DB fields (`reorderPoint`→`reorder_point`, `componentType`→`component_type`).
- **Nullable fields**: Use `?? undefined` (not `?? null`) when passing nullable optional fields to Prisma. `null` means "set to null", `undefined` means "leave unchanged".
- **Zod strings**: Always use `.trim().max()` on string fields — no trailing whitespace.
- **`unitPrice` optional**: `unitPrice` on RequestItem is optional user input. `total` is auto-calculated server-side when both `quantity` and `unitPrice` are present.
- **Decimal serialization**: Prisma `Decimal` fields must be serialized to `string` before transmitting to client.

### Server Actions

- **FormData server actions**: All server actions accept `FormData`, not JSON. Parse with `.get()` and manual type conversion (e.g., `parseInt` for numbers).
- **Revalidation paths must match routes**: `revalidatePath()` target must match the actual Next.js App Router route path.
- **No soft-delete on children**: `ComputerComponent` and `RequestItem` omit `deleted`/`created_by`/`updated_by` — hard cascade-delete through parent is the correct semantic.

### Component Patterns

- **Modal pattern**: Add/edit forms use `fixed inset-0 z-50 bg-black/50` overlay with `useTransition` for pending state.
- **Mutations**: All use `window.location.reload()` after success — no optimistic updates.
- **Page structure**: Server `page.tsx` → `*Client.tsx` → `components/<Form>.tsx` for modals.
- **Search/sort**: Client-side filtering via `useMemo` with helper `<SortHeader>` component.
- **Status badges**: Color-coded badges use `bg-{color}-100 text-{color}-800` pattern.
- **Session auth**: Server pages use `getSession()` redirect on fail; admin actions check `session.role`.

### Form Handling

- **FormData.get() safety**: `FormData.get()` can return `null`. Handle with `??` default or guard with `if (!value) return { error }`.
- **Numeric fields**: Parse with `Number()` or `parseInt()` (with `NaN` check) before passing to validator.
- **TODO/Enum fields**: Ensure all enum values match the Prisma enum exactly (string comparison).
