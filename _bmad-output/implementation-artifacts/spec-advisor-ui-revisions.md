---
title: 'Advisor UI revisions: room unit seeding, report dividers, labels, room badge'
type: 'feature'
created: '2026-10-24'
status: 'done'
baseline_commit: '6cc946f'
context: []
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** The capstone advisor requested five revisions. Three are missing (room creation cannot seed PCs, the report label says "Detailed", unit-detail room text is not navigable), one is incomplete (unit groups are not visually separated in report tables), and one is already supported (software license keys).

**Approach:** Add a "Number of PCs / Units" field to the Add Room modal and seed numbered units on create; add unit-level dividers to the detailed report tables; rename the "Detailed" option to "Per Unit"; turn the room label on unit detail into a link to the filtered units view; verify license-key support and leave schema unchanged.

## Boundaries & Constraints

**Always:** Reuse the existing unit-batch naming convention (prefix + zero-padded number, e.g. `LR2` → `LR201`). Keep server actions returning `{ success, error? }`. Keep internal report values (`detailed` | `non-detailed`) unchanged. Reuse existing UI primitives and patterns.

**Ask First:** None — advisor request is explicit.

**Never:** Do not change the Prisma schema for license keys (already exists). Do not introduce react-hook-form or a new state library. Do not display full license keys in list views.

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|----------|--------------|---------------------------|----------------|
| CREATE_ROOM_WITH_UNITS | Room name `LR2`, unitCount `3` | Room created plus units `LR201`, `LR202`, `LR203` | Transaction rolls back on error |
| CREATE_ROOM_ZERO_UNITS | unitCount `0` / blank | Room created, no units | N/A |
| INVALID_COUNT | unitCount `-1` or `101` | Validation error, no room created | Return `{ success: false, error }` |
| UNNAMED_PREFIX | Room name `---`, unitCount `2` | Validation error, no room created | Return `{ success: false, error }` |
| UNIT_BOUNDARY | Detailed report, LR201 rows then LR203 rows | Medium divider between units, thick divider between rooms | N/A |

</frozen-after-approval>

## Code Map

- `lib/unit-batch.ts` -- shared prefix derivation + name generation
- `lib/validators/lab-room.ts` -- add optional `unitCount`
- `app/_actions/rooms.ts` -- create room + units in a transaction
- `app/dashboard/rooms/components/AddRoomForm.tsx` -- numeric PCs field + preview
- `app/dashboard/units/components/BatchAddUnitsForm.tsx` -- reuse prefix helper
- `app/dashboard/reports/components/report-rows.ts` -- unit-end helper
- `app/dashboard/reports/components/HardwareReport.tsx` -- unit dividers + "Per Unit" label
- `app/dashboard/reports/components/HardwareReportPrint.tsx` -- same for print
- `app/dashboard/units/[id]/page.tsx` -- expose room id
- `app/dashboard/units/[id]/ComponentsClient.tsx` -- clickable room badge

## Tasks & Acceptance

**Execution:**
- [x] `lib/unit-batch.ts` -- add `deriveUnitPrefix` -- share prefix logic
- [x] `lib/validators/lab-room.ts` -- add `unitCount` (0–100, default 0) with prefix guard -- validate input
- [x] `app/_actions/rooms.ts` -- seed units via `$transaction` -- atomic create
- [x] `app/dashboard/rooms/components/AddRoomForm.tsx` -- numeric field + name preview -- advisor UI
- [x] `app/dashboard/units/components/BatchAddUnitsForm.tsx` -- use `deriveUnitPrefix` -- dedupe
- [x] `app/dashboard/reports/components/report-rows.ts` -- add `isUnitEnd`/`getDetailedRowClass` -- group rows
- [x] `app/dashboard/reports/components/HardwareReport.tsx` -- apply class + rename label to "Per Unit" -- advisor UI
- [x] `app/dashboard/reports/components/HardwareReportPrint.tsx` -- apply class + rename print label -- consistency
- [x] `app/dashboard/units/[id]/page.tsx` -- select/pass room id -- enable navigation
- [x] `app/dashboard/units/[id]/ComponentsClient.tsx` -- render linked room badge -- advisor UI
- [x] `app/__tests__/epic-2/AddRoomForm.test.tsx` -- cover new field -- regression
- [x] `app/_actions/__tests__/rooms.integration.test.ts` -- cover unit seeding -- regression
- [x] `app/__tests__/reports/HardwareReport.test.tsx` -- cover unit dividers -- regression

**Acceptance Criteria:**
- Given a room name and unit count, when the room is created, then units numbered from 01 are inserted for that room.
- Given the detailed report, when two units share a room, then a visible divider separates their rows and a thicker divider separates rooms.
- Given the report filter, when opened, then the first option reads "Per Unit" (value still `detailed`).
- Given a unit detail page, when the room badge is clicked, then the user lands on `/dashboard/units?room_id=<id>`.
- Given a software asset, when created/edited, then an optional license key persists (verified existing behavior).

## Verification

**Commands:**
- `pnpm test:run` -- expected: all tests pass
- `pnpm lint` -- expected: no new errors

## Suggested Review Order

**Room creation seeding**

- Entry point: room + units are created together so a failure cannot leave a room without its PCs.
  [`rooms.ts:32`](../../app/_actions/rooms.ts#L32)

- Unit count is bounded and guarded against room names with no usable prefix.
  [`lab-room.ts:14`](../../lib/validators/lab-room.ts#L14)

- Modal exposes the numeric field and previews the generated unit names.
  [`AddRoomForm.tsx:88`](../../app/dashboard/rooms/components/AddRoomForm.tsx#L88)

- Prefix derivation is centralized and reused by the batch-add flow.
  [`unit-batch.ts:19`](../../lib/unit-batch.ts#L19)

**Report table readability**

- Unit boundaries now get a medium divider, room boundaries keep the thick brand divider.
  [`report-rows.ts:84`](../../app/dashboard/reports/components/report-rows.ts#L84)

- Detailed table consumes the shared row-class helper and the filter now reads "Per Unit".
  [`HardwareReport.tsx:170`](../../app/dashboard/reports/components/HardwareReport.tsx#L170)

**Unit detail navigation**

- Room id is loaded so the badge can target the filtered units view.
  [`page.tsx:26`](../../app/dashboard/units/[id]/page.tsx#L26)

- The former plain-text room label is now a fully clickable badge link.
  [`ComponentsClient.tsx:180`](../../app/dashboard/units/[id]/ComponentsClient.tsx#L180)

**Tests**

- Component, action, report, and license-key regression coverage.
  [`AddRoomForm.test.tsx:30`](../../app/__tests__/epic-2/AddRoomForm.test.tsx#L30)

## Spec Change Log

- 2026-10-24 (follow-up): Added an optional Unit Prefix override to room creation so long room names (e.g. "Laboratory 127A") can produce concise codes; blank still derives from the room name. No frozen intent changed.
