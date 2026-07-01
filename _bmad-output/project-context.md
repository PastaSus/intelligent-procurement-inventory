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

- **PATCH-style updates**: All update Zod schemas use `.partial()` — every field optional, only `id` required in the request body.
- **camelCase↔snake_case mapping**: Server actions receive camelCase from validators, map to snake_case for Prisma DB fields (`reorderPoint`→`reorder_point`, `componentType`→`component_type`).
- **Nullable fields**: Use `?? undefined` (not `?? null`) when passing nullable optional fields to Prisma. `null` means "set to null", `undefined` means "leave unchanged".
- **No soft-delete on children**: `ComputerComponent` and `RequestItem` omit `deleted`/`created_by`/`updated_by` — hard cascade-delete through parent is the correct semantic.
- **FormData server actions**: All server actions accept `FormData`, not JSON. Parse with `.get()` and manual type conversion (e.g., `parseInt` for numbers).
- **`unitPrice` optional**: `unitPrice` on RequestItem is optional user input. `total` is auto-calculated server-side when both `quantity` and `unitPrice` are present.
- **Revalidation paths must match routes**: `revalidatePath()` target must match the actual Next.js App Router route path.
