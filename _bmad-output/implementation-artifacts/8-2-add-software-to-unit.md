# Story 8.2: Add Installed Application to Unit

Status: review

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

- [x] Task 1: Create AddSoftwareForm client component (AC: 1, 2, 3)
  - [x] Create `app/dashboard/units/[id]/components/AddSoftwareForm.tsx`
  - [x] Modal with fields: name, version, licenseKey, licenseType (select), installDate
  - [x] Use shadcn/ui: Input, Select, Button
  - [x] `useTransition` for pending state
  - [x] Form validation: name required

- [x] Task 2: Create server action for adding software (AC: 2, 3)
  - [x] Add `addInstalledApplication(formData: FormData)` to `app/_actions/software.ts`
  - [x] Validate input with Zod schema
  - [x] Insert into InstalledApplication table with computer_unit_id
  - [x] Call `revalidatePath()` for the unit detail page

- [x] Task 3: Create Zod validation schema (AC: 3)
  - [x] Create `lib/validators/software.ts`
  - [x] Schema: name (string, min 1, max 200), version (string, optional), licenseKey (string, optional), licenseType (enum), installDate (date, optional)

- [x] Task 4: Add "Add Software" button to unit detail page (AC: 1)
  - [x] Add button in `ComponentsClient.tsx` or create a new `SoftwareSection.tsx`
  - [x] Render `AddSoftwareForm` modal when clicked

- [x] Task 5: Add software list section to unit detail page (AC: 2)
  - [x] Fetch installed applications in `app/dashboard/units/[id]/page.tsx`
  - [x] Pass to client component
  - [x] Display in a table: name, version, license type badge, install date

## Dev Agent Record

### Completion Notes

**Implementation Complete:** Story 8.2 - Add Installed Application to Unit

**All Acceptance Criteria Satisfied:**
- AC1: "Add Software" button on unit detail page opens modal (name*, version, license key, license type dropdown, install date)
- AC2: Valid save inserts record, success toast, list refreshes via revalidatePath + reload
- AC3: Empty name blocked by HTML required + Zod min(1), error toast on failure

**Scope note:** `app/_actions/software.ts` includes all three CRUD actions (add/update/remove) since they share the validator — stories 8-4/8-5 wire up the UI. Basic software table added here; story 8-3 upgrades it to the full SoftwareList component.

**Files Created:**
- `lib/validators/software.ts` - Create/update Zod schemas
- `app/_actions/software.ts` - add/update/remove server actions
- `app/dashboard/units/[id]/components/AddSoftwareForm.tsx` - Add software modal

**Files Modified:**
- `lib/validators/enums.ts` - Added LicenseTypeEnum
- `app/dashboard/units/[id]/page.tsx` - Fetch installedApplications
- `app/dashboard/units/[id]/ComponentsClient.tsx` - Add Software button + basic software table

**Verification:**
- TypeScript: no errors in new/modified files
- ESLint: clean
- Production build: succeeds
- Existing units integration tests: 14/14 pass (type errors in that file are pre-existing mock drift)

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
