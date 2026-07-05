---
workflowStatus: Draft
totalSteps: 5
stepsCompleted: [1,2,3,4,5]
lastStep: step-05
nextStep: ''
lastSaved: '2026-07-05'
---

# Test Design: Epic 2 - Laboratory Room Management

**Date:** 2026-07-05
**Author:** Administrator
**Status:** Draft

---

## Executive Summary

**Scope:** CRUD operations for LaboratoryRoom entities — create, list, edit, delete (with block-if-has-units).

**Risk Summary:**
- Total risks identified: 4
- High-priority risks (≥6): 2
- Critical categories: DATA, BUS

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
| R2-001 | DATA | Creating room with duplicate name succeeds | 2 | 3 | 6 | Integration test: unique name constraint enforced at DB and server action level | Dev | Sprint |
| R2-002 | BUS | Deleting room with computer units succeeds (data loss) | 2 | 3 | 6 | Integration test: delete blocked when units exist, error returned | Dev | Sprint |

### Medium-Priority Risks (Score 3-4)

| Risk ID | Category | Description | Probability | Impact | Score | Mitigation | Owner |
| ------- | -------- | ----------- | ----------- | ------ | ----- | ---------- | ----- |
| R2-003 | DATA | Soft-deleted room still counted in stats | 3 | 2 | 6 | Integration test: room count excludes deleted | Dev |
| R2-004 | BUS | Room name empty/whitespace accepted | 2 | 2 | 4 | Unit test: Zod validator rejects empty/whitespace names | Dev |

---

## Test Coverage Plan

### P0 (Critical)

| Test ID | Requirement | Test Level | Risk Link | Notes |
| ------- | ----------- | ---------- | --------- | ----- |
| P0-E2-001 | Create room with valid name succeeds, audit fields set | API | R2-001 | Verify created_at, created_by |
| P0-E2-002 | Create room with duplicate name returns error | API | R2-001 | Unique constraint check |
| P0-E2-003 | Delete room with units returns error | API | R2-002 | Error message "Cannot delete room with existing computer units" |
| P0-E2-004 | List shows only active (non-deleted) rooms | API | R2-003 | Soft-delete filter |

### P1 (High)

| Test ID | Requirement | Test Level | Risk Link | Notes |
| ------- | ----------- | ---------- | --------- | ----- |
| P1-E2-001 | Edit room name updates updated_at/updated_by | API | - | Audit field update |
| P1-E2-002 | Delete room without units performs soft-delete | API | R2-002 | deleted=true, not hard delete |
| P1-E2-003 | Room list shows computer unit count | Component | - | Verify count per room |
| P1-E2-004 | Create room with empty/whitespace name fails | Unit | R2-004 | Zod validation |

### P2 (Medium)

| Test ID | Requirement | Test Level | Risk Link | Notes |
| ------- | ----------- | ---------- | ----- | ----- |
| P2-E2-001 | STAFF cannot access admin room delete action | Integration | - | RBAC check |
| P2-E2-002 | Edit with same name succeeds (no-op) | API | - | Idempotent edit |
| P2-E2-003 | Long room name (>255 chars) rejected | Unit | - | Max length validation |

---

## Entry Criteria

- [ ] Epic 1 migration complete and seeded
- [ ] Server actions for rooms implemented

## Exit Criteria

- [ ] All P0 tests passing
- [ ] CRUD validation complete: create, read, update, delete
- [ ] Soft-delete and block-delete verified
