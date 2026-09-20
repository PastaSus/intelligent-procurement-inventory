# Story 8.4: Edit Installed Application

Status: ready-for-dev

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

- [ ] Task 1: Create EditSoftwareForm client component (AC: 1, 2, 3)
  - [ ] Create `app/dashboard/units/[id]/components/EditSoftwareForm.tsx`
  - [ ] Modal with pre-filled fields: name, version, licenseKey, licenseType, installDate
  - [ ] Use shadcn/ui components
  - [ ] `useTransition` for pending state

- [ ] Task 2: Add edit handler to server action (AC: 2)
  - [ ] Add `updateInstalledApplication(formData: FormData)` to `app/_actions/software.ts`
  - [ ] Validate input with Zod schema
  - [ ] Update record by id
  - [ ] Call `revalidatePath()` for the unit detail page

- [ ] Task 3: Wire up edit button in SoftwareList (AC: 1)
  - [ ] Add `onEdit` callback prop to SoftwareList
  - [ ] Pass selected application data to EditSoftwareForm
  - [ ] Manage modal open/close state

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
