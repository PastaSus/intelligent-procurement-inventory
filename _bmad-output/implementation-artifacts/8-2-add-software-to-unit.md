# Story 8.2: Add Installed Application to Unit

Status: ready-for-dev

## Story

As a lab technician,
I want to record software installed on a computer unit,
so that I can track the complete asset profile of each machine.

## Acceptance Criteria

1. **Given** user is viewing a computer unit's detail page
   **When** user clicks "Add Software" button
   **Then** system displays a modal with fields: name (required), version (optional), license key (optional), license type (dropdown), install date (optional)

2. **Given** user fills in the software form with valid data
   **When** user clicks "Save"
   **Then** system saves the application record linked to the current unit
   **And** user sees success toast notification
   **And** software list refreshes on the unit detail page

3. **Given** user fills in the software form with invalid data (empty name)
   **When** user clicks "Save"
   **Then** system displays validation error

## Tasks / Subtasks

- [ ] Task 1: Create AddSoftwareForm client component (AC: 1, 2, 3)
  - [ ] Create `app/dashboard/units/[id]/components/AddSoftwareForm.tsx`
  - [ ] Modal with fields: name, version, licenseKey, licenseType (select), installDate
  - [ ] Use shadcn/ui: Input, Select, Button
  - [ ] `useTransition` for pending state
  - [ ] Form validation: name required

- [ ] Task 2: Create server action for adding software (AC: 2, 3)
  - [ ] Add `addInstalledApplication(formData: FormData)` to `app/_actions/software.ts`
  - [ ] Validate input with Zod schema
  - [ ] Insert into InstalledApplication table with computer_unit_id
  - [ ] Call `revalidatePath()` for the unit detail page

- [ ] Task 3: Create Zod validation schema (AC: 3)
  - [ ] Create `lib/validators/software.ts`
  - [ ] Schema: name (string, min 1, max 200), version (string, optional), licenseKey (string, optional), licenseType (enum), installDate (date, optional)

- [ ] Task 4: Add "Add Software" button to unit detail page (AC: 1)
  - [ ] Add button in `ComponentsClient.tsx` or create a new `SoftwareSection.tsx`
  - [ ] Render `AddSoftwareForm` modal when clicked

- [ ] Task 5: Add software list section to unit detail page (AC: 2)
  - [ ] Fetch installed applications in `app/dashboard/units/[id]/page.tsx`
  - [ ] Pass to client component
  - [ ] Display in a table: name, version, license type badge, install date

## Dev Notes

### Architecture Patterns to Follow

**Server Action Pattern [Source: architecture.md#API & Communication Patterns]**
- Location: `app/_actions/software.ts` (new file)
- Always use `'use server'` directive
- Return format: `{ success: boolean, error?: string }`
- Call `revalidatePath()` after mutations

**Component Pattern [Source: architecture.md#Frontend Architecture]**
- AddSoftwareForm: Client Component with `'use client'`
- Use shadcn/ui components
- Co-locate: `app/dashboard/units/[id]/components/`

**Validation Pattern [Source: architecture.md#Implementation Patterns & Consistency Rules]**
- Server-side: Zod schema in `lib/validators/software.ts`
- Validate before database write
- Use `.trim().max()` on string fields

### Files to Create/Modify

| File | Action | Purpose |
|------|--------|---------|
| `app/_actions/software.ts` | NEW | Server actions for software CRUD |
| `lib/validators/software.ts` | NEW | Zod schemas for software validation |
| `app/dashboard/units/[id]/components/AddSoftwareForm.tsx` | NEW | Add software modal |
| `app/dashboard/units/[id]/components/SoftwareList.tsx` | NEW | Software list table |
| `app/dashboard/units/[id]/page.tsx` | MODIFY | Fetch and pass software data |
| `app/dashboard/units/[id]/ComponentsClient.tsx` | MODIFY | Integrate software section |

### Database Requirements

**Prerequisite: Story 8.1 (Schema Migration) must be complete**

Insert operation:
```typescript
await prisma.installedApplication.create({
  data: {
    computer_unit_id: unitId,
    name: validated.name,
    version: validated.version ?? undefined,
    license_key: validated.licenseKey ?? undefined,
    license_type: validated.licenseType ?? 'NONE',
    install_date: validated.installDate ?? undefined,
  },
});
```

### Testing Standards

- Test add software button opens modal
- Test successful save adds to list
- Test empty name shows validation error
- Test license type dropdown works

## References

- [Source: sprint-change-proposal-2026-09-20.md] Feature 4, Story 8.3: Add Installed Application to Unit
- [Source: architecture.md#Implementation Patterns & Consistency Rules] Validation and naming patterns
- [Source: prd.md#Functional Requirements] FR38: Users can add installed applications
