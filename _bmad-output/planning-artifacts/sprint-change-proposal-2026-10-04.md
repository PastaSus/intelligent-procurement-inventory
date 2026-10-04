# Sprint Change Proposal — Role Model Refactor (STAFF to TECHNICIAN)

**Date:** 2026-10-04
**Author:** Administrator
**Change Scope:** Minor-Moderate (Direct Adjustment)
**Trigger:** Professor/advisor post-sprint review — roles must match real lab structure

---

## 1. Issue Summary

After completing all 8 epics, the professor (acting lab admin) reviewed the roles model and found it misaligned with reality:

1. **Wrong role name** — `STAFF` is a generic placeholder. The lab has **Technicians** who do hands-on tech work: checking which components are working or not across rooms, flagging items that need repair/replacement.
2. **No real permission boundary** — Apart from purchase-request approve/reject, every action is login-check only. A Technician can currently mutate spare-parts inventory and purchase requests, which are the professor/admin's exclusive responsibility (overall lab + inventory management).
3. **Viewer role is unwanted** — PRD lists a future Viewer role; professor confirms only two roles will ever exist: **Admin + Technician**.
4. **Doc/code drift found during audit** — `app/proxy.ts` guards `/dashboard/admin`, `/dashboard/users`, `/dashboard/settings`, none of which exist; stories 3-5 and 4-5 claim ADMIN checks absent from code; `deferred-work.md` lists RBAC gaps (components, software, reports actions) as accepted app-wide pattern.

This is a corrective + additive change. No existing functionality is broken.

**Locked permission matrix (professor-confirmed):**

| Area | ADMIN | TECHNICIAN |
|------|-------|------------|
| Rooms / Units / Components / Software | Full CRUD | Full CRUD (incl. NEEDS_REPAIR / NEEDS_REPLACEMENT flags) |
| Spare-parts inventory | Full CRUD | View only |
| Purchase requests | Full (create/submit/approve/reject/fulfill) | View only |
| Reports | View | View |
| AI chat / Dashboard | Full | Full |

Resulting flow: technician flags `NEEDS_REPLACEMENT` during rounds → admin sees it (dashboard/report) → admin creates the purchase request.

---

## 2. Impact Analysis

### Epic Impact

| Existing Epic | Impact | Notes |
|---------------|--------|-------|
| Epic 1: Foundation & Auth | **Partial** | Done; outputs touched by rename (Role enum, seed, session). No reopen — migrate forward via Epic 9. |
| Epic 2: Room Management | None | Shared CRUD, no scope change. |
| Epic 3: Unit Management | None | Shared CRUD, no scope change. |
| Epic 4: Component Tracking | None | Technician's core workflow already built; no scope change. |
| Epic 5: Spare Parts Inventory | **Gating only** | No feature change; mutations become admin-only (Epic 9). |
| Epic 6: Purchase Request Workflow | **Gating only** | No feature change; create/submit/fulfill become admin-only alongside existing approve/reject gates (Epic 9). |
| Epic 7: Navigation & Layout | None | — |
| Epic 8: Advisor Features | None | Reports stay shared; no scope change. |
| **New Epic 9: Role Model Refactor** | **Added** | Stories 9-1..9-4 (see Section 4). |

### Artifact Impact

| Artifact | Impact | Action Needed |
|----------|--------|---------------|
| **PRD** | Medium | User Types table rewrite (P1); Growth/Security/FR28/NFR6 edits + FR42-FR45 (P2). Viewer role removed. |
| **Architecture** | Medium | Authorization Patterns rewrite; Role enum migration note (P3). |
| **UX spec** | Low | Journey 1 to Admin; Journey 3 to Technician (P5). |
| **Schema / migration** | Medium | `Role` enum `STAFF` → `TECHNICIAN` with data backfill of existing rows. |
| **Seed** | Low | `staff@example.com / staff123` → `tech@example.com / tech123`. |
| **proxy.ts** | Low | Remove phantom ADMIN_ROUTES (Story 9-3). |
| **Tests** | Low | 4 files rename STAFF → TECHNICIAN. |
| **Sprint Status** | Low | Add epic-9 + stories as backlog (done in this proposal). |
| **Project Context** | Low | Permission matrix + seed update (P6). |
| **Traceability / deferred-work** | Low | R-007 wording; RBAC deferrals marked resolved-by-Epic-9 (P7). |

---

## 3. Recommended Approach: Direct Adjustment

### Rationale

- Change is **corrective scoping, not repair** — nothing is reverted (rollback not viable, would destroy working features).
- MVP already delivered; this **extends** it with the real permission model (MVP review not applicable).
- Technician workflows (component status, NEEDS_REPAIR flags, reports) **already exist** — Epic 9 is rename + gates, no new pages.
- Effort: Low-Medium. Risk: Low-Medium (Postgres enum rename needs a careful migration with value backfill; existing deployments carry STAFF rows).

---

## 4. Detailed Change Proposals

### Proposal 1 (APPROVED): PRD — User Types table (prd.md:123-129)

Replace the Staff/Member row with Technician (rooms/units/components/software CRUD, inventory view-only, PR view-only, reports view); delete the Viewer row; MVP line becomes `2 roles (Admin + Technician)` with enforcement in middleware and server actions.

### Proposal 2 (APPROVED): PRD — scattered references + new FRs

- Growth row: drop `Role-based permissions` (now delivered, not future).
- Security MVP: `Role-based access (Admin vs Technician), enforced in middleware and server actions`.
- FR28: `System enforces role-based access (Admin vs Technician)`, plus FR42 (Technician replaces Staff everywhere), FR43 (tech CRUD incl. NEEDS_REPAIR flags), FR44 (inventory Admin-only), FR45 (PRs Admin-only, tech read-only).
- NFR6: append `(Technician: read-only; Admin: full access)`.

### Proposal 3 (APPROVED): Architecture — Authorization Patterns (architecture.md:243-245)

Rewrite roles as Admin (full access) + Technician (scoped per matrix); implementation as `app/proxy.ts` + `session.role` from `lib/auth.ts` (fixes `session.user.role` drift); fail-closed server-action gates; schema note for the STAFF → TECHNICIAN migration with backfill.

### Proposal 4 (APPROVED): New Epic 9 — Role Model Refactor (Technician)

```
Story 9-1: Rename STAFF role to TECHNICIAN
As a lab administrator,
I want the Staff role renamed to Technician across database, seed, sessions, and UI,
So that role names match real lab responsibilities.
AC:
- Prisma Role enum contains ADMIN and TECHNICIAN only
- Migration renames existing STAFF values to TECHNICIAN (no data loss)
- Seed creates tech@example.com / tech123 (TECHNICIAN); staff@example.com removed
- getSession/lib/auth + mocks return TECHNICIAN for tech user
- No remaining STAFF references in app code, tests, seed, or docs (grep-clean)
```

```
Story 9-2: Enforce Admin-vs-Technician permission matrix
As a lab administrator,
I want mutations restricted by role,
So that technicians cannot alter inventory or purchase requests.
AC:
- Inventory (spare parts) create/update/delete return failure for TECHNICIAN; Admin succeeds
- All purchase-request mutations (create 6-1, submit 6-3, approve/reject 6-4, fulfill 6-5) return failure for TECHNICIAN
- Rooms/units/components/software CRUD + status flags remain available to both roles
- UI hides/disables forbidden buttons for TECHNICIAN (inventory add/edit/delete, PR create/approve/fulfill)
- All role checks fail closed (no session or wrong role = failure, no mutation)
- Existing approve/reject gates (6-4) keep passing
```

```
Story 9-3: Repair proxy.ts admin route guard
As a lab administrator,
I want the route middleware to guard real admin boundaries,
So that role enforcement isn't pointing at phantom pages.
AC:
- ADMIN_ROUTES no longer lists non-existent /dashboard/admin, /users, /settings
- Guard maps to real admin-only routes, or defers to per-page session.role checks with justification
- Authenticated TECHNICIAN still reaches all shared pages; unauthenticated users still redirect to login
```

```
Story 9-4: Update tests and docs for Technician role
As a developer,
I want tests and docs aligned with the Technician model,
So that CI and onboarding reflect reality.
AC:
- enums.test, lib/__mocks__/auth.ts, story-6.4 test, purchase-requests integration use TECHNICIAN
- Full Vitest suite passes (except pre-existing AIChat failure)
- PRD / Architecture / UX / project-context / epics / traceability / deferred-work / sprint-status updated per this proposal
```

### Proposal 5 (APPROVED): UX spec role reassignment

- Journey 1 (Low-Stock to Reorder): Staff → **Admin** (admin owns inventory + PRs).
- Journey 3 (Lab Asset Tracking): Staff → **Technician**.
- Persona line 30 (ADMIN) unchanged; generic "lab staff" prose untouched.

### Proposal 6 (APPROVED): project-context.md

- Add permission matrix summary + TECHNICIAN rule.
- Seed line becomes `tech@example.com / tech123`.
- ADMIN_ROUTES note updated per Story 9-3 outcome.

### Proposal 7 (APPROVED): Sweep

- STAFF → TECHNICIAN in: enums.test, mocks, story-6.4 test, PR integration tests, seed.ts, docs/SCHEMA.md:160, epics.md:54, traceability R-007.
- deferred-work.md RBAC deferrals marked resolved-by-Epic-9.
- sprint-status.yaml gains epic-9 + 9-1..9-4 as backlog (applied).

---

## 5. Implementation Handoff

### Scope Classification: **Minor-Moderate**

### Proposed Story Sequence

| # | Story | Epic | Effort | Dependencies |
|---|-------|------|--------|--------------|
| 1 | 9-1 Rename STAFF to TECHNICIAN | Epic 9 | S | None |
| 2 | 9-3 Repair proxy.ts ADMIN_ROUTES | Epic 9 | XS | Story 9-1 |
| 3 | 9-2 Enforce permission matrix | Epic 9 | M | Stories 9-1, 9-3 |
| 4 | 9-4 Tests + docs sweep | Epic 9 | S | Stories 9-1..9-3 |

### Handoff Recipients

- **Developer Agent (bmad-dev-story / bmad-quick-dev):** Implement stories 9-1..9-4 in sequence.
- **Test Architect (bmad-testarch-atdd):** Acceptance tests for 9-2 gates (TECHNICIAN blocked / ADMIN allowed per action).

### Success Criteria

- Zero `STAFF` references in code, tests, seed, docs (grep-clean).
- Technician blocked (server-side) from inventory + PR mutations; admin flows unaffected.
- Full Vitest suite passes (except pre-existing AIChat failure).
- Migration clean on a DB containing STAFF rows (no data loss).

---

## 6. PRD Updates Required

Covered in Proposals 1-2: User Types table, Growth row, Security MVP line, FR28 + FR42-FR45, NFR6. Viewer role removed from PRD scope.

---

## Approval

- [ ] **Approved** — Proceed with implementation
- [ ] **Revise** — Changes needed to proposal
- [ ] **Reject** — Do not implement

---

## Finalization

**Scope Classification:** Minor-Moderate (Direct Adjustment)
**Handoff:** Developer Agent (bmad-dev-story / bmad-quick-dev) for sequential story implementation
