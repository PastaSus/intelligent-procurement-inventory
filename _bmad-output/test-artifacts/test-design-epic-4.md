---
workflowStatus: Draft
totalSteps: 5
stepsCompleted: [1,2,3,4,5]
lastStep: step-05
nextStep: ''
lastSaved: '2026-07-05'
---

# Test Design: Epic 4 - Computer Component Tracking

**Date:** 2026-07-05
**Author:** Administrator
**Status:** Draft

---

## Executive Summary

**Scope:** Component CRUD per computer unit, bulk add, status dashboard, serial number uniqueness, 9 ComponentType values.

**Risk Summary:**
- Total risks identified: 5
- High-priority risks (≥6): 3
- Critical categories: DATA, SEC

**Coverage Summary:**
- P0 scenarios: 5 (10 hours)
- P1 scenarios: 5 (5 hours)
- P2/P3 scenarios: 4 (2 hours)
- **Total effort**: 17 hours (~2 days)

---

## Risk Assessment

### High-Priority Risks (Score ≥6)

| Risk ID | Category | Description | Probability | Impact | Score | Mitigation | Owner | Timeline |
| ------- | -------- | ----------- | ----------- | ------ | ----- | ---------- | ----- | -------- |
| R4-001 | DATA | Duplicate serial number accepted | 3 | 3 | 9 | Integration test: serial_number unique constraint enforced | Dev | Sprint |
| R4-002 | DATA | Component orphaned when parent unit is deleted | 2 | 3 | 6 | Integration test: cascade delete from unit removes components | Dev | Sprint |
| R4-003 | SEC | Status dashboard exposes component data to STAFF | 2 | 3 | 6 | Integration test: RBAC on dashboard route | Dev | Sprint |

### Medium-Priority Risks (Score 3-4)

| Risk ID | Category | Description | Probability | Impact | Score | Mitigation | Owner |
| ------- | -------- | ----------- | ----------- | ------ | ----- | ---------- | ----- |
| R4-004 | DATA | Invalid ComponentType enum value accepted | 2 | 2 | 4 | Unit test: Zod enum validation | Dev |
| R4-005 | BUS | Bulk add creates components with empty serials but no warning | 2 | 2 | 4 | Component test: UI shows blank serials for manual fill | Dev |

---

## Test Coverage Plan

### P0 (Critical)

| Test ID | Requirement | Test Level | Risk Link | Notes |
| ------- | ----------- | ---------- | --------- | ----- |
| P0-E4-001 | Add component with unique serial succeeds | API | R4-001 | All 9 types |
| P0-E4-002 | Add component with duplicate serial fails | API | R4-001 | Error returned |
| P0-E4-003 | Component list shows type, serial, specs, status badge | Component | - | Verify all fields rendered |
| P0-E4-004 | Status badges: FUNCTIONAL=green, NEEDS_REPAIR=yellow, NEEDS_REPLACEMENT=red | Component | - | Color assertion |
| P0-E4-005 | Dashboard shows total, NEEDS_REPAIR, NEEDS_REPLACEMENT counts | API | R4-003 | Stats endpoint |

### P1 (High)

| Test ID | Requirement | Test Level | Risk Link | Notes |
| ------- | ----------- | ---------- | --------- | ----- |
| P1-E4-001 | Edit component updates specs/status | API | - | Verify changes persist |
| P1-E4-002 | Remove component hard-deletes (no soft-delete) | API | - | deleted field absent |
| P1-E4-003 | Bulk add creates 1 component per ComponentType | API | R4-005 | Count = 9 |
| P1-E4-004 | Dashboard breakdown by type is accurate | API | - | Group by ComponentType |
| P1-E4-005 | Status change to NEEDS_REPLACEMENT triggers replenishment check | API | - | Epic 5 integration |

### P2 (Medium)

| Test ID | Requirement | Test Level | Risk Link | Notes |
| ------- | ----------- | ---------- | ----- | ----- |
| P2-E4-001 | Table is keyboard navigable | Component | - | WCAG 2.1 AA |
| P2-E4-002 | Invalid ComponentType rejected | Unit | R4-004 | Zod validation |
| P2-E4-003 | STAFF cannot delete components | Integration | - | RBAC |
| P2-E4-004 | Empty state shown when no components | Component | - | UX empty state |

---

## Entry Criteria

- [ ] Epic 3 units exist with seed data
- [ ] Component server actions implemented

## Exit Criteria

- [ ] All P0 tests passing
- [ ] All 9 component types supported
- [ ] Serial uniqueness enforced
- [ ] Status dashboard accurate
- [ ] Bulk add working
