# Story 8.3: View Installed Applications by Unit

Status: review

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

- [x] Task 1: Create SoftwareList client component (AC: 1, 2, 3)
  - [x] Create `app/dashboard/units/[id]/components/SoftwareList.tsx`
  - [x] Table with columns: Name, Version, License Type, Install Date, Actions
  - [x] License type badge with color coding (FREE=green, COMMERCIAL=blue, OPEN_SOURCE=purple, EDUCATIONAL=yellow, NONE=gray)
  - [x] Empty state when no records
  - [x] Edit and Remove buttons on each row

- [x] Task 2: Fetch software data in unit detail page (AC: 1)
  - [x] Update `app/dashboard/units/[id]/page.tsx` to include `installedApplications` in Prisma query
  - [x] Pass `initialSoftware` prop to client component

- [x] Task 3: Integrate SoftwareList into unit detail page (AC: 1, 2)
  - [x] Add SoftwareList section below ComponentsClient in unit detail page
  - [x] Pass software data and handlers

- [x] Task 4: Format dates for display (AC: 1)
  - [x] Local `formatDate()` in SoftwareList.tsx following codebase convention (no shared util exists — each client defines its own)
  - [x] Handle null install_date gracefully (shows "N/A")

### Review Findings (Group 2 review, 2026-09-20) — all resolved

- [x] [Review][Patch] Use UTC getters for date display to avoid timezone day-shift [app/dashboard/units/[id]/components/SoftwareList.tsx]
- [x] [Review][Patch] Align empty-state copy with AC2 string [app/dashboard/units/[id]/components/SoftwareList.tsx]

## Dev Agent Record

### Completion Notes

**Implementation Complete:** Story 8.3 - View Installed Applications by Unit

**All Acceptance Criteria Satisfied:**
- AC1: Software table on unit detail page shows name, version, license badge, install date (relative format, N/A fallback)
- AC2: Empty state with icon + "Add Software to get started" CTA
- AC3: Edit/Remove icon buttons on each row, wired to state handlers (modals land in 8-4/8-5)

**Scope note:** Edit/Remove buttons set `editingSoftware`/`removingSoftware` state in ComponentsClient; the Edit modal (8-4) and Remove confirm (8-5) render from that state. 2 transient lint warnings for unread state values resolve when those stories land.

**Files Created:**
- `app/dashboard/units/[id]/components/SoftwareList.tsx` - Software table with badges, dates, empty state, action buttons

**Files Modified:**
- `app/dashboard/units/[id]/ComponentsClient.tsx` - Replaced inline table with SoftwareList, added edit/remove state + handlers

**Verification:**
- TypeScript: no errors
- ESLint: 0 errors (2 transient warnings for forward-looking state)
- Production build: succeeds

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
