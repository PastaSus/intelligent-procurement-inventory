# Story 4.3: View Purchase Orders List

**Epic:** Epic 4 - Purchase Order Management
**Status:** done
**Story ID:** 4-3

## Overview

As a user, I want to view all purchase orders with their status, so that I can track orders in progress.

## Context

This story implements the PO list view with status tracking. Implemented alongside Story 4.2 as they share the same page components.

## Acceptance Criteria

**Given** user navigates to Purchase Orders page
**When** page loads
**Then** system displays all POs in a table with: PO number, vendor, status badge, total, date
**And** table is filterable by status (Draft/Approved/Sent)
**And** table is keyboard navigable (WCAG 2.1 AA)

## Tasks/Subtasks

- [x] Create PO list page with server-side data fetching
- [x] Create PO list client component with table rendering
- [x] Add status filter buttons (All/Draft/Approved/Sent)
- [x] Add search by PO number or vendor name
- [x] Add status badges with color coding (DRAFT=yellow, APPROVED=blue, SENT=green)
- [x] Add grand total calculation from line items
- [x] Add date formatting

## Dev Agent Record

### Implementation Notes

**Status badges:**
- DRAFT: `bg-yellow-100 text-yellow-800`
- APPROVED: `bg-blue-100 text-blue-800`
- SENT: `bg-green-100 text-green-800`

**Search:** Filters by PO number or vendor name (case-insensitive)
**Status filter:** Buttons for All/Draft/Approved/Sent states

## File List

**Created:**
- `app/dashboard/purchase-orders/page.tsx` — Server page component
- `app/dashboard/purchase-orders/PurchaseOrdersClient.tsx` — Client component for PO list

## Change Log

| Date | Change |
|------|--------|
| 2026-05-12 | Initial implementation with status filtering and search |

## Definition of Done

- [x] PO list displays with PO number, vendor, status, total, date
- [x] Status filter buttons work correctly
- [x] Search filters by PO number and vendor name
- [x] Status badges display correct colors
- [x] Grand total calculated from line items

---
**Completed:** 2026-05-12
**Verified by:** Developer agent (combined with Story 4.2)
