---
workflowStatus: Draft
totalSteps: 5
stepsCompleted: [1,2,3,4,5]
lastStep: step-05
nextStep: ''
lastSaved: '2026-07-05'
---

# Test Design: Epic 7 - Navigation & Layout Migration

**Date:** 2026-07-05
**Author:** Administrator
**Status:** Draft

---

## Executive Summary

**Scope:** Sidebar navigation, bottom nav, dashboard stats cards, active link highlighting, mobile responsiveness.

**Risk Summary:**
- Total risks identified: 4
- High-priority risks (≥6): 1
- Critical categories: BUS

**Coverage Summary:**
- P0 scenarios: 3 (6 hours)
- P1 scenarios: 4 (4 hours)
- P2/P3 scenarios: 4 (2 hours)
- **Total effort**: 12 hours (~1.5 days)

---

## Risk Assessment

### High-Priority Risks (Score ≥6)

| Risk ID | Category | Description | Probability | Impact | Score | Mitigation | Owner | Timeline |
| ------- | -------- | ----------- | ----------- | ------ | ----- | ---------- | ----- | -------- |
| R7-001 | BUS | Navigation item links to wrong/dead routes | 3 | 3 | 9 | Component test: all hrefs resolve to existing pages | Dev | Sprint |

### Medium-Priority Risks (Score 3-4)

| Risk ID | Category | Description | Probability | Impact | Score | Mitigation | Owner |
| ------- | -------- | ----------- | ----------- | ------ | ----- | ---------- | ----- |
| R7-002 | BUS | Active link not highlighted on sub-routes | 2 | 2 | 4 | Component test: isActiveLink verifies prefix matching | Dev |
| R7-003 | BUS | Dashboard stats cards show incorrect counts | 2 | 2 | 4 | Integration test: stats endpoint returns correct aggregates | Dev |
| R7-004 | OPS | Mobile bottom nav shows Chat (redirects to dashboard) | 2 | 1 | 2 | Component test: Chat item navigates to dashboard on mobile | Dev |

---

## Test Coverage Plan

### P0 (Critical)

| Test ID | Requirement | Test Level | Risk Link | Notes |
| ------- | ----------- | ---------- | --------- | ----- |
| P0-E7-001 | All nav item hrefs point to existing routes | Component | R7-001 | 7 routes verified |
| P0-E7-002 | Active link highlighted on current page | Component | R7-002 | isActiveLink logic test |
| P0-E7-003 | Dashboard stats show: rooms, units, components, issues, low stock | Integration | R7-003 | Stats API |

### P1 (High)

| Test ID | Requirement | Test Level | Risk Link | Notes |
| ------- | ----------- | ---------- | --------- | ----- |
| P1-E7-001 | Sidebar collapses/expands on toggle | Component | - | State toggle |
| P1-E7-002 | Bottom nav shows first 5 items on mobile | Component | - | Responsive |
| P1-E7-003 | Sidebar shows all 7 items on desktop | Component | - | Responsive |
| P1-E7-004 | Logout button works from header | Integration | - | Auth flow |

### P2 (Medium)

| Test ID | Requirement | Test Level | Risk Link | Notes |
| ------- | ----------- | ---------- | ----- | ----- |
| P2-E7-001 | Chat page redirects mobile to dashboard | Component | R7-004 | |
| P2-E7-002 | Sub-route correctly highlighted (e.g. /dashboard/rooms/123) | Component | R7-002 | Prefix match |
| P2-E7-003 | Desktop sidebar uses correct colors (#121212 bg, #402020 active) | Component | - | Visual check |
| P2-E7-004 | Short labels render on small screens | Component | - | sm:hidden pattern |

---

## Entry Criteria

- [ ] All epic implementations deployed
- [ ] Navigation component updated

## Exit Criteria

- [ ] All P0 tests passing
- [ ] All nav links verified
- [ ] Active link highlighting correct
- [ ] Dashboard stats accurate
- [ ] Mobile/desktop responsive behavior correct
