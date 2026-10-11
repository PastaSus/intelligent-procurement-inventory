---
title: 'PR Shared Signatory Footer for Letter and List'
type: 'feature'
created: '2026-10-11'
status: 'done'
baseline_commit: 'db1d36b187f1992e4173b7775d0ea4eef1c2944f'
context: []
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** Signatory blocks (Checked by, Noted by Dean) exist only on the single-PR letter with a non-standard layout (role and name merged in one line), while the Print List summary has no signatories at all.

**Approach:** Extract one shared signatory footer with the correct Philippine form layout (role header, signature space, printed name on the ruled line, caption, date) and use it in both the PR letter and the Print List, with typeable names in both.

## Boundaries & Constraints

**Always:** Five blocks in academic routing order Prepared by, Checked by, Approved by, Noted by, Vice-President; Noted-by pre-filled `Diosdado C. Caronongan` but editable; role header fixed while name is typeable; every print surface keeps A4 `break-inside: avoid` on the footer; names typed on screen must appear identically in print.

**Ask First:** If the footer pushes a short list or letter onto a second printed page; if a typeable Designation line is later required under names.

**Never:** No designation line in this pass (role headers carry position; keeps footer to A4 one page); do not touch HardwareReport print; do not change DB schema, server actions, or PR status logic; do not persist names to the database (session-only state).

</frozen-after-approval>

## Code Map

- `app/dashboard/purchase-requests/components/SignatoryBlocks.tsx` -- NEW shared footer: stacked PH layout, editable/static modes, single source for letter + list
- `app/dashboard/purchase-requests/components/PurchaseRequestPrint.tsx` -- adopt shared footer, keep names state + noted default + preview/print-only wiring
- `app/dashboard/purchase-requests/PurchaseRequestsClient.tsx` -- add names state, compact report-no-print editor card, footer inside PrintRequestList print-only
- `app/__tests__/epic-6/PurchaseRequestPrint.test.tsx` -- update to shared footer selectors
- `app/__tests__/epic-6/PurchaseRequestsClient.test.tsx` -- extend print-only summary assertions to footer roles + typed-name sync
- `app/globals.css` -- existing `.pr-print-letter .signature-blocks` avoid-break CSS, extend only if wrap misbehaves

## Tasks & Acceptance

**Execution:**
- [x] `app/dashboard/purchase-requests/components/SignatoryBlocks.tsx` -- create shared footer with role header, signature space, name on ruled line, caption, date, editable/static modes -- eliminates duplicated divergent layouts
- [x] `app/dashboard/purchase-requests/components/PurchaseRequestPrint.tsx` -- replace inline blocks with shared footer, preserve noted default and preview-to-print sync -- letter keeps working, layout corrected
- [x] `app/dashboard/purchase-requests/PurchaseRequestsClient.tsx` -- wire shared footer into PrintRequestList plus on-screen editor card -- list print gains signatories without cluttering the working screen
- [x] `app/__tests__/epic-6/PurchaseRequestPrint.test.tsx` + `app/__tests__/epic-6/PurchaseRequestsClient.test.tsx` -- cover corrected layout, dean default, typed-name print sync on both surfaces -- prevents regression

**Acceptance Criteria:**
- Given the letter preview, when rendered, then each block shows role header, signature space, name on the ruled line, caption, and date in that order
- Given a name typed in either editor, when printing, then the printed paper shows the typed name on the ruled line
- Given the Print List page, when printed, then the summary ends with the same 5-block footer
- Given `pnpm vitest run app/__tests__/epic-6`, when executed, then all suites pass

## Spec Change Log

## Design Notes

Per COA/GAM-style PH forms the name lives on the ruled line under a fixed role header; blocks wrap 3+2 on A4 rather than squeezing five across. Golden shape per block:

```
<div>Checked by</div>
<div h-12 />  (sign here)
<input|text name on border-t line />
<p>Signature over printed name</p>
<p>Date: ___</p>
```

## Verification

**Commands:**
- `pnpm vitest run app/__tests__/epic-6` -- expected: all suites pass including new footer assertions
- `pnpm lint` -- expected: no new eslint errors in touched files

## Suggested Review Order

**Shared footer extraction**

- Single source for both print surfaces with corrected stacked layout
  [`SignatoryBlocks.tsx:26`](../../app/dashboard/purchase-requests/components/SignatoryBlocks.tsx#L26)

**Letter adoption**

- Letter delegates to shared footer, state defaults preserved
  [`PurchaseRequestPrint.tsx:110`](../../app/dashboard/purchase-requests/components/PurchaseRequestPrint.tsx#L110)

**List adoption**

- Editor card plus footer in the print-only summary
  [`PurchaseRequestsClient.tsx:296`](../../app/dashboard/purchase-requests/PurchaseRequestsClient.tsx#L296)

- Per-request modal isolation
  [`PurchaseRequestsClient.tsx:446`](../../app/dashboard/purchase-requests/PurchaseRequestsClient.tsx#L446)

**Tests**

- Footer and sync coverage on both surfaces
  [`PurchaseRequestsClient.test.tsx:221`](../../app/__tests__/epic-6/PurchaseRequestsClient.test.tsx#L221)
