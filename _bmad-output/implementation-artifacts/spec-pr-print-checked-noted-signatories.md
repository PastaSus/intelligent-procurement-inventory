---
title: 'PR Print Checked and Noted Signatories'
type: 'feature'
created: '2026-10-11'
status: 'done'
baseline_commit: '9b0ebbf1bd71f35560033000fa8b451e8ffd3426'
context: []
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** Professor consultation requires the printed Purchase Request letter to show Checked by Administrator and Noted by Diosdado C. Caronongan, but the letter only shows Prepared / Approved / Vice-President.

**Approach:** Add Checked by (Administrator) and Noted by (Diosdado C. Caronongan) as extra signature blocks in the PurchaseRequestPrint letter body, keeping existing blocks unchanged.

## Boundaries & Constraints

**Always:** Keep existing 3 labels verbatim; use exact strings `Checked by (Administrator)` and `Noted by (Diosdado C. Caronongan)`; keep single LetterBody reused by preview modal and print-only div; keep A4 print CSS with break-inside avoid.

**Ask First:** If 5 blocks do not fit one row on A4 and need wrap to 3+2 rows; if titles/positions under names are later required.

**Never:** Do not touch HardwareReport print; do not touch PR list summary print-only section; do not change DB schema, server actions, or notes logic; do not rename existing signature labels.

</frozen-after-approval>

## Code Map

- `app/dashboard/purchase-requests/components/PurchaseRequestPrint.tsx` -- LetterBody signature-blocks array, rendered in both preview modal and print-only div
- `app/__tests__/epic-6/PurchaseRequestPrint.test.tsx` -- existing signature-blocks test asserting 3 labels, must be extended to 5
- `app/globals.css` -- print CSS for `.pr-print-letter .signature-blocks` with break-inside avoid, no change expected unless wrapping breaks

## Tasks & Acceptance

**Execution:**
- [x] `app/dashboard/purchase-requests/components/PurchaseRequestPrint.tsx` -- extend signature-blocks array from 3 to 5 in professor order, ensure flex layout wraps cleanly on A4 -- professor-required signatories missing from print
- [x] `app/__tests__/epic-6/PurchaseRequestPrint.test.tsx` -- extend signature test to assert Checked by (Administrator) and Noted by (Diosdado C. Caronongan) render -- prevents regression

**Acceptance Criteria:**
- Given any PR opened in print preview, when LetterBody renders, then 5 blocks appear in order: Prepared by (Requester), Checked by (Administrator), Approved by (Laboratory Head), Noted by (Diosdado C. Caronongan), Vice-President
- Given window.print from preview, when print-only div renders, then identical 5 blocks print with signature line, printed-name label, and date line
- Given `pnpm vitest run` on PurchaseRequestPrint suite, when executed, then all tests pass

## Spec Change Log

## Design Notes

Order follows Philippine academic routing: prepare -> check -> approve -> note. Five `flex-1` blocks in a `flex justify-between gap-8` row will squeeze on 210mm; allow `flex-wrap` so it degrades to 3+2 on narrow print rather than overflowing. Example target:

```
['Prepared by (Requester)', 'Checked by (Administrator)', 'Approved by (Laboratory Head)', 'Noted by (Diosdado C. Caronongan)', 'Vice-President']
```

## Verification

**Commands:**
- `pnpm vitest run app/__tests__/epic-6/PurchaseRequestPrint.test.tsx` -- expected: all tests pass including new 5-block assertions
- `pnpm lint` -- expected: no new eslint errors in touched files

## Suggested Review Order

- Five-block signature order with wrap-safe flex layout
  [`PurchaseRequestPrint.tsx:101`](../../../../app/dashboard/purchase-requests/components/PurchaseRequestPrint.tsx#L101)

- Extended coverage for Checked-by and Noted-by blocks
  [`PurchaseRequestPrint.test.tsx:44`](../../../../app/__tests__/epic-6/PurchaseRequestPrint.test.tsx#L44)
