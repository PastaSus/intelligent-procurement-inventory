---
stepsCompleted:
  - step-01-validate-prerequisites
  - step-02-design-epics
  - step-03-create-stories
  - step-04-final-validation
inputDocuments:
  - _bmad-output/planning-artifacts/prd.md
  - _bmad-output/planning-artifacts/architecture.md
  - prisma/schema.prisma
  - docs/SCHEMA.md
---

# intelligent-procurement-inventory - Epic Breakdown

## Overview

This document provides the complete epic and story breakdown for the refactored lab asset tracking system, following panel recommendations to transform from generic procurement/inventory into an institutional laboratory computer asset and component-level tracking system.

## Epics

### Epic 1: Schema Migration & Foundation

Set up the new database schema, drop the old migration, create a fresh migration matching the refactored Prisma schema, and implement seed data.

**Stories:**

#### Story 1.1: Reset Database Migration

As a developer,
I want to drop the old migration and create a fresh initial migration,
So that the database schema matches the new lab asset tracking models exactly.

**Acceptance Criteria:**

**Given** the current database has the old schema (Vendor, PurchaseOrder, POItem, Chat models)
**When** I run `prisma migrate reset` to drop all existing data and migrations
**Then** the old schema is completely removed from the database
**And** `prisma migrate dev --name init` creates a fresh migration
**And** the migration contains exactly: User, PasswordResetToken, LaboratoryRoom, ComputerUnit, ComputerComponent, InventoryItem, PurchaseRequest, RequestItem tables
**And** all enums (Role, ComponentType, ComponentStatus, PurchaseRequestStatus) are created
**And** all unique constraints, indexes, and foreign keys from schema.prisma are applied

#### Story 1.2: Seed Data

As a developer,
I want seed data for development and testing,
So that the system has realistic starting data.

**Acceptance Criteria:**

**Given** the database is empty after migration
**When** `prisma db seed` runs
**Then** seed creates: 2 users (admin@example.com, staff@example.com)
**And** 2-3 laboratory rooms (e.g., "Laboratory 127A", "Laboratory 127B")
**And** 3-5 computer units per room with unit names (e.g., "LR1U01", "LR1U02")
**And** each computer unit has components for all 9 ComponentTypes with serial numbers
**And** 5-10 spare parts in InventoryItem (replacement keyboards, RAM sticks, etc.)
**And** some components have NEEDS_REPAIR or NEEDS_REPLACEMENT status for testing

### Epic 2: Laboratory Room Management

CRUD for laboratory rooms where computer units are located.

**Stories:**

#### Story 2.1: Create Laboratory Room

As a lab technician,
I want to create a new laboratory room,
So that I can organize computer units by physical location.

**Acceptance Criteria:**

**Given** user is on Laboratory Rooms page
**When** user clicks "Add Room" and enters a room name (e.g., "Laboratory 127A")
**Then** system validates the room name is unique and not empty
**And** room is saved to database with audit fields
**And** user sees success toast notification

#### Story 2.2: View Laboratory Rooms List

As a lab technician,
I want to view all laboratory rooms,
So that I can see which rooms are tracked in the system.

**Acceptance Criteria:**

**Given** user navigates to Laboratory Rooms page
**When** page loads
**Then** system displays all active rooms in a table/card layout
**And** each room shows its name and computer unit count

#### Story 2.3: Edit Laboratory Room

As a lab technician,
I want to edit a laboratory room name,
So that I can correct room names or update them.

**Acceptance Criteria:**

**Given** user is viewing the rooms list
**When** user clicks "Edit" on a room
**Then** system displays pre-filled form with current name
**And** user can modify the room name
**And** updated_at and updated_by are automatically set

#### Story 2.4: Delete Laboratory Room (Block if has units)

As a lab technician,
I want to delete a laboratory room,
So that I can remove rooms no longer in use.

**Acceptance Criteria:**

**Given** user is viewing the rooms list
**When** user clicks "Delete" on a room
**Then** if the room has computer units, system displays error: "Cannot delete room with existing computer units"
**And** if the room has no units, system shows confirmation dialog
**And** upon confirmation, sets deleted=true (soft delete)

### Epic 3: Computer Unit Management

Manage individual computer units within laboratory rooms.

**Stories:**

#### Story 3.1: Create Computer Unit

As a lab technician,
I want to create a computer unit in a specific laboratory room,
So that I can track individual machines.

**Acceptance Criteria:**

**Given** user is on a laboratory room's detail page or Computer Units page
**When** user clicks "Add Unit" and enters unit name (e.g., "LR1U01") and selects laboratory room
**Then** system validates unit_name + laboratory_room_id combination is unique
**And** unit is saved to database with audit fields
**And** user sees success toast notification

#### Story 3.2: View Computer Units List

As a lab technician,
I want to view all computer units optionally filtered by room,
So that I can see which units exist in each location.

**Acceptance Criteria:**

**Given** user navigates to Computer Units page
**When** page loads
**Then** system displays all active units in a table
**And** table shows: unit name, laboratory room, component count
**And** user can filter by laboratory room

#### Story 3.3: Edit Computer Unit

As a lab technician,
I want to edit a computer unit's name or assigned room,
So that I can correct unit information.

**Acceptance Criteria:**

**Given** user is viewing the units list
**When** user clicks "Edit" on a unit
**Then** system displays pre-filled form with current values
**And** user can modify unit name and laboratory room
**And** uniqueness constraint is enforced on save
**And** updated_at and updated_by are automatically set

#### Story 3.4: Delete Computer Unit (Cascade)

As a lab technician,
I want to delete a computer unit,
So that I can remove decommissioned machines.

**Acceptance Criteria:**

**Given** user is viewing the units list
**When** user clicks "Delete" on a unit
**Then** system shows confirmation dialog warning that all associated components will also be deleted
**And** upon confirmation, unit and all its components are cascade-deleted
**And** user sees success toast notification

### Epic 4: Computer Component Tracking

Track every individual hardware component with serial numbers, specifications, and functional status.

**Stories:**

#### Story 4.1: Add Component to Computer Unit

As a lab technician,
I want to add a component to a computer unit,
So that I can build a complete hardware inventory per machine.

**Acceptance Criteria:**

**Given** user is viewing a computer unit's detail page
**When** user clicks "Add Component" and fills in: type (dropdown from ComponentType), serial number, specifications, status
**Then** system validates serial number is unique across all components
**And** component is saved to database with audit fields
**And** user sees success toast notification

#### Story 4.2: View Components by Computer Unit

As a lab technician,
I want to view all components for a specific computer unit,
So that I can see a complete hardware profile of each machine.

**Acceptance Criteria:**

**Given** user navigates to a computer unit's detail page
**When** page loads
**Then** system displays all components in a table grouped by type
**And** table shows: type, serial number, specifications, status badge (color-coded)
**And** status badges are: green for FUNCTIONAL, yellow for NEEDS_REPAIR, red for NEEDS_REPLACEMENT
**And** table is keyboard navigable (WCAG 2.1 AA)

#### Story 4.3: Edit Component

As a lab technician,
I want to edit a component's specifications or status,
So that I can update information after diagnosis or repair.

**Acceptance Criteria:**

**Given** user is viewing a component list
**When** user clicks "Edit" on a component
**Then** system displays pre-filled form with current values
**And** user can modify: type, serial number, specifications, status
**And** serial number uniqueness is checked on save
**And** when status changes to NEEDS_REPLACEMENT, system checks spare parts inventory (see Epic 5)

#### Story 4.4: Remove Component

As a lab technician,
I want to remove a component from a computer unit,
So that I can account for physically removed hardware.

**Acceptance Criteria:**

**Given** user is viewing a component list
**When** user clicks "Remove" on a component
**Then** system shows confirmation dialog
**And** upon confirmation, component is permanently deleted (physical removal, no soft delete)
**And** user sees success toast notification

#### Story 4.5: Bulk Add Components

As a lab technician,
I want to add all standard components to a computer unit at once,
So that I can quickly set up a new machine's profile.

**Acceptance Criteria:**

**Given** user is creating a new computer unit or viewing an empty unit
**When** user clicks "Auto-populate Components"
**Then** system creates one component entry for each ComponentType with blank serial numbers and specifications
**And** user can then edit each component to fill in actual serial numbers and specs

#### Story 4.6: Component Status Dashboard

As a lab manager,
I want a dashboard showing component health summary across all rooms and units,
So that I can quickly identify maintenance needs.

**Acceptance Criteria:**

**Given** user navigates to Components Dashboard
**When** page loads
**Then** system shows: total components count, count NEEDS_REPAIR, count NEEDS_REPLACEMENT
**And** breakdown by ComponentType ("5 keyboards need replacement")
**And** breakdown by LaboratoryRoom ("Room 127A: 3 units with issues")
**And** counts are actionable — clicking opens filtered component list

### Epic 5: Spare Parts Inventory

Manage spare parts stock levels with automated replenishment suggestions triggered by component status changes.

**Stories:**

#### Story 5.1: Spare Parts CRUD

As a lab technician,
I want to manage spare parts inventory,
So that I know what replacement parts are available.

**Acceptance Criteria:**

**Given** user navigates to Spare Parts (Inventory) page
**When** user creates/edits/deletes a spare part
**Then** each spare part has: sku, name, description, quantity, reorder_point, component_type (links to ComponentType enum)
**And** standard CRUD operations work with server actions and toast notifications

#### Story 5.2: View Spare Parts Stock Levels

As a lab technician,
I want to view current stock levels with low stock alerts,
So that I know when to request more parts.

**Acceptance Criteria:**

**Given** user navigates to Spare Parts page
**When** page loads
**Then** system displays all spare parts with quantity and reorder point
**And** items where quantity < reorder_point are highlighted with color-coded indicators
**And** low stock count is displayed at the top

#### Story 5.3: Automated Replenishment Check

As a lab technician,
I want the system to automatically check spare parts stock when a component is marked NEEDS_REPLACEMENT,
So that I know if replacements are in stock or need to be requested.

**Acceptance Criteria:**

**Given** a ComputerComponent's status changes to NEEDS_REPLACEMENT
**When** the change is saved
**Then** system queries InventoryItem where component_type matches
**And** if stock >= 1, displays: "X units in stock — allocate from spare parts"
**And** if stock < 1, displays: "No stock — create purchase request for [quantity needed]"
**And** if stock > 0 but < quantity_needed, displays: "X units in stock, need Y more — create partial purchase request"

### Epic 6: Internal Purchase Request Workflow

End-to-end internal procurement workflow from draft to fulfilled, replacing the old vendor-based PO system.

**Stories:**

#### Story 6.1: Create Purchase Request

As a lab technician,
I want to create an internal purchase request for spare parts,
So that I can request replacement components that are out of stock.

**Acceptance Criteria:**

**Given** user is on Purchase Requests page or triggered from replenishment check
**When** user fills in items (item name, quantity, optional estimated price)
**Then** system generates a unique PR number automatically
**And** status is set to DRAFT
**And** user can save as draft or submit for approval

#### Story 6.2: View Purchase Requests List

As a lab technician or manager,
I want to view all purchase requests with their status,
So that I can track procurement status.

**Acceptance Criteria:**

**Given** user navigates to Purchase Requests page
**When** page loads
**Then** system displays all requests in a table with: PR number, status badge (color-coded), item count, total estimated cost, date
**And** user can filter by status (DRAFT, REQUESTED, APPROVED, REJECTED, FULFILLED)

#### Story 6.3: Submit Purchase Request for Approval

As a lab technician,
I want to submit a draft purchase request for approval,
So that my request moves to the approval queue.

**Acceptance Criteria:**

**Given** user is viewing a DRAFT purchase request
**When** user clicks "Submit for Approval"
**Then** system changes status from DRAFT to REQUESTED
**And** updated_at and updated_by are set
**And** user sees success toast notification

#### Story 6.4: Approve / Reject Purchase Request

As a lab manager,
I want to approve or reject submitted purchase requests,
So that I control procurement decisions.

**Acceptance Criteria:**

**Given** user is viewing a REQUESTED purchase request
**When** user clicks "Approve"
**Then** system changes status to APPROVED
**And** user sees success toast notification
**When** user clicks "Reject" and optionally enters a reason
**Then** system changes status to REJECTED
**And** reason is stored in notes field

#### Story 6.5: Fulfill Purchase Request

As a lab technician,
I want to mark an approved purchase request as fulfilled,
So that the procurement cycle is complete.

**Acceptance Criteria:**

**Given** user is viewing an APPROVED purchase request
**When** user clicks "Mark Fulfilled"
**Then** system changes status to FULFILLED
**And** the corresponding InventoryItem quantities are optionally incremented
**And** user sees success toast notification

### Epic 7: Navigation & Layout Migration

Update existing navigation, sidebar, and routing to reflect the new domain structure.

**Stories:**

#### Story 7.1: Updated Navigation Structure

As a user,
I want the navigation to reflect the new lab asset tracking domain,
So that I can access all new features.

**Acceptance Criteria:**

**Given** user is logged in
**When** user views the sidebar or bottom navigation
**Then** navigation items show: Dashboard, Rooms, Units, Components, Spare Parts, Purchase Requests
**And** old items (Vendors, Inventory) are removed or renamed
**And** active item is highlighted

#### Story 7.2: Update Existing Dashboard

As a user,
I want the dashboard to show lab asset metrics,
So that I can get a quick overview of the system.

**Acceptance Criteria:**

**Given** user navigates to Dashboard
**When** page loads
**Then** stats cards show: total rooms, total units, total components, components needing repair/replacement, low stock spare parts
**And** existing dashboard layout components are reused where applicable

<!-- End stories -->
