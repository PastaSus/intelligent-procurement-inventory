# Story 8.5: Remove Installed Application

Status: done

### Review Findings (Group 2 review, 2026-09-20) — no findings specific to remove flow; covered by group fixes (deleted-unit guard in removeInstalledApplication applied).

## Story

As a lab technician,
I want to remove an application record,
so that I can account for uninstalled software.

## Acceptance Criteria

1. **Given** user is viewing the software list for a unit
   **When** user clicks "Remove" on an application
   **Then** system shows confirmation dialog: "Remove [app name] from this unit?"

2. **Given** user confirms removal
   **When** dialog is confirmed
   **Then** system permanently deletes the application record
   **And** user sees success toast notification
   **And** software list refreshes

3. **Given** user cancels removal
   **When** dialog is cancelled
   **Then** nothing changes

## Tasks / Subtasks

- [x] Task 1: Add remove handler to server action (AC: 2)
  - [x] `removeInstalledApplication(formData: FormData)` already exists in `app/_actions/software.ts` (shipped in 8-2) — no new code needed, verified present
  - [x] Validates application exists, hard deletes record (child-record pattern, no soft delete)
  - [x] Calls `revalidatePath()` for the unit detail page

- [x] Task 2: Wire up remove button in SoftwareList (AC: 1, 3)
  - [x] `onRemove` callback prop already wired in SoftwareList (8-3)
  - [x] Render confirmation dialog when `removingSoftware` state set: "Remove [app name] from this unit?"
  - [x] Call `removeInstalledApplication` on confirm, success toast + reload
  - [x] Cancel closes dialog with no changes
  - [x] Use `useTransition` for pending state

## Dev Agent Record

### Completion Notes

**Implementation Complete:** Story 8.5 - Remove Installed Application

**All Acceptance Criteria Satisfied:**
- AC1: Remove button shows confirmation dialog with app name
- AC2: Confirm hard-deletes record, success toast, list refreshes
- AC3: Cancel closes dialog, nothing changes

**Files Modified:**
- `app/dashboard/units/[id]/ComponentsClient.tsx` - handleRemoveSoftware + confirm dialog (follows existing deletingComponent modal pattern), useToast import

**Verification:**
- TypeScript: no errors
- ESLint: 0 errors, only pre-existing setComponents warning (both transient software warnings resolved)
- Production build: succeeds

## Dev Notes

### Architecture Patterns to Follow

**Server Action Pattern [Source: architecture.md#API & Communication Patterns]**
- Return format: `{ success: boolean, error?: string }`
- Hard delete for child records (same as ComputerComponent pattern)

**Delete Pattern [Source: project-context.md#Critical Implementation Rules]**
- `ComputerComponent` and `RequestItem` use hard cascade-delete through parent
- `InstalledApplication` follows same pattern — hard delete, no soft delete

**Confirmation Dialog [Source: project-context.md#Form Handling]**
- Use fixed overlay `<div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">`
- Cancel + Delete buttons
- Use `useTransition` for pending state

### Files to Create/Modify

| File | Action | Purpose |
|------|--------|---------|
| `app/_actions/software.ts` | MODIFY | Add removeInstalledApplication |
| `app/dashboard/units/[id]/components/SoftwareList.tsx` | MODIFY | Add remove handler with confirmation |

### Database Requirements

Delete operation:
```typescript
await prisma.installedApplication.delete({
  where: { id: applicationId },
});
```

### Testing Standards

- Test remove button shows confirmation dialog
- Test confirm deletes record
- Test cancel does not delete
- Test list refreshes after deletion

## References

- [Source: sprint-change-proposal-2026-09-20.md] Feature 4, Story 8.6: Remove Installed Application
- [Source: project-context.md#Critical Implementation Rules] Hard delete for child records
- [Source: prd.md#Functional Requirements] FR41: Users can remove application records
