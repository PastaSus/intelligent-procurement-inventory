# Epic 9 Context: Role Model Refactor (Technician)

<!-- Compiled from planning artifacts. Edit freely. Regenerate with compile-epic-context if planning docs change. -->

## Goal

Rename the generic Staff role to Technician and lock in a real Admin-vs-Technician permission boundary, so day-to-day lab work (rooms, units, components, software, status flags) stays shared while spare-parts inventory and purchase requests become admin-only, matching how the lab actually operates.

## Stories

- Story 9.1: Rename STAFF role to TECHNICIAN
- Story 9.2: Enforce Admin-vs-Technician permission matrix
- Story 9.3: Repair proxy.ts admin route guard
- Story 9.4: Update tests and docs for Technician role

## Requirements & Constraints

Only two roles exist: Admin and Technician; the planned Viewer role is dropped. Shared areas stay fully open to both roles: rooms, units, components, and software support full CRUD including NEEDS_REPAIR / NEEDS_REPLACEMENT flags, plus shared view of reports, dashboard, and AI chat. Restricted areas are admin-only: spare-parts inventory mutations (create/update/delete) and every purchase-request mutation (create, submit, approve/reject, fulfill) — Technicians get view-only access and failed attempts must not mutate data. The intended flow is technician flags NEEDS_REPLACEMENT during rounds, admin sees it via dashboard/reports, admin creates the purchase request. All role checks fail closed (missing session or wrong role means failure). Success means zero remaining STAFF references in code, tests, seed, or docs; existing STAFF rows migrate without data loss; seed provides tech@example.com as TECHNICIAN; and the full test suite passes apart from the known pre-existing AIChat failure.

## Technical Decisions

Prisma Role enum holds only ADMIN and TECHNICIAN; the migration renames stored STAFF values to TECHNICIAN with backfill rather than recreating data. Session role is read from the auth helper's session object and enforced in two layers: route middleware in app/proxy.ts plus fail-closed guards at the top of each restricted server action, following the standard action result shape and cache revalidation used elsewhere. Middleware must stop guarding phantom paths (/dashboard/admin, /users, /settings) and map only to real admin-only boundaries, deferring the rest to per-page or per-action role checks while keeping unauthenticated redirects to login. Seed, mocks, and session helpers switch the staff fixture to the technician account.

## UX & Interaction Patterns

No new pages or flows; reuse existing tables, badges, toasts, and dialogs. For Technician sessions, hide or disable forbidden controls (inventory add/edit/delete, purchase-request create/submit/approve/fulfill) while leaving shared CRUD fully interactive. Role framing follows the updated journeys: low-stock-to-reorder is an Admin flow, lab asset tracking rounds are the Technician flow.

## Cross-Story Dependencies

Implement in order: rename (9.1) first, then middleware repair (9.3), then permission gates (9.2), then tests and docs sweep (9.4). The gates touch the spare-parts and purchase-request areas without changing their features; room, unit, component, navigation, and advisor/report areas are unaffected except for the role rename.
