---
title: 'Story 9.2 — Enforce Admin-vs-Technician permission matrix'
type: 'feature'
created: '2026-10-04'
status: 'done'
baseline_commit: '0abd07b22f6f856601e0361de5206b1169c8893e'
context: ['_bmad-output/project-context.md', '_bmad-output/implementation-artifacts/epic-9-context.md']
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** Apart from PR approve/reject, every mutation is login-check only — a Technician can currently mutate spare-parts inventory and purchase requests, which are the Admin's exclusive responsibility.

**Approach:** Add fail-closed `ADMIN` gates (existing 6-4 pattern) to the 5 remaining restricted mutations, and hide their UI entry points from Technician sessions. Shared domains stay fully open.

## Boundaries & Constraints

**Always:** Copy the 6-4 gate shape exactly (`if (session.role !== 'ADMIN') return { success: false, error: '...' }`), placed AFTER the login check and BEFORE validation/DB work. UI gating reuses the existing `isAdmin` prop pattern. Per-action error messages (`Only administrators can ...`). Project-context rules (return shapes, revalidatePath, no optimistic updates).

**Ask First:** If additional mutations surface in the SAME two action files, include them. If gating targets appear in NEW files or flows, HALT and ask.

**Never:** No changes to rooms/units/components/software actions (stay shared). No proxy.ts changes. No new pages or routes. No `_bmad-output` doc edits (owned by 9-4).

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|----------|--------------|---------------------------|----------------|
| Tech inventory write | TECHNICIAN calls create/update/delete item | `{ success: false }`, no DB change (row intact, no soft-delete flag) | Message names the blocked action |
| Tech PR create/submit | TECHNICIAN calls create/submit | `{ success: false }`, no PR created, status stays DRAFT | Same fail-closed shape |
| Tech PR fulfill | TECHNICIAN calls fulfill on APPROVED PR | `{ success: false }`, inventory quantities unchanged | Transaction never starts |
| Admin restricted action | ADMIN calls any of the 5 | Success, existing behavior byte-for-byte | Covered by existing tests |
| Tech UI render | TECHNICIAN session on inventory/PR pages | Add/Edit/Delete and New/Submit/Fulfill controls absent | Server gate still enforced underneath |
| Missing session | Any restricted call unauthenticated | Login error (existing check fires first) | Gate order: login check, then role check |

</frozen-after-approval>

## Code Map

- `app/_actions/inventory.ts` -- gate create(:8), update(:57), delete(:110); all login-only today
- `app/_actions/purchase-requests.ts` -- gate create(:17), submit(:86), fulfill(:199); approve/reject already gated (verify-only)
- `app/dashboard/inventory/page.tsx` -- add getSession + `isAdmin` prop (has none today)
- `app/dashboard/inventory/InventoryClient.tsx` -- hide Add(:226)/Edit(:435)/Delete(:442,529) unless isAdmin; add prop
- `app/dashboard/purchase-requests/PurchaseRequestsClient.tsx` -- extend existing isAdmin: gate New(:174)/Submit(:279)/Fulfill(:309); approve/reject already gated
- Forms (`AddProductForm`, `EditProductForm`, `CreateRequestForm`, `RejectRequestDialog`) -- verify-only: server gate is the enforcement, entry buttons are the UX
- `app/_actions/__tests__/inventory.integration.test.ts` -- add TECHNICIAN-denied cases per mutation
- `app/_actions/__tests__/purchase-requests.integration.test.ts` -- add TECHNICIAN-denied cases for create/submit/fulfill
- `app/__tests__/epic-5/InventoryClient.test.tsx`, `app/__tests__/epic-6/PurchaseRequestsClient.test.tsx` -- update for isAdmin-gated rendering

## Tasks & Acceptance

**Execution:**
- [x] `app/_actions/inventory.ts` -- ADMIN gate in create/update/delete after login check -- tech mutations fail closed, admin flow byte-identical
- [x] `app/_actions/purchase-requests.ts` -- ADMIN gate in create/submit/fulfill -- PR lifecycle admin-only end to end
- [x] `app/dashboard/inventory/page.tsx` + `InventoryClient.tsx` -- plumb isAdmin, hide Add/Edit/Delete for tech -- no dead-end buttons for technicians
- [x] `app/dashboard/purchase-requests/PurchaseRequestsClient.tsx` -- hide New/Submit/Fulfill unless isAdmin -- matches existing approve/reject pattern
- [x] integration tests -- TECHNICIAN-denied cases for all 5 gated mutations asserting `{ success: false }` + zero DB change -- gates proven at action layer
- [x] client tests -- cover hidden-for-tech rendering and admin-visible rendering -- UI gating proven
- [x] verification -- targeted suites, full suite, manual tech/admin walkthrough -- matrix holds end to end

**Acceptance Criteria:**
- Given a logged-in Technician, when attempting inventory mutations or any PR mutation, then the action fails without mutating data
- Given a logged-in Admin, when performing the same actions, then they succeed exactly as before
- Given a logged-in Technician, when using rooms, units, components, or software, then full CRUD works
- Given a Technician session, when inventory/PR pages render, then forbidden buttons are hidden

## Verification

**Commands:**
- `npx vitest run app/_actions/__tests__/inventory.integration.test.ts app/_actions/__tests__/purchase-requests.integration.test.ts` -- expected: pass incl. new denial cases
- `npx vitest run app/__tests__/epic-5/InventoryClient.test.tsx app/__tests__/epic-6/PurchaseRequestsClient.test.tsx` -- expected: pass

**Manual checks (if no CLI):**
- Log in as tech: inventory Add/Edit/Delete and PR New/Submit/Fulfill buttons absent; direct action call returns failure
- Log in as admin: all controls present and functional

## Spec Change Log

## Suggested Review Order

**Server gates — the actual enforcement; start here**

- Identical fail-closed pattern in all three inventory mutations
  [`inventory.ts:14`](../../app/_actions/inventory.ts#L14)
  [`inventory.ts:66`](../../app/_actions/inventory.ts#L66)
  [`inventory.ts:122`](../../app/_actions/inventory.ts#L122)

- Same pattern closes the PR lifecycle end to end
  [`purchase-requests.ts:23`](../../app/_actions/purchase-requests.ts#L23)
  [`purchase-requests.ts:96`](../../app/_actions/purchase-requests.ts#L96)
  [`purchase-requests.ts:213`](../../app/_actions/purchase-requests.ts#L213)

**UI gating — hides what the server already denies**

- Session plumbing added to a page that had none
  [`page.tsx:13`](../../app/dashboard/inventory/page.tsx#L13)

- Add, Actions column, and delete modal hidden for tech
  [`InventoryClient.tsx:228`](../../app/dashboard/inventory/InventoryClient.tsx#L228)
  [`InventoryClient.tsx:515`](../../app/dashboard/inventory/InventoryClient.tsx#L515)

- New, Submit, Fulfill join the existing approve/reject pattern
  [`PurchaseRequestsClient.tsx:174`](../../app/dashboard/purchase-requests/PurchaseRequestsClient.tsx#L174)

**Tests — denial plus rendering**

- TECHNICIAN-denied cases with zero-DB-change assertions
  [`inventory.integration.test.ts:1`](../../app/_actions/__tests__/inventory.integration.test.ts#L1)
