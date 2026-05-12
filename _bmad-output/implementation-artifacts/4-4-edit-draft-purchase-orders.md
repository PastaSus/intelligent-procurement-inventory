# Story 4.4: Edit Draft Purchase Orders

**Epic:** Epic 4 - Purchase Order Management
**Status:** done
**Story ID:** 4-4

## Overview

As a user, I want to edit draft purchase orders, so that I can make changes before approval.

## Tasks/Subtasks

- [x] Edit button only visible for DRAFT POs
- [x] Form opens with pre-filled data from selected PO
- [x] All line items loaded with correct quantities and prices
- [x] Save updates PO in database with new timestamps
- [x] Non-DRAFT POs show error if edit attempted
- [x] Deleted vendors rejected with validation error
- [x] Authorization enforced (ADMIN or creator only)

## Dev Agent Record

### Implementation Notes

All functionality was already implemented during Story 4.2 and the subsequent code review fixes:
- `updatePurchaseOrder` server action with authorization check
- `editingPO` prop in `CreatePOForm` for edit mode
- `handleEdit()` in `PurchaseOrdersClient` to open form with PO data
- Edit button conditional on `po.status === 'DRAFT'`
- Vendor deletion validation in transaction
- Permission check: ADMIN or `created_by === session.userId`

### Completion Notes

Story 4.4 is essentially a validation that the edit flow works end-to-end. All components were already built:
- `PurchaseOrdersClient.tsx` handles edit button click and sets `editingPO` state
- `CreatePOForm.tsx` accepts `editingPO` prop and renders form in edit mode
- `updatePurchaseOrder` server action validates authorization and status
- Toast notifications show on success/error

## File List

**Verified:**
- `app/_actions/purchase-orders.ts` — `updatePurchaseOrder` with auth + transaction
- `app/dashboard/purchase-orders/PurchaseOrdersClient.tsx` — edit button + `handleEdit()`
- `app/dashboard/purchase-orders/components/CreatePOForm.tsx` — `editingPO` prop support

## Change Log

| Date | Change |
|------|--------|
| 2026-05-12 | Validated edit flow end-to-end |

## Definition of Done

- [x] Edit button visible only for DRAFT POs
- [x] Form opens with pre-filled data from selected PO
- [x] All line items loaded with correct quantities and prices
- [x] Save updates PO in database with new timestamps
- [x] Non-DRAFT POs show error if edit attempted
- [x] Deleted vendors rejected with validation error
- [x] Authorization enforced (ADMIN or creator only)

---
**Completed:** 2026-05-12
**Verified by:** Developer agent
