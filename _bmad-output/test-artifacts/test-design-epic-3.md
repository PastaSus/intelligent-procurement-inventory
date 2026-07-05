---
workflowStatus: Draft
totalSteps: 5
stepsCompleted: [1,2,3,4,5]
lastStep: step-05
nextStep: ''
lastSaved: '2026-07-05'
---

# Test Design: Epic 3 - Computer Unit Management

**Date:** 2026-07-05
**Author:** Administrator
**Status:** Draft

---

## Executive Summary

**Scope:** CRUD for ComputerUnit within LaboratoryRoom — create, list, edit, delete with cascade.

**Risk Summary:**
- Total risks identified: 4
- High-priority risks (≥6): 2
- Critical categories: DATA

**Coverage Summary:**
- P0 scenarios: 4 (8 hours)
- P1 scenarios: 4 (4 hours)
- P2/P3 scenarios: 3 (1.5 hours)
- **Total effort**: 13.5 hours (~2 days)

---

## Risk Assessment

### High-Priority Risks (Score ≥6)

| Risk ID | Category | Description | Probability | Impact | Score | Mitigation | Owner | Timeline |
| ------- | -------- | ----------- | ----------- | ------ | ----- | ---------- | ----- | -------- |
| R3-001 | DATA | Duplicate unit_name + laboratory_room_id accepted | 2 | 3 | 6 | Integration test: unique composite constraint enforced | Dev | Sprint |
| R3-002 | DATA | Delete unit cascade-deletes components but orphaned references remain | 2 | 3 | 6 | Integration test: verify components deleted after unit delete | Dev | Sprint |

### Medium-Priority Risks (Score 3-4)

| Risk ID | Category | Description | Probability | Impact | Score | Mitigation | Owner |
| ------- | -------- | ----------- | ----------- | ------ | ----- | ---------- | ----- |
| R3-003 | BUS | Unit assigned to non-existent room | 2 | 2 | 4 | Unit test: FK constraint enforced | Dev |
| R3-004 | DATA | Soft-deleted unit shown in room unit count | 3 | 2 | 6 | Integration test: count excludes deleted | Dev |

---

## Test Coverage Plan

### P0 (Critical)

| Test ID | Requirement | Test Level | Risk Link | Notes |
| ------- | ----------- | ---------- | --------- | ----- |
| P0-E3-001 | Create unit with valid name + room succeeds | API | R3-001 | Composite unique check |
| P0-E3-002 | Create unit with duplicate name+room fails | API | R3-001 | Error returned |
| P0-E3-003 | Delete unit cascade-deletes all components | API | R3-002 | Verify component table |
| P0-E3-004 | List units filters by room correctly | API | - | Query param filter |

### P1 (High)

| Test ID | Requirement | Test Level | Risk Link | Notes |
| ------- | ----------- | ---------- | --------- | ----- |
| P1-E3-001 | Edit unit name/room updates audit fields | API | - | updated_at/updated_by |
| P1-E3-002 | Unit list shows component count | Component | - | Per-unit count |
| P1-E3-003 | Delete confirmation warning mentions component cascade | Component | - | UX test |
| P1-E3-004 | Room dropdown shows only active rooms | Component | - | Soft-delete filter |

### P2 (Medium)

| Test ID | Requirement | Test Level | Risk Link | Notes |
| ------- | ----------- | ---------- | ----- | ----- |
| P2-E3-001 | Create unit with empty name fails | Unit | - | Zod validation |
| P2-E3-002 | STAFF cannot delete units | Integration | - | RBAC |
| P2-E3-003 | Unit count per room is accurate after soft-delete | Integration | R3-004 | |

---

## Entry Criteria

- [ ] Epic 2 rooms exist
- [ ] Server actions for units implemented

## Exit Criteria

- [ ] All P0 tests passing
- [ ] CRUD + cascade delete verified
- [ ] Composite unique constraint enforced
