---
title: 'Story 9.1 — Rename STAFF role to TECHNICIAN'
type: 'refactor'
created: '2026-10-04'
status: 'done'
baseline_commit: '21c33cbc7e2b3e792ab13f8a5252bd7ea39c6e9e'
context: ['_bmad-output/project-context.md', '_bmad-output/implementation-artifacts/epic-9-context.md']
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** The `STAFF` role name does not match how the lab operates. Per the approved sprint change proposal (2026-10-04, Epic 9), the role must become `TECHNICIAN` across the database enum, seed data, sessions, mocks, and tests — with zero behavior change to any server action or gate.

**Approach:** Rename the Prisma `Role` enum value with a data-preserving migration, switch the seed/mocks/tests to the technician identity, and verify with SQL checks, grep, and the test suite.

## Boundaries & Constraints

**Always:** Create a NEW migration (`prisma migrate dev`); never edit `prisma/migrations/20260701122929_init/migration.sql` or any history file. Backfill every existing `STAFF` row to `TECHNICIAN`. Leave all `session.role !== 'ADMIN'` checks and `isAdmin` props untouched — they stay correct for TECHNICIAN. Follow project-context rules (enum values must match Prisma exactly).

**Ask First:** If the dev database shows migration drift and `migrate dev` refuses to run, HALT and ask before baselining or resetting. If additional `STAFF` hits appear outside the Code Map that imply a behavior change, HALT and ask.

**Never:** No permission-gate changes (Story 9-2). No `proxy.ts` changes (Story 9-3). No `_bmad-output` planning-doc edits (Story 9-4). No UI redesign — the role badge renders `{user.role}` dynamically and picks up the rename automatically.

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|----------|--------------|---------------------------|----------------|
| Migrate DB with STAFF rows | `User.role = 'STAFF'` present | All rows become `TECHNICIAN`; enum no longer contains `STAFF` | Verify with `SELECT DISTINCT role`; HALT if STAFF remains |
| Fresh migrate + seed | Empty database | `tech@example.com` exists as TECHNICIAN; no `staff@example.com` | Reseed and re-check |
| Re-seed over old database | Legacy `staff@example.com` row present | Old row removed, single `tech@example.com` row, no duplicates | Check unique email count |
| Stale JWT after deploy | Cookie still carries `role: 'STAFF'` | Badge shows old label until re-login; zero privilege impact (`STAFF` was never `ADMIN`) | No action; note in handoff |

</frozen-after-approval>

## Code Map

- `prisma/schema.prisma` -- Role enum + `@default(STAFF)`; rename both
- `prisma/migrations/20260701122929_init/migration.sql` -- history reference; READ ONLY, never edit
- `prisma/seed.ts` -- staff upsert (lines 31-40); convert to delete-old + upsert-tech
- `lib/__mocks__/auth.ts` -- `MockSessionRole` union + STAFF fixture
- `lib/auth.ts` -- `SessionPayload.role: string`; no change expected (verify only)
- `app/_actions/auth.ts` -- passes `user.role` straight into session; no change (verify only)
- `app/__tests__/epic-1/enums.test.ts` -- Role enum assertions (lines 31, 89-91)
- `app/__tests__/epic-6/story-6.4-approve-reject-pr.test.ts` -- local Role type + STAFF cases (lines 3, 30-31, 57-58)
- `app/_actions/__tests__/purchase-requests.integration.test.ts` -- STAFF session mocks (lines 182, 250)
- `docs/SCHEMA.md` -- enum + seed credential docs (lines 11, 135, 160)
- `package.json` -- no migrate script exists; run `npx prisma` commands directly

## Tasks & Acceptance

**Execution:**
- [x] `prisma/schema.prisma` -- rename `STAFF` to `TECHNICIAN` in enum `Role` and in `@default(STAFF)` -- schema is the source of truth
- [x] new `prisma/migrations/*_rename_staff_to_technician/migration.sql` -- data-preserving enum rename (ADD value, backfill rows, drop old value via type recreation); verify no STAFF rows remain
- [x] `prisma/seed.ts` -- `deleteMany` legacy `staff@example.com`, then upsert `tech@example.com / tech123` as TECHNICIAN -- re-seed must be idempotent with no duplicate users
- [x] `lib/__mocks__/auth.ts` -- union becomes `'ADMIN' | 'TECHNICIAN'`; fixture becomes `TECHNICIAN: { id: 'tech-001', email: 'tech@example.com', role: 'TECHNICIAN', name: 'Tech User' }` -- mocks match the new model
- [x] `app/__tests__/epic-1/enums.test.ts`, `app/__tests__/epic-6/story-6.4-approve-reject-pr.test.ts`, `app/_actions/__tests__/purchase-requests.integration.test.ts` -- rename STAFF type members, fixtures, and case labels to TECHNICIAN -- suite stays green with identical gate semantics
- [x] `docs/SCHEMA.md` -- update enum list and seed credential line -- repo docs match runtime
- [x] verification -- run generate, migrate, seed, SQL distinct-role check, scoped grep, targeted tests then full suite -- proves rename complete and nothing regressed

**Acceptance Criteria:**
- Given a database containing STAFF users, when the migration runs, then all STAFF values become TECHNICIAN with no data loss
- Given a fresh setup, when migrate + seed run, then tech@example.com (TECHNICIAN) exists and staff@example.com does not
- Given `rg -i staff` scoped to code, tests, seed, and repo docs (excluding _bmad-output planning docs, owned by 9-4), when run, then zero matches remain
- Given the full Vitest suite, when run, then it passes except the pre-existing AIChat failure

## Design Notes

Postgres cannot rename an enum value with plain `ALTER TYPE ... RENAME`; the migration must add the new value, backfill the column, then remove the old value through type recreation (new type, `ALTER COLUMN ... USING`, drop old type, rename). Never hand-edit history migrations.

## Verification

**Commands:**
- `npx prisma generate` -- expected: clean generate
- `npx prisma migrate dev --name rename_staff_to_technician` -- expected: applies without drift errors
- `SELECT DISTINCT role FROM "User";` -- expected: only ADMIN, TECHNICIAN
- `pnpm seed` -- expected: tech user present, no duplicate users on repeat runs
- `rg -i staff --glob '!_bmad-output/**' --glob '!node_modules/**' --glob '!.next/**'` -- expected: zero hits (adjust globs to repo ignore rules)
- `npx vitest run app/__tests__/epic-1/enums.test.ts app/__tests__/epic-6/story-6.4-approve-reject-pr.test.ts app/_actions/__tests__/purchase-requests.integration.test.ts` -- expected: all pass
- `pnpm test:run` -- expected: full suite passes except pre-existing AIChat failure

## Spec Change Log

## Suggested Review Order

**Core rename — the entire behavior change**

- Data-preserving enum swap with inline STAFF backfill; start here
  [`migration.sql:1`](../../prisma/migrations/20261004031439_rename_staff_to_technician/migration.sql#L1)

- Enum value renamed; column default follows for new users
  [`schema.prisma:153`](../../prisma/schema.prisma#L153)
  [`schema.prisma:14`](../../prisma/schema.prisma#L14)

**Identity switchover**

- Legacy row deleted, technician identity upserted idempotently
  [`seed.ts:31`](../../prisma/seed.ts#L31)

**Test alignment**

- Mock role union and fixture renamed to technician
  [`auth.ts:3`](../../lib/__mocks__/auth.ts#L3)

- Enum assertions mirror the new model
  [`enums.test.ts:31`](../../app/__tests__/epic-1/enums.test.ts#L31)

- Non-admin denial cases keep identical gate semantics
  [`story-6.4-approve-reject-pr.test.ts:30`](../../app/__tests__/epic-6/story-6.4-approve-reject-pr.test.ts#L30)

- Integration session mocks use technician identity
  [`purchase-requests.integration.test.ts:182`](../../app/_actions/__tests__/purchase-requests.integration.test.ts#L182)

**Docs**

- Schema reference updated to new enum and credentials
  [`SCHEMA.md:11`](../../docs/SCHEMA.md#L11)
