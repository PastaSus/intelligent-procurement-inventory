# Story 8.3: View Installed Applications by Unit

Status: ready-for-dev

## Story

As a lab technician,
I want to view all software installed on a specific computer unit,
so that I can see the complete software profile.

## Acceptance Criteria

1. **Given** user navigates to a computer unit's detail page
   **When** page loads
   **Then** system displays all installed applications in a table below the components section
   **And** table shows: name, version, license type badge, install date

2. **Given** the software list is displayed
   **When** there are no installed applications
   **Then** system shows empty state: "No software recorded. Click 'Add Software' to get started."

3. **Given** the software list is displayed
   **When** user views the list
   **Then** each row has Edit and Remove action buttons

## Tasks / Subtasks

- [ ] Task 1: Create SoftwareList client component (AC: 1, 2, 3)
  - [ ] Create `app/dashboard/units/[id]/components/SoftwareList.tsx`
  - [ ] Table with columns: Name, Version, License Type, Install Date, Actions
  - [ ] License type badge with color coding (FREE=green, COMMERCIAL=blue, OPEN_SOURCE=purple, EDUCATIONAL=yellow, NONE=gray)
  - [ ] Empty state when no records
  - [ ] Edit and Remove buttons on each row

- [ ] Task 2: Fetch software data in unit detail page (AC: 1)
  - [ ] Update `app/dashboard/units/[id]/page.tsx` to include `installedApplications` in Prisma query
  - [ ] Pass `initialSoftware` prop to client component

- [ ] Task 3: Integrate SoftwareList into unit detail page (AC: 1, 2)
  - [ ] Add SoftwareList section below ComponentsClient in unit detail page
  - [ ] Pass software data and handlers

- [ ] Task 4: Format dates for display (AC: 1)
  - [ ] Use `formatDate()` utility from `lib/utils.ts` for install_date display
  - [ ] Handle null install_date gracefully

## Dev Notes

### Architecture Patterns to Follow

**Component Pattern [Source: architecture.md#Frontend Architecture]**
- SoftwareList: Client Component with `'use client'`
- Use shadcn/ui: Table, TableBody, TableCell, TableHead, TableHeader, TableRow
- Badge component for license type
- Co-locate: `app/dashboard/units/[id]/components/`

**Date Formatting [Source: project-context.md#Component Patterns]**
- Use `formatDate()` utility — relative for recent, absolute for older
- Handle null dates with fallback text ("N/A")

### Files to Create/Modify

| File | Action | Purpose |
|------|--------|---------|
| `app/dashboard/units/[id]/components/SoftwareList.tsx` | NEW | Software list table component |
| `app/dashboard/units/[id]/page.tsx` | MODIFY | Fetch installedApplications |
| `app/dashboard/units/[id]/ComponentsClient.tsx` | MODIFY | Add SoftwareList section |

### Database Requirements

**Prerequisite: Story 8.1 (Schema Migration) must be complete**

Query:
```typescript
const unit = await prisma.computerUnit.findUnique({
  where: { id },
  include: {
    components: { orderBy: { type: 'asc' } },
    installedApplications: { orderBy: { name: 'asc' } },
  },
});
```

### Testing Standards

- Test software list renders in unit detail page
- Test empty state shows when no software
- Test edit/remove buttons appear on each row
- Test license type badges display correctly

## References

- [Source: sprint-change-proposal-2026-09-20.md] Feature 4, Story 8.4: View Installed Applications by Unit
- [Source: architecture.md#Frontend Architecture] Component patterns
- [Source: prd.md#Functional Requirements] FR39: Users can view all software on a unit
