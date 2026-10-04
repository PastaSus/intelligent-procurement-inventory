---
workflowStatus: Draft
totalSteps: 5
stepsCompleted: [1,2,3,4,5]
lastStep: step-05
nextStep: ''
lastSaved: '2026-07-05'
workflowType: 'testarch-test-design'
inputDocuments:
  - _bmad-output/planning-artifacts/epics.md
  - _bmad-output/planning-artifacts/architecture.md
  - _bmad-output/project-context.md
  - docs/SCHEMA.md
---

# Test Design for Architecture: intelligent-procurement-inventory

**Purpose:** Architectural concerns, testability gaps, and NFR requirements covering all 7 epics.

**Date:** 2026-07-05
**Author:** Administrator
**Status:** Draft
**Project:** intelligent-procurement-inventory ("Procurvin")

---

## Executive Summary

**Scope:** Full-stack Next.js 16 application with Prisma/PostgreSQL backend, server actions, Radix UI components, and AI integration (Groq).

**Risk Summary:**
- **Total risks**: 12
- **High-priority (≥6)**: 4 risks requiring immediate mitigation
- **Test effort**: ~85 tests (~2 weeks for 1 QA)

---

## Quick Guide

### 🚨 BLOCKERS

1. **No isolated test database** — Parallel test execution risks data collisions. Provide `DATABASE_URL_TEST` or in-memory SQLite for Vitest.
2. **Server actions coupled to FormData** — API-layer testing requires building FormData objects. Provide a test helper to serialize JSON→FormData.
3. **Session dependency** — All server actions call `getSession()`. Tests need a session mock utility (`lib/__mocks__/auth.ts`).

### ⚠️ HIGH PRIORITY

1. **Soft-delete filtering** — Every query must filter `deleted: false`. Forgetting this returns soft-deleted records. Integration tests must validate this.
2. **camelCase↔snake_case mapping** — Server actions receive camelCase, map to snake_case for Prisma. Mismatches cause silent failures. Add a type-level test for each mapping.
3. **PR status transitions** — DRAFT→REQUESTED→APPROVED→REJECTED|FULFILLED enforced in server actions. Invalid transitions must return errors.

### 📋 INFO ONLY

- **Test stack**: Vitest + @testing-library/react (existing) — no new frameworks needed. Add `superagent` or native `fetch` for API-layer server action tests.
- **Coverage**: ~85 tests across P0-P3, risk-based prioritization
- **Quality gates**: 100% P0 pass required, 95% P1 pass

---

## Risk Assessment

### High-Priority Risks (Score ≥6)

| Risk ID | Category | Description | Probability | Impact | Score | Mitigation | Owner | Timeline |
| ------- | -------- | ----------- | ----------- | ------ | ----- | ---------- | ----- | -------- |
| R-001 | SEC | Unauthenticated access to dashboard routes | 2 | 3 | 6 | Proxy middleware test suite for every PROTECTED_PREFIX route | Dev | Sprint |
| R-002 | DATA | Soft-delete records returned in queries | 3 | 3 | 9 | Integration test every list query filters `deleted: false` | Dev | Sprint |
| R-003 | BUS | Invalid PR status transition accepted | 2 | 3 | 6 | Unit test all status transition rules per action | Dev | Sprint |
| R-004 | DATA | camelCase↔snake_case mapping drift | 3 | 2 | 6 | Type-level test + integration test per mapping function | Dev | Sprint |

### Medium-Priority Risks (Score 3-4)

| Risk ID | Category | Description | Probability | Impact | Score | Mitigation | Owner |
| ------- | -------- | ----------- | ----------- | ------ | ----- | ---------- | ----- |
| R-005 | TECH | Component type enum mismatch (Zod ↔ Prisma) | 2 | 2 | 4 | Shared enum source of truth, test all 9 values | Dev |
| R-006 | PERF | Inventory list pagination with large dataset | 2 | 2 | 4 | Load test with 10k+ records, validate query performance | QA |
| R-007 | SEC | Admin-only actions accessible by TECHNICIAN role | 2 | 3 | 6 | Role-based access integration test per admin action | Dev |

### Low-Priority Risks (Score 1-2)

| Risk ID | Category | Description | Probability | Impact | Score | Action |
| ------- | -------- | ----------- | ----------- | ------ | ----- | ------ |
| R-008 | OPS | SMTP config failure breaks password reset | 1 | 2 | 2 | Monitor |
| R-009 | BUS | AI fallback returns generic stats instead of error | 1 | 1 | 1 | Monitor |

---

## Testability Concerns

### Blockers to Fast Feedback

| Concern | Impact | What Architecture Must Provide | Owner | Timeline |
| ------- | ------ | ------------------------------ | ----- | -------- |
| No test DB isolation | Cannot parallelize tests | `DATABASE_URL_TEST` env or mock Prisma client | Dev | Sprint |
| FormData-only actions | Complex test setup | JSON-to-FormData test helper in `lib/test-utils.ts` | Dev | Sprint |
| Session coupling | Every action test needs auth mock | `lib/__mocks__/auth.ts` with `getSession()` returning test user | Dev | Sprint |

### What Works Well

- ✅ Server actions have clear return shapes `{ success, message, errors }`
- ✅ Zod validation is separated in `lib/validators/`
- ✅ Soft-delete is consistent across entities
- ✅ Prisma schema has proper indexes

---

## Risk Mitigation Plans

### R-002: Soft-delete records returned (Score: 9)

**Mitigation Strategy:**
1. Add `where: { deleted: false }` default to every Prisma `findMany`/`findFirst` in list queries
2. Integration test each list endpoint verifies no soft-deleted records appear
3. Add soft-delete filter to Prisma middleware or shared query helper

**Owner:** Dev
**Timeline:** Sprint
**Status:** Planned
**Verification:** Test suite with soft-deleted seed data asserts exclusion

### R-004: camelCase↔snake_case mapping drift (Score: 6)

**Mitigation Strategy:**
1. Centralize all field mappings in `lib/mappers/`
2. Type-level test ensures all fields map correctly
3. Integration test with real server action validates round-trip

**Owner:** Dev
**Timeline:** Sprint
**Status:** Planned
**Verification:** Mapping test suite passing

---

## Coverage Summary

| Priority | Count | Hours | Level |
| -------- | ----- | ----- | ----- |
| P0 | 25 | 50 | API + Integration |
| P1 | 30 | 30 | API + Component |
| P2 | 20 | 10 | Unit + Component |
| P3 | 10 | 2.5 | Exploratory |
| **Total** | **85** | **92.5** | **~12 days** |

---

## Quality Gate Criteria

- **P0 pass rate**: 100% (no exceptions)
- **P1 pass rate**: ≥95% (waivers required)
- **High-risk (≥6) mitigations**: 100% complete
- **Security scenarios**: 100% coverage
- **Critical paths**: ≥80% coverage

---

## Next Steps

1. Resolve blockers: test DB, FormData helper, session mock
2. Create per-epic test designs (Epics 1-7)
3. Run `bmad-testarch-atdd` for P0 acceptance tests
4. Run `bmad-testarch-automate` for implementation
