---
title: 'Download the print-layout screen as PDF/PNG (not the on-screen page)'
type: 'bugfix'
created: '2026-11-01'
status: 'done'
baseline_commit: '6a318b89512e369c9b9b2b975e153bb00942fece'
context:
  - '{project-root}/_bmad-output/project-context.md'
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** The merged Download PDF/Image buttons export the wrong node. The Hardware and Spare Parts reports rasterise the entire on-screen page section (filter selects, summary cards, action buttons), so the file is a screenshot of the web page — not the letterhead print document. The approved-requests list exports a hidden off-screen copy, so users never see the print layout they download. Only the single purchase-request preview exports the visible paper node. Human renegotiated intent: the print-layout screen itself must be downloadable — what you see is what you download — not the page as an image/PDF.

**Approach:** Add one reusable print-preview dialog that renders the existing print document inside a fixed-width A4 paper node, scaled to fit with a CSS transform. The approved-requests list and both reports open it from a new "Print Preview" button; its Download PDF / Download Image buttons export that same visible paper node. All existing Print buttons and the single-PR preview stay unchanged.

## Boundaries & Constraints

**Always:**
- Client-side only: no server upload, no new API routes, no data sent anywhere, no logging of document contents.
- Reuse the existing `A4` constant and filename helpers from `lib/print-export.ts`; its value matches the `@page { size: A4 }` print CSS. A4 stays the single paper-size source for preview and export.
- Preview and export use the SAME visible DOM node (`paperRef`); export helpers already wait for fonts/images and use pixelRatio 3.
- Libraries stay dynamically imported inside `lib/print-export.ts` only.
- Keep `lib/print.ts`, `window.print()` flows and every existing print-only document unchanged.
- Download buttons are hidden in printed output (`report-no-print`), keyboard accessible, have aria-labels, show "Preparing…" and disable while generating, and toast on failure.
- Reuse shadcn `Button` and `useToast`. Filenames come from `approvedRequestsFileName`, `hardwareReportFileName`, `sparePartsReportFileName`.

**Ask First:**
- Anything that changes the single-PR preview, an existing Print button's label/behaviour, or the print CSS `@page` size.
- Adding any new dependency.

**Never:**
- Use html2canvas, or rasterise an on-screen page section instead of the print document.
- Add server routes, send document contents anywhere, or log them.
- Modify `prisma/schema.prisma`, migrations, or `prisma/seed.ts`.

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|----------|--------------|---------------------------|----------------|
| Open preview | List has approved requests / report has rows | Dialog shows the A4 letterhead layout scaled to fit | Print Preview disabled when no rows |
| Download PDF | Dialog open | PDF named by the existing helper, one page per document page | Failure toast, buttons re-enable |
| Download Image | Dialog open | PNG named by the existing helper | Failure toast |
| Generating | Export in progress | Both download buttons disabled, label "Preparing…" | N/A |
| Printed output | Dialog open, `window.print()` | Dialog hidden; existing print-only document prints | N/A |
| Empty list | No approved requests | Preview button disabled, no dialog | N/A |

</frozen-after-approval>

## Code Map

- `components/PrintPreviewDialog.tsx` -- NEW: modal with A4 paper node, scale-to-fit, Download PDF/Image/Print/Close, pending state, toast.
- `app/dashboard/purchase-requests/PurchaseRequestsClient.tsx` -- replace page-level download buttons + hidden export node with a "Print Preview" button opening the dialog; keep Print List and print-only list.
- `app/dashboard/reports/components/HardwareReport.tsx` -- replace page-level download buttons with Print Preview dialog rendering `HardwareReportPrint`; keep Print and print-only.
- `app/dashboard/reports/components/HardwareReportPrint.tsx` -- optional `embedded` prop drops its outer `p-8 max-w-[210mm]`.
- `app/dashboard/reports/spare-parts/SparePartsReport.tsx` -- same replacement as hardware.
- `app/dashboard/reports/spare-parts/SparePartsReportPrint.tsx` -- optional `embedded` prop.
- `app/__tests__/epic-6/PurchaseRequestsClient.test.tsx` -- update export assertions to the dialog flow.
- `app/__tests__/reports/HardwareReport.test.tsx`, `app/__tests__/reports/SparePartsReport.test.tsx` -- add dialog export coverage.
- `components/PrintPreviewDialog.test.tsx` -- NEW: buttons render, export called, loading state, error toast, close.
- `lib/print-export.ts` -- reuse as-is except `collectBreakOffsets`, which normalizes rect offsets by the node's ancestor transform scale so preview scaling cannot corrupt page breaks.

## Tasks & Acceptance

**Execution:**
- [x] `components/PrintPreviewDialog.tsx` -- build reusable dialog: `report-no-print` overlay, title, Download PDF/Image/Print/Close, `ResizeObserver` scale (reuse `PREVIEW_PADDING = 16`), A4 paper with `pr-print-letter pr-print-letter-paged` + `A4.marginPx` padding, export via dynamic `exportNodeAsPdf/Png`, Escape/backdrop close.
- [x] `PurchaseRequestsClient.tsx` -- drop `pendingListExport`, `listExportRef`, offscreen export container and page-level download buttons; add `isPreviewOpen` + "Print Preview" button; render dialog with `PrintRequestListContent`.
- [x] `HardwareReport.tsx` / `SparePartsReport.tsx` -- drop page-level download buttons and export refs; add "Print Preview" + dialog with the print component (`embedded`); keep Print/print-only.
- [x] `HardwareReportPrint.tsx` / `SparePartsReportPrint.tsx` -- add `embedded?: boolean`; default markup unchanged.
- [x] Update/new tests listed in the Code Map.

**Acceptance Criteria:**
- Given the approved-requests list, when Print Preview is clicked, then the dialog shows the A4 print layout and Download PDF/Image export that visible node (`pr-print-letter`), not `.report-no-print`.
- Given either report, when its preview is opened, then the downloaded file contains the letterhead document (logos, title, tables, signatures), not filters/cards/buttons.
- Given the single purchase-request preview, when it is opened, then behaviour is unchanged.
- Given a dialog is open, when `window.print()` runs, then only the existing print-only document prints.
- Given an export fails, then the exact toast "Could not generate the file. Please try again." appears and buttons re-enable.

## Design Notes

This spec supersedes the intent recorded in `spec-download-print-documents.md` (status: done). The print components keep their default `p-8 max-w-[210mm] mx-auto` root classes for the print-only path; `embedded` only removes them so the dialog's A4 paper owns the margins. Export must target `paperRef` — the visible scaled node — never `.report-no-print` or a hidden off-screen copy. Because `paperRef` sits under a `transform: scale()`, `collectBreakOffsets` divides measured rect offsets by the node's transform scale before `planPageSlices` compares them with unscaled canvas height.

## Verification

**Commands:**
- `pnpm test:run` -- all Vitest suites pass (pre-existing AIChat failure may remain, unrelated)
- `pnpm lint` -- no new errors in touched files
- `npx tsc --noEmit` -- no type errors
- `pnpm build` -- production build succeeds

**Manual checks (scratch database only):**
- Approve a request; open list Print Preview, download PDF/PNG; open the PDF and confirm letterhead, logos, table and four signature blocks are sharp.
- Open both report previews at 390x844; download PDF/PNG and confirm the letterhead document is captured.
- Print from an open dialog and confirm the dialog is absent from the print preview.

## Suggested Review Order

**Shared preview shell**

- Export handler targets the visible paper node and guards re-entry while an export runs.
  [`PrintPreviewDialog.tsx:85`](../../components/PrintPreviewDialog.tsx#L85)

- A4 paper is scaled to fit with `useLayoutEffect` measuring so mobile does not flash an unscaled page.
  [`PrintPreviewDialog.tsx:61`](../../components/PrintPreviewDialog.tsx#L61)

- Dialog traps Tab, focuses the panel, restores focus, and blocks close/backdrop while exporting.
  [`PrintPreviewDialog.tsx:109`](../../components/PrintPreviewDialog.tsx#L109)

**Call sites**

- Approved-requests list opens the dialog instead of exporting a hidden off-screen copy.
  [`PurchaseRequestsClient.tsx:295`](../../app/dashboard/purchase-requests/PurchaseRequestsClient.tsx#L295)

- Hardware report preview renders the real letterhead document with export disabled during filter loads.
  [`HardwareReport.tsx:132`](../../app/dashboard/reports/components/HardwareReport.tsx#L132)

- Spare parts report preview mirrors the hardware flow, including the pending-filter guard.
  [`SparePartsReport.tsx:153`](../../app/dashboard/reports/spare-parts/SparePartsReport.tsx#L153)

**Print documents**

- `embedded` drops only the outer padding/max-width so the dialog paper owns the margins.
  [`HardwareReportPrint.tsx:48`](../../app/dashboard/reports/components/HardwareReportPrint.tsx#L48)

- Same `embedded` treatment for the spare parts letterhead.
  [`SparePartsReportPrint.tsx:41`](../../app/dashboard/reports/spare-parts/SparePartsReportPrint.tsx#L41)

**Export math**

- Break offsets are normalized by the ancestor transform scale so scaled previews paginate correctly.
  [`print-export.ts:106`](../../lib/print-export.ts#L106)

**Tests**

- Dialog render, export node, loading, print, error, close, and canExport coverage.
  [`PrintPreviewDialog.test.tsx:45`](../../components/PrintPreviewDialog.test.tsx#L45)

- List and report tests assert the dialog exports the `pr-print-letter` node and report empty-state disables.
  [`HardwareReport.test.tsx:342`](../../app/__tests__/reports/HardwareReport.test.tsx#L342)
