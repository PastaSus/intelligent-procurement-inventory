# Story 2.4: Edit Inventory Item

Status: done

## Story

As a user,
I want to edit existing inventory item details,
So that I can update stock levels and information.

## Acceptance Criteria

1. **Given** user is viewing inventory list
   **When** user clicks "Edit" on an item
   **Then** system displays pre-filled form with current values
   **And** user can modify quantity, reorder point, or details
   **And** updated_by and updated_at are automatically set
   **And** system prevents negative quantities (FR5)

## Tasks / Subtasks

- [x] Task 1: Create EditProductForm component (AC: 1)
  - [x] Created `app/dashboard/inventory/components/EditProductForm.tsx`
  - [x] Pre-filled form with item data
  - [x] SKU field disabled (cannot change)
  - [x] All editable fields: name, description, quantity, reorder_point, category

- [x] Task 2: Create updateInventoryItem Server Action (AC: 1)
  - [x] Created `updateInventoryItem` in `app/_actions/inventory.ts`
  - [x] Validate inputs (name required, quantity >= 0, reorder_point >= 0)
  - [x] Get session for updated_by field
  - [x] Update item via Prisma
  - [x] revalidatePath on success

- [x] Task 3: Add Edit button to table rows (AC: 1)
  - [x] Added "Actions" column with pencil icon button
  - [x] Click opens EditProductForm modal

- [x] Task 4: Wire form to Server Action (AC: 1)
  - [x] Form submits to updateInventoryItem
  - [x] useTransition for pending state
  - [x] Error handling with toast

- [x] Task 5: Add success/error handling (AC: 1)
  - [x] Success toast on update
  - [x] Error toast on failure
  - [x] Form closes on success

- [x] Task 6: Prevent negative quantities (FR5)
  - [x] Form input has min="0"
  - [x] Server validates quantity >= 0
  - [x] Server validates reorder_point >= 0

- [x] Task 7: Build verification (AC: 1)
  - [x] `pnpm build` - compiled successfully
  - [x] TypeScript - no errors

## Implementation Complete

**Date Completed:** 2026-05-10

**Files Created/Modified:**
1. `app/dashboard/inventory/components/EditProductForm.tsx` - Edit modal
2. `app/_actions/inventory.ts` - Added updateInventoryItem
3. `app/dashboard/inventory/InventoryClient.tsx` - Added edit button + state

**Features:**
- Pencil icon button on each row
- Modal with pre-filled form (name, description, quantity, reorder_point, category)
- SKU cannot be changed (disabled field)
- Validates: name required, quantity >= 0, reorder_point >= 0
- Updates updated_by + updated_at automatically
- Success/error toast notifications

**Build Status:**
- ✅ pnpm build - Compiled successfully
- ✅ TypeScript - No errors

**Unblocks:**
- Story 2.5: Delete Inventory Item
- Story 2.6: Low Stock Alerts Display