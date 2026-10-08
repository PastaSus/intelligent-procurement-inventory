---
workflowStatus: Draft
totalSteps: 5
stepsCompleted: [1,2,3,4,5]
lastStep: step-05
nextStep: ''
lastSaved: '2026-07-05'
---

# Test Design: Epic 6 - Internal Purchase Request Workflow

**Date:** 2026-07-05
**Author:** Administrator
**Status:** Draft

---

## Executive Summary

**Scope:** Full PR lifecycle: create (draft), submit, approve/reject, fulfill, inventory increment on fulfill.

**Risk Summary:**
- Total risks identified: 5
- High-priority risks (≥6): 3
- Critical categories: BUS, DATA, SEC

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
| R6-001 | BUS | Invalid status transition accepted (e.g. DRAFT→FULFILLED) | 3 | 3 | 9 | Integration test: all illegal transitions return errors | Dev | Sprint |
| R6-002 | DATA | Fulfill doesn't increment inventory quantities | 2 | 3 | 6 | Integration test: PR fulfillment → inventory delta | Dev | Sprint |
| R6-003 | SEC | STAFF can approve/reject PRs (admin-only) | 2 | 3 | 6 | Integration test: RBAC on approve/reject actions | Dev | Sprint |

### Medium-Priority Risks (Score 3-4)

| Risk ID | Category | Description | Probability | Impact | Score | Mitigation | Owner |
| ------- | -------- | ----------- | ----------- | ------ | ----- | ---------- | ----- |
| R6-004 | DATA | PR number format incorrect | 2 | 2 | 4 | Unit test: regex validates PR-YYYYMMDD-XXXX | Dev |
| R6-005 | BUS | DRAFT PR cannot be edited after submit | 2 | 2 | 4 | Integration test: REQUESTED+ status rejects edit | Dev |

---

## Test Coverage Plan

### P0 (Critical)

| Test ID | Requirement | Test Level | Risk Link | Notes |
| ------- | ----------- | ---------- | --------- | ----- |
| P0-E6-001 | Create PR with items → status DRAFT, PR number generated | API | - | Verify format |
| P0-E6-002 | Submit DRAFT → REQUESTED | API | R6-001 | Legal transition |
| P0-E6-003 | Approve REQUESTED → APPROVED (admin only) | API | R6-001, R6-003 | Admin role check |
| P0-E6-004 | Reject REQUESTED → REJECTED, reason stored | API | R6-001 | Notes field updated |
| P0-E6-005 | Fulfill APPROVED → FULFILLED increments inventory | Integration | R6-002 | Prisma transaction |

### P1 (High)

| Test ID | Requirement | Test Level | Risk Link | Notes |
| ------- | ----------- | ---------- | --------- | ----- |
| P1-E6-001 | Illegal transition DRAFT→APPROVED rejected | API | R6-001 | Error returned |
| P1-E6-002 | Illegal transition DRAFT→FULFILLED rejected | API | R6-001 | Error returned |
| P1-E6-003 | PR list filterable by status | API | - | Query param |
| P1-E6-004 | STAFF cannot approve PR | Integration | R6-003 | 403/error |
| P1-E6-005 | RequestItem total auto-calculated when quantity+unitPrice present | Unit | - | Server-side calc |

### P2 (Medium)

| Test ID | Requirement | Test Level | Risk Link | Notes |
| ------- | ----------- | ---------- | ----- | ----- |
| P2-E6-001 | PR number format validation | Unit | R6-004 | Regex |
| P2-E6-002 | Edit DRAFT PR updates fields | API | R6-005 | Allowed |
| P2-E6-003 | Edit APPROVED PR rejected | API | R6-005 | Not allowed |
| P2-E6-004 | Fulfill without items shows warning | Component | - | Edge case |

---

## Entry Criteria

- [ ] Epic 5 spare parts exist for fulfill test
- [ ] PR server actions implemented

## Exit Criteria

- [ ] All P0 tests passing
- [ ] All status transitions enforced
- [ ] RBAC on admin actions
- [ ] Inventory increment on fulfill verified
- [ ] PR number format validated
