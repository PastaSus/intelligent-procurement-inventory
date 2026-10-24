---
title: 'Spare Parts report parity with Hardware Inventory report'
type: 'feature'
created: '2026-10-24'
status: 'done'
baseline_commit: 'f7acff9'
context:
  - '{project-root}/_bmad-output/project-context.md'
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** The Spare Parts report (`/dashboard/reports/spare-parts`) diverges from the Hardware Inventory report (`/dashboard/reports`): no filters, a plain print output with no letterhead, and different header/table styling. This makes the reports feel inconsistent ahead of the re-defense.

**Approach:** Full parity. Add Room / Component Type / Shortages-only filters backed by the existing server action, match the hardware report's header, summary cards, table styling, and empty state, and add a dedicated letterhead print document mirroring `HardwareReportPrint`.

## Boundaries & Constraints

**Always:**
- Filters: Room (All rooms + each room), Component Type (All types + 9 enum types), Showing (All items / Shortages only). No status filter — this report only counts `NEEDS_REPLACEMENT`; no detail-level filter — there is no per-unit view.
- Spare Qty is inventory stock across all rooms; label/footnote must make that explicit. Net shortage = filtered replacement need − global spare qty, floored at 0.
- Screen UI is wrapped in `report-no-print`; print-only area renders `SparePartsReportPrint` with UL + CCS logo letterhead, title, metadata strip (date, room, type, showing, totals), both tables, and a note when no shortages exist.
- Print button continues to call `printDocument()`.
- Preserve existing cross-links (category → component-status, counts → inventory, summary cards → destinations) and add a "Hardware Inventory Report" link in the header.
- Empty state when filters return no rows.

**Ask First:**
- Any filter semantics beyond the three above.
- Adding PDF export, pagination, or new dependencies.

**Never:**
- Database schema changes.
- Modifying the Hardware report's behavior or the purchase-request print output.

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|----------|--------------|---------------------------|----------------|
| Default load | No filters | All 9 categories; totals identical to current report | Inline error if action fails |
| Room filter | roomId | Replacement counts only for that room's units; spare qty remains global stock | Inline error |
| Type filter | componentType | Single category row with its counts | Inline error |
| Shortages only | Showing = Shortages only | Only rows with `netShortage > 0` in both tables and totals | Empty state when none |
| Print | Click Print | Only letterhead document prints; meta reflects active filters and totals; no app chrome | N/A |
| Invalid filter | Unknown roomId/componentType | Action returns error | Inline error message on screen |

</frozen-after-approval>

## Code Map

- `app/_actions/reports.ts` — extend `getSparePartsReport` with filters, validation, room options, recomputed totals
- `app/dashboard/reports/spare-parts/page.tsx` — pass initial data incl. `roomOptions`
- `app/dashboard/reports/spare-parts/SparePartsReport.tsx` — stateful filters, parity header/cards/tables, print split
- `app/dashboard/reports/spare-parts/SparePartsReportPrint.tsx` — NEW formal print document
- `lib/__mocks__/prisma.ts` — add `groupBy` mocks for `computerComponent` and `inventoryItem`
- `lib/spare-parts.ts` — export the shared component-type order used by both action and UI
- `app/_actions/__tests__/reports.integration.test.ts` — NEW action coverage
- `app/__tests__/reports/SparePartsReport.test.tsx` — extend component coverage

## Tasks & Acceptance

**Execution:**
- [x] `app/_actions/reports.ts` — add `SparePartsReportFilters` (`roomId?`, `componentType?`, `shortagesOnly?`); validate component type against `COMPONENT_TYPE_ORDER`; relation-filter replacement counts with `computer_unit: { deleted: false, laboratory_room: { deleted: false, ...(roomId && { id: roomId }) } }`; filter both groupBys by type when provided; fetch `roomOptions` in the same `Promise.all`; filter rows when `shortagesOnly`; recompute `requestRows` and `totals` from the visible rows; return `roomOptions`.
- [x] `app/dashboard/reports/spare-parts/page.tsx` — pass `roomOptions` from the action alongside rows/requestRows/totals; keep server-generated date.
- [x] `app/dashboard/reports/spare-parts/SparePartsReport.tsx` — mirror `HardwareReport`: `useState` filters + `useTransition` refetch, filter error/loading states, title + meta line + Hardware Report link + Print button, cards aligned to `ReportSummary` styling, three accessible selects, hardware-style table containers/cells, empty state, `report-no-print` wrapper, `print-only hidden` print component.
- [x] `app/dashboard/reports/spare-parts/SparePartsReportPrint.tsx` — create the letterhead document per Design Notes, rendering both tables and the no-shortages note.
- [x] `lib/__mocks__/prisma.ts` — add `groupBy: vi.fn()` to `computerComponent` and `inventoryItem`.
- [x] `app/_actions/__tests__/reports.integration.test.ts` — cover auth failure, default aggregation, room/type/shortages filters, invalid type, and recomputed totals.
- [x] `lib/spare-parts.ts` — export `COMPONENT_TYPE_ORDER` so the action and the filter UI share one enum list.
- [x] `app/__tests__/reports/SparePartsReport.test.tsx` — mock the action; render new props; assert filter selects, filter call args, shortages-only rendering, print document contents, and preserved links.

**Acceptance Criteria:**
- Given the default load, when rendered, then the report shows the same categories/totals as today plus the three filter selects and hardware-style header.
- Given any filter change, when applied, then screen tables, summary totals, and print metadata all reflect the filtered data.
- Given Print is clicked, then only the letterhead document prints, with no sidebar/header/filters/buttons.
- Given a filter combination with no rows, then an empty state replaces the tables and the print document shows the same "no data" note.
- Given the action is called with an invalid component type, then it returns `{ success: false, error }`.

## Spec Change Log

## Design Notes

Filter choice rationale: Room and Component Type both narrow real procurement questions ("what do I need for Lab 101?", "how many keyboards?"); Shortages-only answers the report's core purpose (what must be requested). Status is fixed by definition and a detail toggle has no meaning here, so both are omitted rather than added as no-ops.

`SparePartsReportPrint` mirrors `HardwareReportPrint`: `hardware-report-print pr-print-letter pr-print-letter-paged bg-white text-black p-8 max-w-[210mm] mx-auto`, double-rule letterhead with both logos, uppercase title, bordered metadata strip, then the two tables. No `SignatoryBlocks` (the hardware print document no longer includes them). Screen cells use the hardware report's `px-4 py-2` sizing and `bg-card rounded-lg border` containers.

## Verification

**Commands:**
- `pnpm test:run` — expected: all Vitest suites pass, including new action and component tests
- `pnpm lint` — expected: no errors
- `pnpm build` — expected: production build succeeds

**Manual checks (if no CLI):**
- Load both report routes and compare header, cards, filter row, table spacing, and empty states.
- Print the spare-parts report with each filter set; confirm letterhead-only output and accurate metadata.

## Suggested Review Order

**Server filtering contract**

- Start here: filters, validation, and derived rows/totals all live in one action.
  [`reports.ts:90`](../../app/_actions/reports.ts#L90)
- Room narrows replacement counts through a relation filter while spares stay global.
  [`reports.ts:115`](../../app/_actions/reports.ts#L115)
- Unknown room ids fail closed instead of silently returning zeroed rows.
  [`reports.ts:135`](../../app/_actions/reports.ts#L135)
- Shortages-only filters after net-shortage calculation; totals follow visible rows.
  [`reports.ts:161`](../../app/_actions/reports.ts#L161)

**Shared enum**

- One component-type list now feeds the action and the dropdown.
  [`spare-parts.ts:3`](../../lib/spare-parts.ts#L3)

**Client behavior**

- Request token, try/catch, and revert-on-failure keep labels consistent with data.
  [`SparePartsReport.tsx:61`](../../app/dashboard/reports/spare-parts/SparePartsReport.tsx#L61)
- Selects and Print disable while pending to prevent mismatched print metadata.
  [`SparePartsReport.tsx:174`](../../app/dashboard/reports/spare-parts/SparePartsReport.tsx#L174)
- Footnote states global spare scope and that totals follow filters.
  [`SparePartsReport.tsx:353`](../../app/dashboard/reports/spare-parts/SparePartsReport.tsx#L353)

**Print artifact**

- Letterhead document mirrors the hardware report's formal print layout.
  [`SparePartsReportPrint.tsx:59`](../../app/dashboard/reports/spare-parts/SparePartsReportPrint.tsx#L59)
- Metadata labels spare units as all-room stock.
  [`SparePartsReportPrint.tsx:68`](../../app/dashboard/reports/spare-parts/SparePartsReportPrint.tsx#L68)
- No-shortage note replaces the request table when stock covers all needs.
  [`SparePartsReportPrint.tsx:104`](../../app/dashboard/reports/spare-parts/SparePartsReportPrint.tsx#L104)

**Page wiring**

- Page forwards room options so the filter dropdown is populated on first load.
  [`page.tsx:23`](../../app/dashboard/reports/spare-parts/page.tsx#L23)

**Tests**

- Action coverage includes room/type/combined filters and fail-closed validation.
  [`reports.integration.test.ts:103`](../../app/_actions/__tests__/reports.integration.test.ts#L103)
- Component coverage drives filters and asserts rendered tables plus print metadata.
  [`SparePartsReport.test.tsx:128`](../../app/__tests__/reports/SparePartsReport.test.tsx#L128)
- Failure, empty-state, and no-shortage paths are exercised.
  [`SparePartsReport.test.tsx:183`](../../app/__tests__/reports/SparePartsReport.test.tsx#L183)
