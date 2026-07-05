---
stepsCompleted: [preflight, context, generate]
lastStep: generate
lastSaved: '2026-07-05'
workflowType: 'testarch-atdd'
storyId: 'ALL'
storyKey: 'ALL'
inputDocuments:
  - _bmad-output/test-artifacts/test-design-architecture.md
  - _bmad-output/test-artifacts/test-design-epic-1.md
  - _bmad-output/test-artifacts/test-design-epic-2.md
  - _bmad-output/test-artifacts/test-design-epic-3.md
  - _bmad-output/test-artifacts/test-design-epic-4.md
  - _bmad-output/test-artifacts/test-design-epic-5.md
  - _bmad-output/test-artifacts/test-design-epic-6.md
  - _bmad-output/test-artifacts/test-design-epic-7.md
---

# ATDD Checklist - All Epics (1-7)

**Date:** 2026-07-05
**Author:** Administrator
**Primary Test Level:** Integration + Component + Unit

---

## Story Summary

Comprehensive acceptance test-driven development scaffolds covering all 7 epics of the Procurvin lab asset tracking system: schema foundation, room management, computer unit management, component tracking, spare parts inventory, purchase request workflow, and navigation/layout.

---

## Red-Phase Test Scaffolds

### Epic 1: Schema Migration & Foundation

| Test | Level | File | Status |
| ---- | ----- | ---- | ------ |
| Migration creates all 8 tables | Integration | `app/__tests__/epic-1/migration.test.ts` | RED |
| Seed data inserts correct entity counts | Integration | `app/__tests__/epic-1/seed.test.ts` | RED |
| All 4 enums match Prisma values | Unit | `app/__tests__/epic-1/enums.test.ts` | RED |
| Unique constraints enforced | Integration | `app/__tests__/epic-1/constraints.test.ts` | RED |

### Epic 2: Laboratory Room Management

| Test | Level | File | Status |
| ---- | ----- | ---- | ------ |
| Create room with valid name succeeds | API | `app/__tests__/epic-2/rooms.test.ts` | RED |
| Create room with duplicate name fails | API | `app/__tests__/epic-2/rooms.test.ts` | RED |
| Delete room with units returns error | API | `app/__tests__/epic-2/rooms.test.ts` | RED |
| List excludes soft-deleted rooms | API | `app/__tests__/epic-2/rooms.test.ts` | RED |
| Edit room updates audit fields | API | `app/__tests__/epic-2/rooms.test.ts` | RED |

### Epic 3: Computer Unit Management

| Test | Level | File | Status |
| ---- | ----- | ---- | ------ |
| Create unit with valid name+room succeeds | API | `app/__tests__/epic-3/units.test.ts` | RED |
| Duplicate unit_name+room rejected | API | `app/__tests__/epic-3/units.test.ts` | RED |
| Delete cascade removes components | Integration | `app/__tests__/epic-3/units.test.ts` | RED |
| List filters by room correctly | API | `app/__tests__/epic-3/units.test.ts` | RED |

### Epic 4: Computer Component Tracking

| Test | Level | File | Status |
| ---- | ----- | ---- | ------ |
| Add component with unique serial succeeds | API | `app/__tests__/epic-4/components.test.ts` | RED |
| Duplicate serial number rejected | API | `app/__tests__/epic-4/components.test.ts` | RED |
| Status badges render correct colors | Component | `app/__tests__/epic-4/StatusBadge.test.tsx` | RED |
| Dashboard shows accurate counts | API | `app/__tests__/epic-4/dashboard.test.ts` | RED |
| Bulk add creates 1 per ComponentType | API | `app/__tests__/epic-4/components.test.ts` | RED |
| Hard delete (no soft-delete) | API | `app/__tests__/epic-4/components.test.ts` | RED |

### Epic 5: Spare Parts Inventory

| Test | Level | File | Status |
| ---- | ----- | ---- | ------ |
| Create part with SKU, name, qty, reorder_point succeeds | API | `app/__tests__/epic-5/inventory.test.ts` | RED |
| Low stock at `quantity <= reorder_point` | Unit | `app/__tests__/epic-5/stock-logic.test.ts` | RED |
| Critical at `quantity === 0` | Unit | `app/__tests__/epic-5/stock-logic.test.ts` | RED |
| NEEDS_REPLACEMENT triggers inventory check | Integration | `app/__tests__/epic-5/replenishment.test.ts` | RED |
| Stock cannot go negative | Integration | `app/__tests__/epic-5/inventory.test.ts` | RED |
| Soft-delete sets deleted=true | API | `app/__tests__/epic-5/inventory.test.ts` | RED |

### Epic 6: Purchase Request Workflow

| Test | Level | File | Status |
| ---- | ----- | ---- | ------ |
| Create PR as DRAFT with auto-generated PR number | API | `app/__tests__/epic-6/purchase-requests.test.ts` | RED |
| Submit DRAFT→REQUESTED | API | `app/__tests__/epic-6/purchase-requests.test.ts` | RED |
| Approve REQUESTED→APPROVED (admin only) | API | `app/__tests__/epic-6/purchase-requests.test.ts` | RED |
| Reject REQUESTED→REJECTED with reason | API | `app/__tests__/epic-6/purchase-requests.test.ts` | RED |
| Fulfill APPROVED→FULFILLED increments inventory | Integration | `app/__tests__/epic-6/fulfill.test.ts` | RED |
| Illegal transitions rejected | API | `app/__tests__/epic-6/purchase-requests.test.ts` | RED |
| STAFF cannot approve/reject | Integration | `app/__tests__/epic-6/rbac.test.ts` | RED |
| PR number format validation | Unit | `app/__tests__/epic-6/pr-number.test.ts` | RED |

### Epic 7: Navigation & Layout

| Test | Level | File | Status |
| ---- | ----- | ---- | ------ |
| All nav links point to existing routes | Component | `app/__tests__/epic-7/Navigation.test.tsx` | RED |
| Active link highlighted on current page | Component | `app/__tests__/epic-7/Navigation.test.tsx` | RED |
| Sidebar collapses/expands | Component | `app/__tests__/epic-7/Navigation.test.tsx` | RED |
| Dashboard stats show correct aggregates | Integration | `app/__tests__/epic-7/dashboard-stats.test.ts` | RED |
| Bottom nav shows first 5 items | Component | `app/__tests__/epic-7/Navigation.test.tsx` | RED |

---

## Data Factories Needed

### LaboratoryRoom Factory
- `createRoom(overrides?)` - name, created_at, deleted=false
- `createRooms(count)` - batch

### ComputerUnit Factory
- `createUnit(overrides?)` - unit_name, laboratory_room_id, deleted=false

### ComputerComponent Factory
- `createComponent(overrides?)` - computer_unit_id, type, serial_number, specifications, status

### InventoryItem Factory
- `createInventoryItem(overrides?)` - sku, name, quantity, reorder_point, component_type

### PurchaseRequest Factory
- `createPurchaseRequest(overrides?)` - pr_number, status, items[]

---

## Mock Requirements

### Session Mock
- `lib/__mocks__/auth.ts` - `getSession()` returns admin or staff user
- Two variants: ADMIN session, STAFF session

### Prisma Mock (for unit tests)
- Use `vi.mock('@prisma/client')` for isolated unit tests
- Integration tests use real test DB

---

## Required data-testid Attributes

### Navigation
- `nav-sidebar` - Desktop sidebar container
- `nav-bottom` - Mobile bottom navigation
- `nav-link-{route}` - Each nav link (e.g. `nav-link-dashboard`, `nav-link-rooms`)
- `sidebar-toggle` - Collapse/expand button

### Inventory Table
- `stock-badge-{status}` - Stock status badge (ok/low/critical)
- `stock-progress-{id}` - Progress bar per row
- `search-input` - Search field
- `filter-type` - Component type select
- `filter-stock` - Stock status select
- `delete-confirm` - Delete confirmation modal

### PR Status
- `pr-status-{status}` - Status badge (draft/requested/approved/rejected/fulfilled)
- `pr-approve-btn` - Approve button
- `pr-reject-btn` - Reject button
- `pr-fulfill-btn` - Fulfill button

---

## Next Steps

1. **Create data factories** in `lib/__mocks__/` or `app/__tests__/factories/`
2. **Create session mock** in `lib/__mocks__/auth.ts`
3. **Implement P0 test files** for each epic
4. Run `npm test` to verify red-phase failures
5. Implement code to make tests pass (green phase)
6. Run traceability to verify coverage

---

## References

- Test Design Architecture: `_bmad-output/test-artifacts/test-design-architecture.md`
- Per-Epic Test Designs: `_bmad-output/test-artifacts/test-design-epic-{1-7}.md`
- Project Context: `_bmad-output/project-context.md`
- Database Schema: `docs/SCHEMA.md`
