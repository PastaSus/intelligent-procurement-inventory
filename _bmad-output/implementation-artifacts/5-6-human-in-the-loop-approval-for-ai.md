---
story_id: 5.6
story_key: 5-6-human-in-the-loop-approval-for-ai
epic_id: 5
epic_title: Dashboard & AI Chat Interface
story_title: Human-in-the-Loop Approval for AI
status: done
created: 2026-05-14
completed: 2026-05-14
---

# Story 5-6: Human-in-the-Loop Approval for AI

## Story Foundation

**User Story:**
As a user,
I want to approve or modify AI suggestions before creating POs,
So that I maintain control over purchasing decisions.

**Acceptance Criteria:**

| Given | When | Then |
|-------|------|------|
| AI provides reorder suggestions | User clicks "Create PO" on a suggestion | PO form opens with pre-filled vendor and line items |
| | | User can modify quantities or items before saving |
| | | System requires explicit user action (no auto-creation - FR20) |

**FRs covered:** FR19, FR20

---

## Developer Context

### Current State

- Story 5-5 complete (AI reorder suggestions)
- "Create PO" button exists on suggestion cards but has no handler
- CreatePOForm exists for manual PO creation
- Vendor API endpoint exists (`/api/vendors`) returning `{ id, name }` array

### Files Created

| File | Description |
|------|-------------|
| `/app/dashboard/chat/AISuggestionPODialog.tsx` | Two-step dialog: vendor selection → pre-filled PO form |

### Files Modified

| File | Description |
|------|-------------|
| `/app/dashboard/chat/FullScreenChat.tsx` | Integrated dialog with selectedSuggestion state |
| `/app/dashboard/purchase-orders/components/CreatePOForm.tsx` | Added `onBack` prop, AI-editable mode |

### Dependencies Needed

- None (uses existing CreatePOForm and vendor API)

### Code Patterns to Follow

- Modal overlay pattern (fixed inset, bg-black/50)
- Two-step UX flow: vendor selection → PO review
- Reuse existing CreatePOForm with prefilledData prop

---

## Implementation Notes

### Key Decisions

- **Two-step flow**: Vendor selection dialog → PO form (more UX-friendly than a single form with vendor dropdown)
- **Lazy vendor loading**: Vendors fetched on demand in dialog component rather than stored in parent state
- **Reuse existing form**: CreatePOForm extended with `onBack` and editable prefilled mode rather than building a separate form
- **Suggestions cleared on success**: After successful PO creation, the approved suggestion is removed from the list (others remain)

### AISuggestionPODialog Component

- Fetches vendors from `/api/vendors` on mount with AbortController cleanup
- Shows vendor selector with loading/error/empty states
- Error state distinguishes API failure (with retry) from empty vendor list (with close button)
- 401 status detected → shows "Session expired" message
- After vendor selection, passes `prefilledData` to CreatePOForm
- Back button returns to vendor selection without losing the suggestion context
- Missing vendor on re-fetch shows error UI instead of silently vanishing

### CreatePOForm Changes

- Added optional `onBack` prop for navigation back to vendor selection
- `isEditing` defaults to `true` when `prefilledData` exists (AI suggestions are always editable)
- `canEdit` simplified to just `isEditing` state
- Added inline unitPrice validation (min $0.01) matching server Zod schema
- Added Back button in header when `onBack` is provided
- All inputs disabled during `isSubmitting` to prevent race conditions

### FullScreenChat Integration

- `selectedSuggestion` state tracks which suggestion's dialog is open
- `handleCreatePO` sets selected suggestion (opens dialog)
- `handlePODialogClose` clears selected suggestion (closes dialog)
- `handlePOSuccess` removes only the approved suggestion, clears selection
- Suggestions cleared on conversation switch

---

## Tasks / Subtasks

- [x] Create `AISuggestionPODialog` component with vendor selection
- [x] Wire vendor selection to CreatePOForm with prefilledData
- [x] Add `onBack` prop to CreatePOForm for vendor re-selection
- [x] Make AI prefilled forms editable by default
- [x] Add inline unitPrice validation ($0.01 minimum)
- [x] Integrate dialog into FullScreenChat
- [x] Handle loading, empty, error states for vendor list
- [x] Handle 401/auth expiration gracefully
- [x] Handle missing vendor on re-fetch
- [x] Add AbortController cleanup on unmount
- [x] Clear suggestions on conversation switch
- [x] Build passes

### Review Findings (patches applied)

- [x] [Review][Patch] `handlePOSuccess` cleared ALL suggestions — now filters only the approved one (FullScreenChat.tsx)
- [x] [Review][Patch] Suggestions persisted on conversation switch — now cleared on switch (FullScreenChat.tsx)
- [x] [Review][Patch] No AbortController on vendor fetch — added cleanup (AISuggestionPODialog.tsx)
- [x] [Review][Patch] 401 produced misleading retry loop — added explicit 401 message (AISuggestionPODialog.tsx)
- [x] [Review][Patch] Missing vendor on re-fetch silently vanished — shows error UI (AISuggestionPODialog.tsx)
- [x] [Review][Patch] `canEdit` redundant expression — simplified (CreatePOForm.tsx)
- [x] [Review][Patch] `unitPrice: 0` guaranteed server rejection — added inline validation (CreatePOForm.tsx)
- [x] [Review][Patch] Fields editable during submission — disabled with isSubmitting (CreatePOForm.tsx)

---

## File List

**New Files:**
- `app/dashboard/chat/AISuggestionPODialog.tsx` - AI suggestion PO dialog

**Modified Files:**
- `app/dashboard/chat/FullScreenChat.tsx` - Dialog integration
- `app/dashboard/purchase-orders/components/CreatePOForm.tsx` - onBack prop, editable mode, validation
- `_bmad-output/implementation-artifacts/sprint-status.yaml` - Status update
