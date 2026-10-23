---
title: 'Reports print + detail views, remove component serial number'
type: 'feature'
created: '2026-10-23'
status: 'in-progress'
baseline_commit: '365c0c6'
context:
  - '{project-root}/_bmad-output/project-context.md'
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** The Reports page prints the dashboard UI and has no detail-level filter. The advisor also approved removing the component serial number from the database and UI.

**Approach:** Drop `serial_number` from `ComputerComponent` (no backfill), remove every code/UI reference, and rebuild Reports with a formal print-only document plus Detailed / Non-Detailed views.

## Boundaries & Constraints

**Always:**
- Drop `ComputerComponent.serial_number` (including its unique index) via migration; no data preservation.
- Remove all serial references: schema, actions, validators, forms, unit tables, batch update, relocate, component health, component status, reports, seed, factories/tests, and `docs/SCHEMA.md`.
- Non-Detailed = one row per unit: Room No., Unit No., Status (worst component status).
- Detailed = one row per component: Room No., Unit No., Component, Specifications, Status.
- Worst status order: NEEDS_REPLACEMENT > NEEDS_REPAIR > FUNCTIONAL.
- Room/status/type filters and the current view apply to screen and print.
- Print output contains only the formal document (`pr-print-letter pr-print-letter-paged`), including letterhead, metadata, table, totals, and `SignatoryBlocks`; all screen UI is `report-no-print`.
- Units with no matching components are excluded in both views.

**Ask First:**
- Any change beyond dropping serial (extra fields, report layout beyond the columns above, different signatories).
- Applying the destructive migration to a database other than `DATABASE_URL`.

**Never:**
- Add dependencies, PDF generation, pagination, or a hidden serial/code field.
- Modify purchase-request print code or historical planning artifacts.
- Keep serial in test fixtures or seed data.

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|----------|--------------|---------------------------|----------------|
| Default load | No filters | Detailed; Room/Unit/Component/Specs/Status rows; Print enabled | Inline error if query fails |
| Non-Detailed | View = Non-Detailed | Room/Unit/Status rows only, one per unit | N/A |
| Worst status | Unit has FUNCTIONAL + NEEDS_REPAIR | Row shows NEEDS_REPAIR | N/A |
| All functional | Unit components all FUNCTIONAL | Row shows FUNCTIONAL | N/A |
| Filter + view | Room/status/type + Non-Detailed | Only units with matching components; counts/labels reflect filtered set | Empty state when nothing matches |
| Print | Click Print in either view | Only formal document prints with letterhead, date, filters, view, totals, current table, signatories; no dashboard chrome | N/A |
| Create/edit component | No serial input | Component saves type/specs/status; no uniqueness error | Existing validation errors remain |
| Seed | `pnpm seed` | Components created without serial | N/A |

</frozen-after-approval>

## Code Map

- `prisma/schema.prisma` -- remove `serial_number` from `ComputerComponent`
- `prisma/migrations/20261023030000_remove_component_serial_number/migration.sql` -- NEW drop-column migration
- `app/_actions/components.ts` -- remove serial parsing, duplicate checks, create/update data, bulk placeholder
- `lib/validators/computer-component.ts` -- remove `serialNumber` fields/rules
- `app/dashboard/units/[id]/components/AddComponentForm.tsx` -- remove serial input
- `app/dashboard/units/[id]/components/EditComponentForm.tsx` -- remove serial input/type field
- `app/dashboard/units/[id]/components/RelocateComponentModal.tsx` -- remove serial display/type field
- `app/dashboard/units/[id]/ComponentsClient.tsx` -- remove serial column/type/confirmation text
- `app/dashboard/units/batch-update/BatchUpdateClient.tsx` -- remove serial from search/table/type
- `lib/component-health.ts` -- remove serial from `IssueComponent`
- `app/dashboard/component-status/page.tsx` -- remove serial from room list and table; fix colSpan
- `app/_actions/reports.ts` -- remove serial from select
- `app/dashboard/reports/components/HardwareReport.tsx` -- detail state/select, screen tables, print split
- `app/dashboard/reports/components/HardwareReportPrint.tsx` -- NEW formal document
- `app/dashboard/purchase-requests/components/SignatoryBlocks.tsx` -- REUSE
- `prisma/seed.ts`, `app/__tests__/factories/index.ts`, affected tests -- remove serial fixtures
- `docs/SCHEMA.md` -- remove serial row

## Tasks & Acceptance

**Execution:**
- [ ] `prisma/schema.prisma` + new migration SQL -- remove `serial_number` and add `ALTER TABLE "ComputerComponent" DROP COLUMN "serial_number";`; run `prisma generate` and `prisma migrate deploy`.
- [ ] `components.ts` + validator -- delete serial parsing, required rules, duplicate lookups/messages, update spread, and bulk `-PENDING` serial.
- [ ] `AddComponentForm`, `EditComponentForm`, `RelocateComponentModal`, `ComponentsClient`, `BatchUpdateClient` -- remove serial inputs, columns, search term, type fields, and serial confirmation text.
- [ ] `component-health.ts` + `component-status/page.tsx` -- drop serial from types/queries/JSX; update the table `colSpan`.
- [ ] `reports.ts` -- remove `serial_number` from the report component select.
- [ ] `HardwareReport.tsx` -- add `View` select (Detailed / Non-Detailed) with accessible labels; render the chosen table; wrap all screen UI in `report-no-print`; render `HardwareReportPrint` in `print-only hidden` with current rooms, filters, view, and generated date.
- [ ] `HardwareReportPrint.tsx` -- create letterhead, "HARDWARE INVENTORY REPORT", generated date + applied filters + view + totals, the current view's table, and `SignatoryBlocks`.
- [ ] `seed.ts`, factories, and affected tests -- remove serial fields; delete the duplicate-serial test; keep create/update/bulk coverage.
- [ ] `docs/SCHEMA.md` -- remove the `serial_number` row.
- [ ] `app/__tests__/reports/HardwareReport.test.tsx` -- NEW: default detailed, toggle non-detailed, worst-status rollup, print-only document, filter metadata.

**Acceptance Criteria:**
- Given a component with no serial input, when created or edited, then it saves without serial data and no serial column exists in the database or UI.
- Given Non-Detailed, when rendered, then each unit appears once with Room No., Unit No., and worst component Status.
- Given Detailed, when rendered, then each component appears once with Room No., Unit No., Component, Specifications, and Status.
- Given either view, when printed, then only the formal report document prints with applied filters and signatories.

## Spec Change Log

- 2026-10-23: Advisor approved dropping `serial_number` from the database; supersedes the earlier label-only Code rename. Report columns fixed to the advisor's list.

## Design Notes

`HardwareReportPrint` mirrors `PurchaseRequestPrint`: logos `/university_of_luzon_logo-upscaled.png` and `/ccs-logo-upscaled.png`, double black rule, uppercase title, bordered metadata strip, then the table and shared signatory row. Screen state stays mounted behind `report-no-print` so filters survive printing.

## Verification

**Commands:**
- `pnpm exec prisma generate` -- expected: client generated without `serial_number`
- `pnpm exec prisma migrate status` -- expected: only the new serial-drop migration is pending
- `pnpm exec prisma migrate deploy` -- expected: migration applied; no other tables altered
- `pnpm test:run` -- expected: all Vitest tests pass
- `pnpm seed` -- do NOT run against the shared DB (it deletes all data); seed code is updated but only run on a disposable database
- `pnpm lint` -- expected: no errors
- `pnpm build` -- expected: production build succeeds

**Manual checks (if no CLI):**
- Print both views: only letterhead document, no sidebar/filters/buttons, signatories at bottom.
- Search all UI for "Serial"/"serial"; expect none.
