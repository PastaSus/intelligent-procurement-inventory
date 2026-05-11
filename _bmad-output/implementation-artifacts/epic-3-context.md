# Epic 3 Context: Vendor Management

<!-- Compiled from planning artifacts. Edit freely. Regenerate with compile-epic-context if planning docs change. -->

## Goal

Enable users to manage vendor records for purchase order creation. Users can create, view, edit, and delete vendor records with audit trail (timestamps, created/modified by). This is a prerequisite for Epic 4 (Purchase Order Management).

## Stories

- Story 3.1: Vendor Database Schema & Setup
- Story 3.2: Create Vendor Record
- Story 3.3: View Vendor List
- Story 3.4: Edit Vendor Details
- Story 3.5: Delete Vendor Record

## Requirements & Constraints

- **FR7**: Users can create new vendor records
- **FR8**: Users can view vendor information
- **FR9**: Users can edit vendor details
- **FR10**: Users can delete vendor records
- All vendor records support soft delete (deleted=true flag)
- Audit fields (created_at, updated_at, created_by, updated_by) automatically populated
- Vendor page table must be keyboard navigable (WCAG 2.1 AA)
- Zod validation for all form inputs

## Technical Decisions

- **Database**: Vendor model already exists in Prisma schema with: id, name, contact_name, email, phone, address, created_at, updated_at, created_by, updated_by, deleted
- **Pattern**: Follow same pattern as Epic 2 inventory management (Server Actions + Zod validation + shadcn/ui)
- **Naming**: snake_case for DB columns, camelCase for TypeScript
- **Soft delete**: Set deleted=true rather than physical deletion

## UX & Interaction Patterns

- Similar UI patterns to inventory management (tables, forms, toasts)
- Navigation: Vendors page accessible from sidebar/bottom nav
- Forms use same validation and error display patterns
- Delete requires confirmation dialog

## Cross-Story Dependencies

- Story 3.1 must complete before 3.2-3.5
- Epic 3 is a prerequisite for Epic 4 (Purchase Orders require vendor selection)
- No dependencies on other epics

## Previous Epic Continuity

Epic 2 (Inventory) just completed. Patterns to follow:
- Server Actions in `lib/actions/` for mutations
- Zod schemas in `lib/schemas/`
- UI components in `app/dashboard/vendors/components/`
- Page component in `app/dashboard/vendors/page.tsx`