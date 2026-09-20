# Story 8.6: Hardware Inventory Report Page

Status: ready-for-dev

## Story

As a lab manager,
I want to view a printable hardware inventory report,
so that I can generate physical documentation for audits or planning.

## Acceptance Criteria

1. **Given** user navigates to Reports page (new nav item)
   **When** page loads
   **Then** system displays a report with: all rooms, all units per room, all components per unit
   **And** report shows: room name, unit name, component type, serial number, specifications, status

2. **Given** the report is displayed
   **When** user views the report
   **Then** report is grouped by room, then by unit within each room
   **And** each group has a visual header (room name, unit name)

3. **Given** the report is displayed
   **When** user clicks "Print" button
   **Then** browser print dialog opens
   **And** print layout hides sidebar, navigation, and header
   **And** report formats for A4 paper with proper margins

4. **Given** the report is displayed
   **When** user selects filters (room, status, or component type)
   **Then** report updates to show only matching records

5. **Given** the report is displayed
   **When** page loads
   **Then** report header shows: "Hardware Inventory Report" + generation date + total counts (rooms, units, components)

## Tasks / Subtasks

- [ ] Task 1: Create report page route (AC: 1)
  - [ ] Create `app/dashboard/reports/page.tsx` (Server Component)
  - [ ] Fetch all rooms with nested units and components
  - [ ] Group data by room, then by unit

- [ ] Task 2: Create HardwareReport client component (AC: 1, 2, 4, 5)
  - [ ] Create `app/dashboard/reports/components/HardwareReport.tsx`
  - [ ] Table/list grouped by room → unit → components
  - [ ] Filter controls: room select, status select, component type select
  - [ ] Header with title, date, summary counts

- [ ] Task 3: Create print stylesheet (AC: 3)
  - [ ] Add `@media print` rules in `globals.css` or component-level CSS
  - [ ] Hide: sidebar, navigation, header, print button
  - [ ] Show: report content only
  - [ ] Set A4 page size, margins, font sizing

- [ ] Task 4: Add Print button (AC: 3)
  - [ ] Button triggers `window.print()`
  - [ ] Hidden in print view via CSS

- [ ] Task 5: Add "Reports" navigation item (AC: 1)
  - [ ] Update navigation configuration to include Reports link
  - [ ] Add icon (e.g., `FileText` from lucide-react)
  - [ ] Add to both sidebar and bottom navigation

- [ ] Task 6: Create server action for report data (AC: 1, 4)
  - [ ] Add `getHardwareReport(filters)` to `app/_actions/reports.ts`
  - [ ] Support optional filters: roomId, status, componentType
  - [ ] Return grouped data structure

## Dev Notes

### Architecture Patterns to Follow

**Page Pattern [Source: architecture.md#Frontend Architecture]**
- Server page: `app/dashboard/reports/page.tsx`
- Client component: `app/dashboard/reports/components/HardwareReport.tsx`
- Server Action for data fetching

**Component Pattern [Source: architecture.md#Frontend Architecture]**
- Use shadcn/ui: Table, Select, Button, Badge
- Status badges: green=FUNCTIONAL, yellow=NEEDS_REPAIR, red=NEEDS_REPLACEMENT

**Navigation Pattern [Source: project-context.md#Component Patterns]**
- `isActiveLink(pathname, href)` — exact match for nav items
- Mobile bottom nav: first 5 items with shortLabel

### Files to Create/Modify

| File | Action | Purpose |
|------|--------|---------|
| `app/dashboard/reports/page.tsx` | NEW | Report page (Server Component) |
| `app/dashboard/reports/components/HardwareReport.tsx` | NEW | Report client component |
| `app/_actions/reports.ts` | NEW | Server action for report data |
| `app/globals.css` | MODIFY | Add print stylesheet rules |
| Navigation config | MODIFY | Add Reports nav item |

### Database Requirements

**No schema change** — read-only queries on existing tables.

Query pattern:
```typescript
const rooms = await prisma.laboratoryRoom.findMany({
  where: { deleted: false },
  include: {
    units: {
      where: { deleted: false },
      include: {
        components: { orderBy: { type: 'asc' } },
      },
    },
  },
  orderBy: { name: 'asc' },
});
```

### Testing Standards

- Test report page loads with all data
- Test grouped display (room → unit → components)
- Test filters narrow results
- Test print button opens browser dialog
- Test print layout hides UI chrome

## References

- [Source: sprint-change-proposal-2026-09-20.md] Feature 3, Story 8.1: Hardware Inventory Report Page
- [Source: architecture.md#Frontend Architecture] Page and component patterns
- [Source: prd.md#Functional Requirements] FR35: Printable hardware inventory report
- [Source: prd.md#Product Scope] Reports listed as Growth feature
