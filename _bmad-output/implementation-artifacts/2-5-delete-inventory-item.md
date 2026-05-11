# Story 2.5: Delete Inventory Item (Soft Delete)

Status: done

## Story

As a user,
I want to delete inventory items,
So that I can remove items no longer in use.

## Acceptance Criteria

1. **Given** user is viewing inventory list
   **When** user clicks "Delete" on an item
   **Then** system shows confirmation dialog
   **And** upon confirmation, sets deleted=true (soft delete)
   **And** item no longer appears in inventory list
   **And** audit trail preserves who deleted and when

## Tasks / Subtasks

- [x] Task 1: Create deleteInventoryItem Server Action
  - [x] Added deleteInventoryItem function in `app/_actions/inventory.ts`
  - [x] Validate session (require login)
  - [x] Validate item exists
  - [x] Update item with deleted=true and updated_by
  - [x] Add revalidation

- [x] Task 2: Add Delete button to table rows
  - [x] Added Trash2 icon import
  - [x] Added delete button in Actions column
  - [x] Button triggers confirmation state

- [x] Task 3: Create Confirmation Dialog
  - [x] Added state for item to delete
  - [x] Created confirmation modal with item name
  - [x] Confirm button calls Server Action

- [x] Task 4: Wire form to Server Action
  - [x] useTransition for pending state
  - [x] Error handling with alert
  - [x] Success handling - refresh page

- [x] Task 5: Build verification
  - [x] `pnpm build` - compiled successfully
  - [x] TypeScript - no errors

## Implementation Notes

- Soft delete: set `deleted = true` instead of actual deletion
- Audit: set `updated_by` to current user
- User experience: show item name in confirmation dialog

## Implementation Complete

**Date Completed:** 2026-05-11

**Files Modified:**
1. `app/_actions/inventory.ts` - Added deleteInventoryItem Server Action
2. `app/dashboard/inventory/InventoryClient.tsx` - Added delete button + confirmation modal

**Features:**
- Trash icon button on each row (red on hover)
- Confirmation modal shows item name and SKU
- Soft delete (sets deleted=true, preserves data)
- Audit trail (updated_by set to current user)
- Pending state while deleting
- Page refresh on success

**Build Status:**
- ✅ pnpm build - Compiled successfully
- ✅ TypeScript - No errors

**Unblocks:**
- Story 2.6: Low Stock Alerts Display

---

## Code Review Findings

**Review Date:** 2026-05-11
**Reviewer:** bmad-code-review

### ✅ Verified

- Soft delete (deleted=true)
- Audit trail (updated_by)
- Confirmation modal with item name/SKU
- Double-delete prevention
- Session auth check
- Pending state during deletion

### ⚠️ Issues

| Severity | Issue | Recommendation |
|----------|-------|----------------|
| **Low** | Uses alert() for errors | Use toast instead |

### 🎯 Verdict

**APPROVED** ✅