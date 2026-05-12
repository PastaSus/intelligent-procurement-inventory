# Epic 4 Context: Purchase Order Management

## Goal

End-to-end purchase order workflow with status tracking. Users can create POs (manually or with pre-filled AI data), edit drafts, approve, and export as email-ready messages with status tracking (Draft → Approved → Sent).

## Stories

- Story 4.1: Purchase Order Database Schema & Setup (DONE)
- Story 4.2: Create Purchase Order
- Story 4.3: View Purchase Orders List
- Story 4.4: Edit Draft Purchase Orders
- Story 4.5: Approve Purchase Order
- Story 4.6: Export Purchase Order

## Requirements & Constraints

- **FR11**: Users can create purchase orders
- **FR12**: Users can view existing purchase orders
- **FR13**: Users can edit draft purchase orders
- **FR14**: Users can approve purchase orders
- **FR15**: Users can export purchase orders
- **FR16**: System tracks purchase order status (Draft → Approved → Sent)
- POs must be linked to a Vendor (FR7-10 from Epic 3)
- Only Draft POs can be edited
- Audit fields (created_at, updated_at, created_by, updated_by) automatically populated
- Zod validation for all form inputs

## Technical Decisions

- **Database**: PurchaseOrder + POItem models already exist in Prisma schema
- **Pattern**: Follow same pattern as Epic 2/3 (Server Actions + Zod validation + shadcn/ui)
- **PO Number**: Auto-generated unique identifier (format: `PO-{YYYYMMDD}-{SEQ}`)
- **Status Flow**: DRAFT → APPROVED → SENT (no reversing once approved)
- **Naming**: snake_case for DB columns, camelCase for TypeScript

## UX & Interaction Patterns

- Similar UI patterns to inventory/vendors (tables, forms, toasts)
- Status badges: Draft (yellow), Approved (blue), Sent (green)
- PO creation form: Vendor selector + dynamic line item table
- Export generates copyable text/email format

## Cross-Story Dependencies

- Story 4.1 must complete before 4.2-4.6
- Story 4.2 (Create PO) is prerequisite for all other stories
- Epic 3 (Vendor Management) is a prerequisite (vendor selection required)

## Previous Epic Continuity

Epics 2 and 3 just completed. Patterns to follow:
- Server Actions in `lib/actions/`
- Zod schemas in `lib/schemas/`
- UI components in `app/dashboard/purchase-orders/components/`
- Page component in `app/dashboard/purchase-orders/page.tsx`
