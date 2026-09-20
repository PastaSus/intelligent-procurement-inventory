# Story 8.6: Hardware Inventory Report Page

Status: review

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

- [x] Task 1: Create report page route (AC: 1)
  - [x] Create `app/dashboard/reports/page.tsx` (Server Component)
  - [x] Fetch all rooms with nested units and components
  - [x] Group data by room, then by unit

- [x] Task 2: Create HardwareReport client component (AC: 1, 2, 4, 5)
  - [x] Create `app/dashboard/reports/components/HardwareReport.tsx`
  - [x] Table/list grouped by room → unit → components
  - [x] Filter controls: room select, status select, component type select
  - [x] Header with title, date, summary counts

- [x] Task 3: Create print stylesheet (AC: 3)
  - [x] Add `@media print` rules in `globals.css`
  - [x] Hide: sidebar, navigation, header, filters, print button
  - [x] Show: print-only header + report content
  - [x] Set A4 page size, margins, compact fonts, avoid breaking sections

- [x] Task 4: Add Print button (AC: 3)
  - [x] Button triggers `window.print()`
  - [x] Hidden in print view via `.report-no-print`

- [x] Task 5: Add "Reports" navigation item (AC: 1)
  - [x] Update navigation configuration to include Reports link
  - [x] Add icon (`FileText` from lucide-react)
  - [x] Sidebar + bottom nav share `navItems` (Reports is 8th → sidebar-only, same as Requests/Chat)

- [x] Task 6: Create server action for report data (AC: 1, 4)
  - [x] Add `getHardwareReport(filters)` to `app/_actions/reports.ts`
  - [x] Support optional filters: roomId, status, componentType
  - [x] Return grouped data structure + room options for filter dropdown

## Dev Agent Record

### Completion Notes

**Implementation Complete:** Story 8.6 - Hardware Inventory Report Page

**All Acceptance Criteria Satisfied:**
- AC1: Report page shows all rooms → units → components with serial/specs/status
- AC2: Grouped display with room and unit headers
- AC3: Print button opens browser dialog; print CSS hides chrome, A4 formatting
- AC4: Room/status/type filters re-query via server action
- AC5: Header shows title + generation date + room/unit/component counts (screen + print variants)

**Files Created:**
- `app/_actions/reports.ts` - getHardwareReport server action with typed Prisma enum filters
- `app/dashboard/reports/page.tsx` - Report page (Server Component)
- `app/dashboard/reports/components/HardwareReport.tsx` - Grouped report with filters + print

**Files Modified:**
- `components/navigation.tsx` - Added Reports nav item (FileText icon)
- `app/globals.css` - Appended @media print rules (A4, hide chrome, avoid breaks)

**Verification:**
- TypeScript: no errors
- ESLint: clean (fixed 2 no-explicit-any with Prisma enum types)
- Production build: succeeds, /dashboard/reports route present
- Nav tests unaffected (epic-7 tests use local mocks, no count assertions on real nav)

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
