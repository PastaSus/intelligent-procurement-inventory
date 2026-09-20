# Story 8.4: Edit Installed Application

Status: done

## Story

As a lab technician,
I want to edit application details,
so that I can update version numbers or license information.

## Acceptance Criteria

1. **Given** user is viewing the software list for a unit
   **When** user clicks "Edit" on an application
   **Then** system displays pre-filled form with current values

2. **Given** user modifies application fields
   **When** user clicks "Save"
   **Then** system updates the record
   **And** `updated_at` is automatically set
   **And** user sees success toast notification
   **And** software list refreshes

3. **Given** user clears the required name field
   **When** user clicks "Save"
   **Then** system displays validation error

## Tasks / Subtasks

- [x] Task 1: Create EditSoftwareForm client component (AC: 1, 2, 3)
  - [x] Create `app/dashboard/units/[id]/components/EditSoftwareForm.tsx`
  - [x] Modal with pre-filled fields: name, version, licenseKey, licenseType, installDate
  - [x] Use shadcn/ui components
  - [x] `useTransition` for pending state

- [x] Task 2: Add edit handler to server action (AC: 2)
  - [x] `updateInstalledApplication(formData: FormData)` already exists in `app/_actions/software.ts` (shipped in 8-2) — no new code needed, verified present
  - [x] Validates input with Zod schema, updates record by id
  - [x] Calls `revalidatePath()` for the unit detail page

- [x] Task 3: Wire up edit button in SoftwareList (AC: 1)
  - [x] `onEdit` callback prop already wired in SoftwareList (8-3)
  - [x] Render `EditSoftwareForm` when `editingSoftware` state set
  - [x] Clear state on success/close via shared `handleSuccess`

### Review Findings (Group 2 review, 2026-09-20) — all resolved

- [x] [Review][Patch] Use UTC getters in toDateInputValue to avoid timezone day-shift [app/dashboard/units/[id]/components/EditSoftwareForm.tsx]
- [x] [Review][Patch] Empty-name edit silently succeeds (AC3) — fixed via update empty-field semantics in software.ts (see 8-2 findings)

## Dev Agent Record

### Completion Notes

**Implementation Complete:** Story 8.4 - Edit Installed Application

**All Acceptance Criteria Satisfied:**
- AC1: Edit button opens pre-filled modal (all fields populated, date converted to YYYY-MM-DD input format)
- AC2: Save updates record, `updated_at` auto-set by Prisma, success toast, list refreshes
- AC3: Cleared name blocked by HTML required + Zod min(1), error toast on failure

**Files Created:**
- `app/dashboard/units/[id]/components/EditSoftwareForm.tsx` - Pre-filled edit modal

**Files Modified:**
- `app/dashboard/units/[id]/ComponentsClient.tsx` - Render EditSoftwareForm on editingSoftware state, clear state in handleSuccess

**Verification:**
- TypeScript: no errors
- ESLint: 0 errors (1 transient warning for removingSoftware, lands in 8-5)
- Production build: succeeds

## Dev Notes

### Architecture Patterns to Follow

**Server Action Pattern [Source: architecture.md#API & Communication Patterns]**
- Return format: `{ success: boolean, error?: string }`
- PATCH-style updates: use `.partial()` on Zod schema

**Component Pattern [Source: architecture.md#Frontend Architecture]**
- EditSoftwareForm: Client Component
- Modal pattern: fixed overlay with card

**Validation Pattern [Source: project-context.md#Critical Implementation Rules]**
- Use `.trim().max()` on string fields
- Nullable fields: use `?? undefined` (NOT `?? null`)

### Files to Create/Modify

| File | Action | Purpose |
|------|--------|---------|
| `app/dashboard/units/[id]/components/EditSoftwareForm.tsx` | NEW | Edit software modal |
| `app/_actions/software.ts` | MODIFY | Add updateInstalledApplication |
| `app/dashboard/units/[id]/components/SoftwareList.tsx` | MODIFY | Add edit button handler |

### Database Requirements

Update operation:
```typescript
await prisma.installedApplication.update({
  where: { id: applicationId },
  data: {
    name: validated.name,
    version: validated.version ?? undefined,
    license_key: validated.licenseKey ?? undefined,
    license_type: validated.licenseType,
    install_date: validated.installDate ?? undefined,
  },
});
```

### Testing Standards

- Test edit button opens modal with pre-filled data
- Test successful save updates record
- Test empty name shows validation error
- Test cancel does not change anything

## References

- [Source: sprint-change-proposal-2026-09-20.md] Feature 4, Story 8.5: Edit Installed Application
- [Source: project-context.md#Critical Implementation Rules] PATCH-style updates, nullable fields
- [Source: prd.md#Functional Requirements] FR40: Users can edit application details
