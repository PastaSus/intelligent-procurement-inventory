---
title: 'Remove Download Image and keep PDF-only downloads'
type: 'refactor'
created: '2026-11-02'
status: 'done'
baseline_commit: 'c124d13b4d84e1a0e37ec9b8b218a56d75af9fce'
context:
  - '{project-root}/_bmad-output/project-context.md'
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** Download Image produces one flattened tall PNG of a multi-page A4 document, so the result cannot paginate or print acceptably. Download PDF already exports one page per document page with correct margins.

**Approach:** Remove the Download Image button and the PNG export path everywhere prints can be downloaded; keep Download PDF, Print, and the existing A4 pagination, filenames, loading state, and failure toast unchanged.

## Boundaries & Constraints

**Always:**
- Every print surface exposes **Download PDF**, **Print**, and **Close** only — no "Download Image" button, "as image" aria-label, PNG branch, or `.png` filename path.
- Preserve Download PDF behaviour exactly: same helper, A4 layout, pagination, filenames, "Preparing…" disabled state, and "Could not generate the file. Please try again." toast.
- Keep `deliverBlob` and its mobile-only Web Share gating for the PDF download; keep `renderNodeToCanvas` and `html-to-image`/`jspdf` dynamic imports.
- Keep every existing Print button and print-only document unchanged.

**Ask First:**
- Changing the print preview dialog, A4 sizing, or any layout beyond removing the image button.
- Adding any dependency.

**Never:**
- Touch `prisma/schema.prisma`, migrations, `prisma/seed.ts`, or the untracked `e2e/screenshot.spec.ts`.
- Add server routes/uploads, send document contents anywhere, or log document data.
- Modify the external user-manual files.

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|----------|--------------|---------------------------|----------------|
| Single request preview | Approved request open | Shows Download PDF, Print, Close; no Download Image | N/A |
| List/report preview dialog | Approved list or report open | Shows Download PDF, Print, Close; no Download Image | N/A |
| PDF in progress | Download PDF clicked | Button disabled and labelled "Preparing…" | Re-enables after completion |
| Export failure | PDF generation rejects | Exact existing error toast; buttons re-enable | "Could not generate the file. Please try again." |

</frozen-after-approval>

## Code Map

- `lib/print-export.ts` -- remove `exportNodeAsPng` and its `canvasToBlob` helper; narrow `DocumentExtension` to `'pdf'`; keep PDF export, A4, filenames, `deliverBlob`.
- `components/PrintPreviewDialog.tsx` -- remove the image button/import and PNG branch; export PDF only; pending state becomes a boolean.
- `app/dashboard/purchase-requests/components/PurchaseRequestPrint.tsx` -- same removal in the single-request preview; export PDF only.
- `app/__tests__/epic-6/PurchaseRequestPrint.test.tsx` -- drop image-button assertions; keep PDF, loading, and error coverage.
- `app/__tests__/epic-6/PurchaseRequestsClient.test.tsx` -- drop image-button assertions in the dialog flow.
- `app/__tests__/reports/HardwareReport.test.tsx`, `app/__tests__/reports/SparePartsReport.test.tsx` -- drop image-button assertions.
- `components/PrintPreviewDialog.test.tsx` -- remove PNG mocks/tests; keep PDF, loading, error, close.
- `lib/print-export.test.ts` -- remove PNG export/filename tests and the unused `toBlob` mock; keep PDF/share/A4 coverage.

## Tasks & Acceptance

**Execution:**
- [ ] `lib/print-export.ts` -- delete `exportNodeAsPng` and `canvasToBlob`; set `DocumentExtension = 'pdf'`; leave the PDF path and share gating intact.
- [ ] `components/PrintPreviewDialog.tsx` -- remove `exportNodeAsPng`/`ImageDown`; change `handleExport` to PDF-only and `pendingExport` to a boolean; delete the image Button.
- [ ] `app/dashboard/purchase-requests/components/PurchaseRequestPrint.tsx` -- remove `exportNodeAsPng`/`ImageDown`; PDF-only `handleExport`; delete the image Button.
- [ ] Update the five test files in the Code Map: remove PNG imports, mocks, button queries, and filename assertions; keep and adjust PDF/loading/error tests.

**Acceptance Criteria:**
- Given the single request preview or the shared preview dialog, when it renders, then only Download PDF, Print, and Close appear (no Download Image, no `as image` label).
- Given Download PDF, when clicked, then the same PDF export helper, filename, A4 pagination, loading state, and failure toast are used.
- Given the codebase, when searched for the PNG export path, then `exportNodeAsPng` and the `.png` download path no longer exist.
- Given the existing PDF export, A4 constants, filename helpers (PDF), and mobile share gating, then their behaviour and tests are unchanged.

## Spec Change Log

## Design Notes

- The shared `PrintPreviewDialog` already backs the approved-requests list and both reports, so one dialog edit covers three surfaces; only the single-request preview needs its own edit.
- Keep `deliverBlob` generic (Blob + filename); removing PNG means only PDF blobs call it.

## Verification

**Commands:**
- `pnpm test:run lib/print-export.test.ts components/PrintPreviewDialog.test.tsx app/__tests__/epic-6/PurchaseRequestPrint.test.tsx app/__tests__/epic-6/PurchaseRequestsClient.test.tsx app/__tests__/reports/HardwareReport.test.tsx app/__tests__/reports/SparePartsReport.test.tsx` -- all pass
- `pnpm test:run` -- full suite green
- `pnpm lint` -- no errors
- `npx tsc --noEmit` -- no new errors (report the pre-existing test-file errors if still present)
- `pnpm build` -- succeeds

**Manual checks:**
- Scratch DB: open an approved request and each report/list preview → only Download PDF is present; the PDF still opens with letterhead, table, and signatures.

## Suggested Review Order

1. `lib/print-export.ts` — `DocumentExtension` is now `'pdf'`; `exportNodeAsPng` and `canvasToBlob` are deleted; `exportNodeAsPdf`, `renderNodeToCanvas`, and mobile-gated `deliverBlob` are untouched.
2. `components/PrintPreviewDialog.tsx` — image button/import removed; `pendingExport` state collapsed to `isExporting`; PDF button drives the shared spinner and toast.
3. `app/dashboard/purchase-requests/components/PurchaseRequestPrint.tsx` — same removal plus an `exportingRef` guard so rapid double clicks cannot start two PDF captures.
4. `lib/print-export.test.ts` — PNG cases dropped; PDF filenames and `deliverBlob` coverage retained.
5. `components/PrintPreviewDialog.test.tsx`, `app/__tests__/epic-6/PurchaseRequestPrint.test.tsx` — assert only PDF renders (no `as image` control) and the preparing state re-enables.
6. `app/__tests__/epic-6/PurchaseRequestsClient.test.tsx`, `app/__tests__/reports/HardwareReport.test.tsx`, `app/__tests__/reports/SparePartsReport.test.tsx` — mocks and preparing-state flows updated for PDF-only.
7. `_bmad-output/implementation-artifacts/deferred-work.md` — follow-up for the single-request preview allowing close mid-export.
