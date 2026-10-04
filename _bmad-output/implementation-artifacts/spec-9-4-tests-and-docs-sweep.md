---
title: 'Story 9.4 — Tests and docs sweep for Technician role'
type: 'chore'
created: '2026-10-04'
status: 'done'
route: 'one-shot'
---

# Story 9.4 — Tests and docs sweep for Technician role

## Intent

**Problem:** Planning docs still described the Staff/Member role and a future Viewer role after the code moved to Admin + Technician, and RBAC deferrals in deferred-work no longer applied.

**Approach:** Transcribed the approved correct-course proposals into PRD, Architecture, UX spec, project-context, epics, traceability, and deferred-work; ran the full suite as final verification.

## Suggested Review Order

**PRD role model**

- Two-role table, Viewer deleted, MVP enforcement line
  [`prd.md:121`](../../planning-artifacts/prd.md#L121)

- Growth scope, Security line, FR28 plus FR42-FR45, NFR6
  [`prd.md:114`](../../planning-artifacts/prd.md#L114)
  [`prd.md:433`](../../planning-artifacts/prd.md#L433)

**Architecture and UX**

- Authorization rewrite with corrected enforcement layering
  [`architecture.md:241`](../../planning-artifacts/architecture.md#L241)

- Journey 1 to Admin, Journey 3 to Technician, role-neutral reject node
  [`ux-design-specification.md:247`](../../planning-artifacts/ux-design-specification.md#L247)

**Context and traceability**

- Permission matrix, page-auth rule, proxy note, seed credentials
  [`project-context.md:59`](../../project-context.md#L59)

- R-007 risk reworded, RBAC deferrals marked resolved
  [`test-design-architecture.md:77`](../../test-artifacts/test-design-architecture.md#L77)
  [`deferred-work.md:1`](./deferred-work.md#L1)
