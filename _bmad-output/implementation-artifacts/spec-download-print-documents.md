---
title: 'Download PDF and Image for print documents'
type: 'feature'
created: '2026-10-31'
status: 'done'
baseline_commit: '91d3fe1'
context:
  - '{project-root}/_bmad-output/project-context.md'
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** The app prints several documents with `window.print()` and print-only CSS (purchase request print preview, approved-requests list print, Hardware Inventory Report, Spare Parts & Replacement Report). Mobile users get the browser's awkward print dialog, and there is no way to save a document as a file.

**Approach:** Add "Download PDF" and "Download Image" buttons next to the existing Print button (which stays unchanged). Client-side only — no server upload, no new API routes, no data sent anywhere, no logging of document contents. Render a dedicated fixed-width paper container (A4 at 96dpi) so layout does not depend on the phone's screen width, using ONE constant for paper size that matches the existing `@page` size in the print CSS. The preview and the export use the SAME DOM node (what you see is what you download), shown scaled to fit the dialog with a CSS transform. Use `html-to-image` to rasterise and `jspdf` for the PDF; do NOT use html2canvas. Before capture, wait for `document.fonts.ready` and for all images (UL and CCS logos) to load, and use pixelRatio 2 to 3. The PDF has one page per document page with the image scaled to page width and correct margins; the image download is a PNG. On mobile use the Web Share sheet when `navigator.canShare({ files })` is supported, otherwise a normal download link; handle iOS Safari by opening the file in a new tab if a download is not possible. File names are `PR-YYYYMMDD-XXXX.pdf/.png` for a request and `procurvin-approved-requests-YYYY-MM-DD.pdf` for the list. Buttons show a "Preparing..." state and are disabled while generating, show a toast on failure, are keyboard accessible with aria-labels, reuse existing shadcn components and styles, and are hidden in the printed output itself. Load the new libraries with dynamic `import()` only when a download button is clicked so they stay out of the main bundle.

Required scope: the single purchase request print preview (approved request) and the approved-requests list print — DONE.
Phase 2 (both reports): DONE — Download PDF/Image buttons added to HardwareReport and SparePartsReport, split at table-row boundaries via `planPageSlices`/`collectBreakOffsets`, never through the middle of a row.

</frozen-after-approval>

## Boundaries & Constraints

**Always:**
- Client-side only; no server upload, no new API routes, no data sent anywhere, no logging of document contents.
- The existing Print button and `window.print()` flow stay unchanged.
- Buttons are hidden in the printed output itself.
- Load `html-to-image` and `jspdf` with dynamic `import()` only on click.
- Wait for `document.fonts.ready` and all images before capture; use pixelRatio 2–3.
- A4 paper size at 96dpi, one constant shared between preview and export.
- Preview and export use the SAME DOM node; scaled to fit via CSS transform.
- File names: `PR-YYYYMMDD-XXXX.pdf` / `.png` for a request; `procurvin-approved-requests-YYYY-MM-DD.pdf` for the list.
- "Preparing..." state + disabled while generating; toast on failure; aria-labels; shadcn components.

**Never:**
- Do not add a server route or send document contents anywhere.
- Do not use html2canvas.
- Do not change the existing Print button behaviour.
- Do not hardcode colours that Tailwind 4 renders incorrectly — switch print components to explicit hex if colours render wrong.

**Ask First:**
- Whether phase 2 (the two reports) should be included in this branch or a follow-up.

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|----------|--------------|---------------------------|----------------|
| Click Download PDF on PR preview | Approved request open | PDF downloads named `PR-YYYYMMDD-XXXX.pdf` | Toast on failure |
| Click Download Image on PR preview | Approved request open | PNG downloads named `PR-YYYYMMDD-XXXX.png` | Toast on failure |
| Click Download PDF on list | Approved requests exist | PDF downloads named `procurvin-approved-requests-YYYY-MM-DD.pdf` | Toast on failure |
| Button while generating | Export in progress | Button disabled, shows "Preparing…" | N/A |
| Export fails | html-to-image/jspdf error | Error toast, button re-enabled | Catch and toast |
| Mobile viewport | 390x844 | Web Share sheet if supported, else download link; iOS Safari opens in new tab if needed | Fallback to normal download |
| Printed output | window.print() | Download buttons hidden, print-only CSS unchanged | N/A |

## Code Map

- `lib/print-export.ts` — NEW: `A4` constant, `exportNodeAsPdf`, `exportNodeAsPng`, `planPageSlices`, `collectBreakOffsets`, `requestDocumentFileName`, `approvedRequestsFileName`, `deliverBlob`
- `lib/print-export.test.ts` — NEW: Vitest unit tests for file-name helpers and paper-size constant
- `app/dashboard/purchase-requests/components/PurchaseRequestPrint.tsx` — Add Download PDF/Image buttons next to Print in the preview modal
- `app/dashboard/purchase-requests/PurchaseRequestsClient.tsx` — Add Download PDF/Image buttons for the approved-requests list print
- `app/__tests__/epic-6/PurchaseRequestPrint.test.tsx` — Extended: export buttons render, call export, loading state, error handling
- `app/__tests__/epic-6/PurchaseRequestsClient.test.tsx` — Extended: export buttons render, call export, loading state, error handling
- `package.json`, `pnpm-workspace.yaml`, `vitest.setup.ts` — New dependencies: `html-to-image`, `jspdf`

## Tasks & Acceptance

**Execution:**
- [ ] `lib/print-export.ts` — A4 constant, exportNodeAsPdf, exportNodeAsPng, planPageSlices, collectBreakOffsets, requestDocumentFileName, approvedRequestsFileName, deliverBlob
- [ ] `lib/print-export.test.ts` — Unit tests for A4 constant and file-name helpers
- [ ] `PurchaseRequestPrint.tsx` — Download PDF and Image buttons next to Print; dynamic import of html-to-image/jspdf; fonts.ready + image wait; pixelRatio; Preparing state; toast on error; aria-labels; hidden in print output
- [ ] `PurchaseRequestsClient.tsx` — Download PDF and Image buttons for the approved-requests list print; same patterns
- [ ] `PurchaseRequestPrint.test.tsx` — Component tests with html-to-image and jspdf mocked: buttons render, call export, loading state, error handling
- [ ] `PurchaseRequestsClient.test.tsx` — Component tests with html-to-image and jspdf mocked: buttons render, call export, loading state, error handling
- [ ] Update `package.json` / `pnpm-workspace.yaml` with new dependencies
- [ ] Update `vitest.setup.ts` if needed for new test environment

**Acceptance Criteria:**
- Given an approved PR open in print preview, when Download PDF is clicked, then a PDF named `PR-YYYYMMDD-XXXX.pdf` downloads
- Given an approved PR open in print preview, when Download Image is clicked, then a PNG named `PR-YYYYMMDD-XXXX.png` downloads
- Given approved requests exist, when Download PDF is clicked on the list, then a PDF named `procurvin-approved-requests-YYYY-MM-DD.pdf` downloads
- Given an export is in progress, when the button is clicked again, then it is disabled and shows "Preparing…"
- Given an export fails, when the error occurs, then a toast is shown and the button re-enables
- Given the printed output, when window.print() runs, then the download buttons are not visible
- Given `pnpm vitest run` on the new test files, then all tests pass

## Verification

**Commands:**
- `pnpm test:run` — expected: all Vitest suites pass (except pre-existing AIChat failure)
- `pnpm lint` — expected: no new eslint errors in touched files
- `pnpm build` — expected: production build succeeds

**Manual checks (scratch database only):**
- Approve a request, open print preview on desktop, download PDF and PNG, open the PDF and confirm letterhead, logos, table and four signature blocks are visible and sharp
- Approve a request, open print preview at 390x844 mobile viewport, download PDF and PNG
- Download the approved-requests list as PDF on desktop and mobile

## Spec Change Log

- 2026-10-31: Initial spec drafted from working-tree changes on `feat/download-print-documents` (not yet committed, not previously documented in bmad-method)
