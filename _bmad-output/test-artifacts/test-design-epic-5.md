---
workflowStatus: Draft
totalSteps: 5
stepsCompleted: [1,2,3,4,5]
lastStep: step-05
nextStep: ''
lastSaved: '2026-07-05'
---

# Test Design: Epic 5 - Spare Parts Inventory

**Date:** 2026-07-05
**Author:** Administrator
**Status:** Draft

---

## Executive Summary

**Scope:** Spare parts CRUD, stock level indicators, automated replenishment check when component marked NEEDS_REPLACEMENT.

**Risk Summary:**
- Total risks identified: 5
- High-priority risks (≥6): 3
- Critical categories: DATA, BUS

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
| R5-001 | DATA | Low stock threshold incorrect (`quantity <= reorder_point` vs `quantity < reorder_point`) | 3 | 2 | 6 | Unit test: verify `<=` logic matches project-context rule | Dev | Sprint |
| R5-002 | BUS | Replenishment check doesn't fire on NEEDS_REPLACEMENT | 2 | 3 | 6 | Integration test: component status change triggers inventory lookup | Dev | Sprint |
| R5-003 | BUS | Stock depletes below zero (negative quantity) | 2 | 3 | 6 | Integration test: decrement prevents negative | Dev | Sprint |

### Medium-Priority Risks (Score 3-4)

| Risk ID | Category | Description | Probability | Impact | Score | Mitigation | Owner |
| ------- | -------- | ----------- | ----------- | ------ | ----- | ---------- | ----- |
| R5-004 | DATA | component_type link to InventoryItem is missing/null | 2 | 2 | 4 | Unit test: nullable component_type handled | Dev |
| R5-005 | BUS | Stock status filter (all/low/critical/normal) incorrect | 2 | 2 | 4 | Component test: each filter returns correct subset | Dev |

---

## Test Coverage Plan

### P0 (Critical)

| Test ID | Requirement | Test Level | Risk Link | Notes |
| ------- | ----------- | ---------- | --------- | ----- |
| P0-E5-001 | Create spare part with SKU, name, quantity, reorder_point, component_type | API | - | Full CRUD |
| P0-E5-002 | Low stock indicator triggers at `quantity <= reorder_point` | Unit | R5-001 | Threshold logic |
| P0-E5-003 | Critical indicator at `quantity === 0` | Unit | - | Exact zero check |
| P0-E5-004 | Component status → NEEDS_REPLACEMENT triggers inventory check | Integration | R5-002 | Cross-epic flow |
| P0-E5-005 | Stock cannot go negative | Integration | R5-003 | Decrement validation |

### P1 (High)

| Test ID | Requirement | Test Level | Risk Link | Notes |
| ------- | ----------- | ---------- | --------- | ----- |
| P1-E5-001 | Edit inventory item updates audit fields | API | - | updated_at/updated_by |
| P1-E5-002 | Soft-delete sets deleted=true | API | - | Not hard delete |
| P1-E5-003 | Replenishment: "X units in stock" when stock >= 1 | Integration | R5-002 | Positive message |
| P1-E5-004 | Replenishment: "No stock" when stock < 1 | Integration | R5-002 | Out-of-stock message |
| P1-E5-005 | Delete confirmation modal renders | Component | - | Modal pattern |

### P2 (Medium)

| Test ID | Requirement | Test Level | Risk Link | Notes |
| ------- | ----------- | ---------- | ----- | ----- |
| P2-E5-001 | Filter: "Low Stock" returns correct items | Component | R5-005 | |
| P2-E5-002 | Filter: "Critical (0)" returns zero-quantity items | Component | R5-005 | |
| P2-E5-003 | Search by SKU and name works | Component | - | |
| P2-E5-004 | Pagination controls render when pages > 1 | Component | - | |

---

## Entry Criteria

- [ ] Epic 4 component status transitions implemented
- [ ] Inventory server actions implemented

## Exit Criteria

- [ ] All P0 tests passing
- [ ] Low/critical stock indicators correct
- [ ] Replenishment check fires on status change
- [ ] CRUD + soft-delete complete
