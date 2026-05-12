# Story 4.5: Approve Purchase Order

**Epic:** Epic 4 - Purchase Order Management
**Status:** done
**Story ID:** 4-5

## Overview

As a user, I want to approve purchase orders, so that they can be sent to vendors.

## Tasks/Subtasks

- [x] Approve button visible only for DRAFT POs and ADMIN role
- [x] Confirmation dialog before approval
- [x] Status changes from DRAFT to APPROVED
- [x] Success toast notification on approval
- [x] Status badge updates immediately
- [x] Audit trail updated (updated_by, updated_at)
- [x] Only ADMIN role can approve

## Dev Agent Record

### Implementation Notes

Implemented during Story 4.2 and code review fixes:
- `approvePurchaseOrder` server action with ADMIN check
- Approve button (Check icon) in `PurchaseOrdersClient` for DRAFT POs
- Confirmation dialog before action
- Status badge updates immediately via `router.refresh()`
- Toast notification on success/error
- All operations wrapped in `$transaction`

### Completion Notes

Approve flow complete:
- Server action validates ADMIN role + DRAFT status
- UI button conditional on `po.status === 'DRAFT' && userRole === 'ADMIN'`
- Confirmation dialog with clear warning about non-reversible action
- `router.refresh()` updates UI after approval
- Toast notification confirms action

## File List

**Verified:**
- `app/_actions/purchase-orders.ts` — `approvePurchaseOrder` server action
- `app/dashboard/purchase-orders/PurchaseOrdersClient.tsx` — Approve button + confirmation dialog

## Change Log

| Date | Change |
|------|--------|
| 2026-05-12 | Validated approve flow end-to-end |

## Definition of Done

- [x] Approve button visible only for DRAFT POs and ADMIN role
- [x] Confirmation dialog before approval
- [x] Status changes from DRAFT to APPROVED
- [x] Success toast notification on approval
- [x] Status badge updates immediately
- [x] Audit trail updated (updated_by, updated_at)
- [x] Only ADMIN role can approve

---
**Completed:** 2026-05-12
**Verified by:** Developer agent
