---
title: 'Defense fixes + features plan (8 items)'
type: 'plan'
created: '2026-10-07'
status: 'planned'
route: 'one-shot'
---

## Intent

**Problem:** Pre-defense review found 5 small high-value fixes + 3 new-feature requests for the intelligent-procurement-inventory app (Next.js 16 + Prisma + Postgres). Code crawled 2026-10-07; all findings verified against code.

**Approach:** Do quick wins first (no migration), then tech-Draft + PR print letter, then stock-part link (needs migration). Defer hard no-self-approval block and full activity log past defense.

## Work items

### 1. Technicians can create Draft requests (role-design win)
- Current: all 5 PR actions ADMIN-only (`app/_actions/purchase-requests.ts:23,96,132,169,213`). `PurchaseRequestsClient.tsx:174` hides New Request; `:280,290,310` gate submit/approve/fulfill on `isAdmin`.
- Fix: allow TECHNICIAN in `createPurchaseRequest` only (check `session.userId`, drop ADMIN gate). Keep submit/approve/reject/fulfill ADMIN-only. Show New Request to all roles; keep action buttons `isAdmin`.
- Touch: `app/_actions/purchase-requests.ts:17-25`, `app/dashboard/purchase-requests/PurchaseRequestsClient.tsx:174`, `app/dashboard/purchase-requests/page.tsx:32`.

### 2. Admin-only delete for rooms, units, components
- Current: any login can delete. `app/_actions/rooms.ts:92`, `units.ts:124`, `components.ts:152`, `software.ts:121` check only `session.userId`. Only `inventory.ts:122` is ADMIN-gated.
- Fix: add `if (session.role !== 'ADMIN') return {error}` to `deleteLabRoom`, `deleteComputerUnit`, `deleteComponent`, `removeInstalledApplication`. Keep create/update open.
- No migration.

### 3. Match low-stock logic to `<=`
- Current: Dashboard strict `<` (`app/_actions/dashboard.ts:27-30`, `app/api/dashboard/route.ts:26-29`, `lib/ai/groq.ts:31`). Spare Parts self-inconsistent: filter `<=` (`InventoryClient.tsx:151`), header count `<` (`:187`), row badge `<=` (`:358`), normal `>` (`:156`).
- Fix: use `<=` everywhere for low (`quantity <= reorder_point && quantity > 0`), `== 0` critical, `> reorder_point` normal. Update SQL to `quantity <= "reorder_point"`. Seed proof: `MON-SAM-20 qty:1 reorder:1` (`prisma/seed.ts:141`).
- Docs saying `<` (`prd.md:236`, `epics.md:307`, `2-6-low-stock-alerts-display.md:15`) updated to `<=` to match `project-context.md:70`.

### 4. Link request items to stock parts (dropdown)
- Current: free-text `item_name` + fuzzy fulfill match (`purchase-requests.ts:234-238` `contains ... insensitive`). 0 matches still marks FULFILLED; 2 matches double-increment.
- Fix: add `RequestItem.inventory_item_id String?` + relation to `InventoryItem` (`prisma/schema.prisma:139`). `CreateRequestForm` dropdown lists `InventoryItem where deleted=false` (sku + name + qty); store id + name snapshot. Fulfill updates by id; fallback to name-match only when id null (old rows). Needs migration + backfill + validator update (`lib/validators/purchase-request.ts:3-7`).
- Largest of the 5 fixes; do last before freeze.

### 5. Align docs with code
- PR number: code is `PR-YYYYMMDD-XXXX` 4-char random, 16 chars (`purchase-requests.ts:8-15`). Docs claim 6-char in `_bmad-output/project-context.md:60`, `test-design-epic-6.md:49`. Fix docs, not code.
- PERN: `planning-artifacts/prd.md:68`, `brainstorming/session-2026-05-04.md:65` say PERN (Postgres-Express-React-Node). Actual: Next.js + Prisma + Postgres, no Express. Fix wording.

### 6. No self-approval — DEFERRED hard block
- Current allows self-approve (`approvePurchaseRequest:126-161`, no `created_by` check).
- Decision: with only 2 lab managers, hard `created_by === approver` block deadlocks when one admin is absent. Defense-safe version is warning banner only. Implement hard block + override path after VP flow exists.

### 7. Activity log — DEFERRED (DB space negligible)
- No log model today (only `created_by/updated_by` overwrites). One row ~100-200 bytes; 100 actions/day x 365d ~= 5-7 MB/year. Bounded with 12-month retention + paginated admin page.
- Minimal future shape: `ActivityLog{id, actor_id, action, entity, entity_id, created_at}` written in 5 PR actions + deletes only. Cross-cutting; not needed for defense narrative.

### 8. Purchase-req print letter (MUST)
- Current: print only for Hardware Report (`HardwareReport.tsx:123 window.print()`, `globals.css:106-139 @media print A4`). No PR print, no PDF deps.
- Build: `PurchaseRequestPrint.tsx` reusing same `window.print()` + `print-only`/`report-no-print` pattern. Formal letter: university/lab header, date, `pr_number`, items table (name/qty/unit/total), grand total, notes, Prepared-by / Approved-by / Vice-President signature blocks. Print button on APPROVED rows.

## Suggested build order

1. #3, #2, #5 — minutes, zero migration
2. #1 — small gate change
3. #8 — must-have, isolated component
4. #4 — needs migration, last before freeze
5. Defer #6 (hard block), #7 (full log)
