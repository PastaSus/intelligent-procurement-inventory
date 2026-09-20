# Story 8.7: Report Summary Statistics

Status: ready-for-dev

## Story

As a lab manager,
I want the report to include summary statistics,
so that I can see at-a-glance totals.

## Acceptance Criteria

1. **Given** user is on the Reports page
   **When** report loads
   **Then** summary section at the top shows: total rooms, total units, total components

2. **Given** the summary section is displayed
   **When** user views the summary
   **Then** breakdown by status is shown: FUNCTIONAL count, NEEDS_REPAIR count, NEEDS_REPLACEMENT count
   **And** breakdown by component type is shown: "X processors, Y memory modules, etc."

3. **Given** the summary is displayed
   **When** user clicks on a summary stat
   **Then** report filters to show only matching records (drill-down)

## Tasks / Subtasks

- [ ] Task 1: Create ReportSummary component (AC: 1, 2)
  - [ ] Create `app/dashboard/reports/components/ReportSummary.tsx`
  - [ ] Cards showing: Total Rooms, Total Units, Total Components
  - [ ] Status breakdown: colored badges with counts
  - [ ] Type breakdown: list with counts

- [ ] Task 2: Add summary data computation (AC: 1, 2)
  - [ ] Compute totals from report data (client-side aggregation)
  - [ ] Group by status and component type
  - [ ] Pass summary data to ReportSummary component

- [ ] Task 3: Add drill-down functionality (AC: 3)
  - [ ] Make summary stat cards clickable
  - [ ] Clicking a stat sets the corresponding filter
  - [ ] Report table updates to show filtered results

- [ ] Task 4: Integrate summary into report page (AC: 1)
  - [ ] Add ReportSummary above HardwareReport in `app/dashboard/reports/page.tsx`
  - [ ] Pass aggregated data as props

## Dev Notes

### Architecture Patterns to Follow

**Component Pattern [Source: architecture.md#Frontend Architecture]**
- ReportSummary: Client Component
- Use shadcn/ui: Card, Badge
- Color coding: green=FUNCTIONAL, yellow=NEEDS_REPAIR, red=NEEDS_REPLACEMENT

**Status Badge Pattern [Source: project-context.md#Component Patterns]**
- Color-coded badges: `bg-{color}-100 text-{color}-800`
- Reuse existing badge patterns from component status dashboard

### Files to Create/Modify

| File | Action | Purpose |
|------|--------|---------|
| `app/dashboard/reports/components/ReportSummary.tsx` | NEW | Summary statistics component |
| `app/dashboard/reports/components/HardwareReport.tsx` | MODIFY | Add drill-down filter handlers |
| `app/dashboard/reports/page.tsx` | MODIFY | Integrate summary, pass data |

### Database Requirements

**No schema change** — aggregation queries on existing data.

Aggregation examples:
```typescript
const totalRooms = rooms.length;
const totalUnits = rooms.reduce((sum, r) => sum + r.units.length, 0);
const totalComponents = rooms.reduce((sum, r) =>
  sum + r.units.reduce((uSum, u) => uSum + u.components.length, 0), 0);

const statusCounts = components.reduce((acc, c) => {
  acc[c.status] = (acc[c.status] || 0) + 1;
  return acc;
}, {} as Record<string, number>);

const typeCounts = components.reduce((acc, c) => {
  acc[c.type] = (acc[c.type] || 0) + 1;
  return acc;
}, {} as Record<string, number>);
```

### Testing Standards

- Test summary cards display correct totals
- Test status breakdown matches data
- Test type breakdown matches data
- Test drill-down filters report table

## References

- [Source: sprint-change-proposal-2026-09-20.md] Feature 3, Story 8.2: Report Summary Statistics
- [Source: project-context.md#Component Patterns] Status badge color patterns
- [Source: prd.md#Functional Requirements] FR37: Reports include summary statistics
