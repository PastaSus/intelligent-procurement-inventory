---
title: 'Full Sprint Retrospective — Epics 1–7'
type: 'retrospective'
created: '2026-07-02'
epics: [1, 2, 3, 4, 5, 6, 7]
status: 'complete'
---

# Sprint Retrospective: Epics 1–7

## Epic Summary

| Epic | Stories | Status |
|------|---------|--------|
| Epic 1: Schema Migration & Foundation | 2 / 2 | ✅ Done |
| Epic 2: Laboratory Room Management | 4 / 4 | ✅ Done |
| Epic 3: Computer Unit Management | 4 / 4 | ✅ Done |
| Epic 4: Computer Component Tracking | 6 / 6 | ✅ Done |
| Epic 5: Spare Parts Inventory | 3 / 3 | ✅ Done |
| Epic 6: Internal Purchase Request Workflow | 5 / 5 | ✅ Done |
| Epic 7: Navigation & Layout Migration | 2 / 2 | ✅ Done |
| **Total** | **26 / 26** | **✅ All Complete** |

---

## What Went Well

### 1. Schema-First Design Paid Off
Epic 1's Prisma schema was designed upfront and held stable through all subsequent epics. Only minor additions were needed (component_type linking between InventoryItem and ComputerComponent). The `onDelete: Cascade` on ComputerComponent → ComputerUnit meant hard-delete cascading worked correctly once the bug was fixed.

### 2. Consistent Patterns Across All Epics
Every CRUD feature followed the same architecture:
- Server Component page.tsx → Client Component → Modal Form
- Server Action → Zod validation → Prisma query → revalidatePath
- `window.location.reload()` after mutations

This consistency made the codebase predictable and reviews faster.

### 3. Automated Replenishment Check (Epic 5 → Epic 4 Integration)
The cross-epic integration where changing a component to `NEEDS_REPLACEMENT` triggers a spare parts inventory check was well executed. The real-time feedback in the edit form modal (`in_stock`/`partial`/`out_of_stock` alerts) is a standout UX pattern.

### 4. Component Health Dashboard
The `component-status/page.tsx` aggregates data across rooms, units, and components in a single page with stats cards, type breakdown, and room breakdown — all server-rendered with parallel queries.

### 5. Clean Navigation Architecture
Sidebar and BottomNavigation share a single `navItems` array, preventing drift. Collapsible sidebar, active highlighting, and responsive breakpoints all work correctly. Layout uses the `fixed inset-0` modal pattern consistently.

---

## What Could Be Improved

### 1. Soft-Delete Inconsistency (Epic 3 Bug)
**Problem:** `deleteComputerUnit` was soft-deleting the unit but leaving components visible. The schema had `onDelete: Cascade` for physical deletes only, and `ComputerComponent` has no `deleted` field.
**Fix Applied:** Changed to hard-delete. The cascade handles components.
**Lesson:** When mixing soft-delete parents with hard-delete children, ensure the parent delete operation accounts for the child records, or align the approach.

### 2. Null vs. Undefined Confusion (Epic 5 Bug)
**Problem:** `updateInventoryItem` couldn't clear `component_type` to null. Empty string `""` was converted to `undefined` (leave unchanged) instead of `null` (set to null).
**Fix Applied:** Added explicit empty-string-to-null conversion in the server action.
**Lesson:** The `?? undefined` / `?? null` pattern in project-context.md is critical — but easy to miss. Form handlers and Zod valiators both need to agree on how empty strings map.

### 3. No Transaction on Fulfill (Epic 6 Bug)
**Problem:** `fulfillPurchaseRequest` incremented inventory quantities and updated PR status as separate Prisma calls — partial failure would corrupt data.
**Fix Applied:** Wrapped in `$transaction`.
**Lesson:** Any multi-step write operation should default to a transaction, not be added as an afterthought.

### 4. Duplicate Queries in Component Health Dashboard
**Problem:** `component-status/page.tsx` ran the same `findMany` query twice — once in the top-level `Promise.all` for counts, and once inside a JSX IIFE for the table.
**Fix Applied:** Moved the IIFE query to the top-level parallel fetch.
**Lesson:** Server components should batch all queries at the top. IIFEs inside JSX hide query costs.

### 5. No Automated Tests
Zero test files exist for any of the lab asset features. Only AI chat components have tests. The project would benefit from integration tests on Server Actions and component tests on the CRUD flows.

### 6. `window.location.reload()` Pattern
While intentional, the full-page-reload-after-mutation pattern means all client-side state is lost on every CRUD action. This works for MVP but would benefit from `router.refresh()` or optimistic updates for a better UX.

---

## Action Items

| # | Action | Owner | Priority |
|---|--------|-------|----------|
| 1 | Add `deleted` field to `ComputerComponent` schema and align with soft-delete pattern used everywhere else | Developer | Medium |
| 2 | Write integration tests for Server Actions (at minimum: create, update, delete for each domain) | Developer | Medium |
| 3 | Consider migrating from `window.location.reload()` to `router.refresh()` for mutation feedback | Developer | Low |
| 4 | Document the null vs undefined pattern more prominently (it caused a real bug) | Developer | Low |
| 5 | Add a `pr_number` uniqueness collision test (the retry loop has no test coverage) | Developer | Low |

---

## Technical Debt Register

| Debt | Location | Severity | Notes |
|------|----------|----------|-------|
| No `deleted` field on `ComputerComponent` | `prisma/schema.prisma:68` | Medium | Inconsistent with all other models; forces hard-delete on cascade |
| Fuzzy `contains` matching on fulfill inventory increment | `app/_actions/purchase-requests.ts` | Low | Should eventually use FK-based matching instead of name contains |
| PR number uses `Math.random()` | `app/_actions/purchase-requests.ts:13` | Low | Not cryptographically secure; theoretical collision |
| Duplicate nav in DashboardHeader and Sidebar | `app/dashboard/components/DashboardHeader.tsx:30-38` | Low | Two sources of truth for nav items |

---

## Closing Notes

The sprint delivered a complete, working lab asset tracking system with 26 stories across 7 epics. The project was refactored mid-stream from a generic procurement system into an institutional laboratory computer asset tracker — a significant scope shift that was handled cleanly.

The codebase is consistent, follows documented patterns, and uses modern Next.js App Router conventions. The 4 bugs found in code review were all patched, and the remaining technical debt is tracked above.
