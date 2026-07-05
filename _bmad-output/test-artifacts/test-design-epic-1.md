---
workflowStatus: Draft
totalSteps: 5
stepsCompleted: [1,2,3,4,5]
lastStep: step-05
nextStep: ''
lastSaved: '2026-07-05'
---

# Test Design: Epic 1 - Schema Migration & Foundation

**Date:** 2026-07-05
**Author:** Administrator
**Status:** Draft

---

## Executive Summary

**Scope:** Database schema migration, seed data integrity, and foundational model validation.

**Risk Summary:**
- Total risks identified: 4
- High-priority risks (≥6): 2
- Critical categories: DATA, OPS

**Coverage Summary:**
- P0 scenarios: 5 (10 hours)
- P1 scenarios: 4 (4 hours)
- P2/P3 scenarios: 3 (1.5 hours)
- **Total effort**: 15.5 hours (~2 days)

---

## Risk Assessment

### High-Priority Risks (Score ≥6)

| Risk ID | Category | Description | Probability | Impact | Score | Mitigation | Owner | Timeline |
| ------- | -------- | ----------- | ----------- | ------ | ----- | ---------- | ----- | -------- |
| R1-001 | DATA | Migration misses indexes/constraints from schema.prisma | 2 | 3 | 6 | Verify migration SQL contains all unique constraints, FKs, indexes | Dev | Sprint |
| R1-002 | DATA | Seed data violates unique constraints or has incorrect FKs | 3 | 3 | 9 | Integration test seed script execution + data integrity checks | Dev | Sprint |

### Medium-Priority Risks (Score 3-4)

| Risk ID | Category | Description | Probability | Impact | Score | Mitigation | Owner |
| ------- | -------- | ----------- | ----------- | ------ | ----- | ---------- | ----- |
| R1-003 | OPS | prisma migrate reset fails in CI | 2 | 2 | 4 | CI pipeline test for clean migrate+seed | Dev |

### Low-Priority Risks (Score 1-2)

| Risk ID | Category | Description | Probability | Impact | Score | Action |
| ------- | -------- | ----------- | ----------- | ------ | ----- | ------ |
| R1-004 | OPS | Seed admin email changed without updating docs | 1 | 1 | 1 | Monitor |

---

## Entry Criteria

- [ ] Prisma schema is final and migrated
- [ ] Test database accessible

## Exit Criteria

- [ ] All P0 tests passing
- [ ] Seed data verified for all tables
- [ ] No schema drift between prisma schema and database

---

## Test Coverage Plan

### P0 (Critical)

| Test ID | Requirement | Test Level | Risk Link | Notes |
| ------- | ----------- | ---------- | --------- | ----- |
| P0-E1-001 | Migration creates all 8 tables | Integration | R1-001 | Query information_schema |
| P0-E1-002 | All unique constraints and indexes exist | Integration | R1-001 | Verify per model |
| P0-E1-003 | All 4 enums created with correct values | Unit | R1-001 | Compare to Prisma enum |
| P0-E1-004 | Seed script inserts 2 users, 2-3 rooms, 3-5 units per room, components for all 9 types, 5-10 spare parts | Integration | R1-002 | Verify count per entity |
| P0-E1-005 | Seed data FK references are valid | Integration | R1-002 | Cross-entity FK checks |

### P1 (High)

| Test ID | Requirement | Test Level | Risk Link | Notes |
| ------- | ----------- | ---------- | --------- | ----- |
| P1-E1-001 | Some components seeded as NEEDS_REPAIR/NEEDS_REPLACEMENT | Integration | R1-002 | Status enum test |
| P1-E1-002 | Cascade delete ComputerUnit removes ComputerComponents | Integration | R1-002 | Verify cascade behavior |
| P1-E1-003 | Seed is idempotent (can run twice) | Integration | R1-002 | deleteMany then insert pattern |
| P1-E1-004 | Unit names follow LR{U} pattern | Unit | R1-002 | Validate naming convention |

### P2 (Medium)

| Test ID | Requirement | Test Level | Risk Link | Notes |
| ------- | ----------- | ---------- | --------- | ----- |
| P2-E1-001 | Migration rollback works | Integration | R1-001 | migrate down test |
| P2-E1-002 | Empty database after reset | Integration | R1-001 | Verify 0 rows post-reset |
| P2-E1-003 | Serial number uniqueness across all components | Integration | - | Unique constraint validation |

---

## Execution Order

### Smoke Tests (<2 min)

- [ ] Migration creates tables (30s)
- [ ] Seed inserts users (30s)
- [ ] All enums created (30s)

### P0 Tests (<5 min)

- [ ] Full schema integrity check (2min)
- [ ] Seed data completeness (2min)

### P1 Tests (<10 min)

- [ ] Cascade behavior (3min)
- [ ] Idempotent seed (2min)

---

## Mitigation Plans

### R1-002: Seed data constraint violations (Score: 9)

**Mitigation Strategy:** Integration test that runs seed against a clean test DB, then queries each entity for expected counts and FK validity. Run in CI on every schema change.

**Owner:** Dev
**Status:** Planned
**Verification:** Test passes with no constraint violations
