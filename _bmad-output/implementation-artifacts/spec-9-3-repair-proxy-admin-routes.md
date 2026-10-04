---
title: 'Story 9.3 — Repair proxy.ts admin route guard'
type: 'refactor'
created: '2026-10-04'
status: 'done'
baseline_commit: '1d364c85cc1cc88644825ee2493146ca71e96ac0'
context: ['_bmad-output/project-context.md', '_bmad-output/implementation-artifacts/epic-9-context.md']
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** `ADMIN_ROUTES` in `app/proxy.ts` guards `/dashboard/admin`, `/dashboard/users`, and `/dashboard/settings` — none of which exist. The check is dead code that creates a false impression of route-level RBAC.

**Approach:** Delete the `ADMIN_ROUTES` list and its check block. No admin-only pages exist (all dashboard pages are shared per the locked matrix), so enforcement correctly lives in per-page checks and Story 9-2 server-action gates. Record that justification in a code comment.

## Boundaries & Constraints

**Always:** Keep `PUBLIC_ROUTES`, `PROTECTED_PREFIXES`, no-token redirect to `/login`, bad-token redirect to `/login`, and the `config.matcher` exactly as-is. Leave the dashboard layout login guard untouched as second layer.

**Ask First:** If any real page needing a route-level admin gate is discovered, HALT — the locked matrix assumes none exist.

**Never:** No new gates or role checks added (owned by 9-2). No `_bmad-output` doc edits — the stale `ADMIN_ROUTES` note in project-context is owned by 9-4. No session format changes.

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|----------|--------------|---------------------------|----------------|
| Authed user on shared page | Valid JWT (ADMIN or TECHNICIAN), any `/dashboard/*` path | `NextResponse.next()` | N/A |
| No session | No cookie, `/dashboard/*` path | Redirect to `/login` | N/A — unchanged path |
| Invalid token | Garbage cookie, `/dashboard/*` path | Redirect to `/login` | N/A — unchanged path |
| Phantom admin path | `/dashboard/admin` (never existed) | Falls through to framework 404 | N/A — no such route |

</frozen-after-approval>

## Code Map

- `app/proxy.ts` -- delete `ADMIN_ROUTES` (line 12) and its check block (lines 33-37); add justification comment
- `app/dashboard/layout.tsx` -- verify-only: login guard, no role logic; stays as second layer
- `_bmad-output/project-context.md:91` -- verify-only: stale note flagged for 9-4; DO NOT EDIT

## Tasks & Acceptance

**Execution:**
- [x] `app/proxy.ts` -- remove `ADMIN_ROUTES` list + check block, add 1-2 line comment stating enforcement lives in per-page checks and server-action gates -- dead RBAC code gone, auth redirects untouched
- [x] repo-wide `ADMIN_ROUTES` grep -- confirm zero matches in code (docs/history exempt) -- proves complete removal
- [x] verification -- typecheck, targeted tests, redirect-path inspection -- proves middleware still compiles and behaves

**Acceptance Criteria:**
- Given `app/proxy.ts`, when reviewed, then no `ADMIN_ROUTES` list or admin-path check remains
- Given an authenticated ADMIN or TECHNICIAN, when visiting any `/dashboard/*` page, then access is granted
- Given a missing or invalid session, when visiting `/dashboard/*`, then redirect to `/login` (unchanged)
- Given a repo-wide search for `ADMIN_ROUTES` in code, when run, then zero matches remain

## Verification

**Commands:**
- `npx tsc --noEmit` -- expected: no new errors (report pre-existing ones without fixing)
- `rg ADMIN_ROUTES --glob '!_bmad-output/**' --glob '!node_modules/**'` -- expected: zero hits
- `npx vitest run app/_actions/__tests__/purchase-requests.integration.test.ts` -- expected: passes (session/role plumbing unaffected)

## Spec Change Log

## Suggested Review Order

- Phantom list and dead check removed; only auth redirects remain
  [`proxy.ts:11`](../../app/proxy.ts#L11)

- Justification recorded where the gate used to live
  [`proxy.ts:30`](../../app/proxy.ts#L30)

- Unchanged `/login` redirect paths and matcher confirm no behavior shift
  [`proxy.ts:23`](../../app/proxy.ts#L23)
