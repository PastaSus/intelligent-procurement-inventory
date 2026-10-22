---
title: 'Defense revision: corrected signatory chain and bottom placement'
type: 'feature'
created: '2026-10-22'
status: 'done'
route: 'one-shot'
baseline_commit: 'a4a057e'
---

# Defense revision: corrected signatory chain and bottom placement

## Intent

**Problem:** The first relayout attempt used the wrong roles and left the signature section floating mid-page. The panel requires four signatories — Prepared by (SA), Checked by (Technician), Recommended by (Lab Admin), Approved by (Dean) — with the role printed below the signature line, handwritten names above it, and the whole row pinned to the bottom of the printed page.

**Approach:** Reduce to four blocks in a single justified row, drop the typed-name editor and the pre-filled dean name, print the signer title under the underline, and make the single-PR print letter a full-height flex column with the signature row pushed to the bottom.

## Suggested Review Order

**Signatory content**

- Four roles replace the old five; each carries its signer title for printing under the line.
  [`SignatoryBlocks.tsx:5`](../../app/dashboard/purchase-requests/components/SignatoryBlocks.tsx#L5)

- Handwriting space above the line; signer title below it; no typed-name inputs.
  [`SignatoryBlocks.tsx:14`](../../app/dashboard/purchase-requests/components/SignatoryBlocks.tsx#L14)

**Bottom placement**

- Single-PR letter is now a full-height flex column so the signature row can be pushed down.
  [`PurchaseRequestPrint.tsx:46`](../../app/dashboard/purchase-requests/components/PurchaseRequestPrint.tsx#L46)

- Print-only rule pins the signatory row to the bottom of the A4 page regardless of content length.
  [`globals.css:166`](../../app/globals.css#L166)

**Shared footer**

- Print list reuses the same four-block footer and no longer carries editable names.
  [`PurchaseRequestsClient.tsx:67`](../../app/dashboard/purchase-requests/PurchaseRequestsClient.tsx#L67)

**Test coverage**

- Asserts the four roles, signer titles, absence of name inputs, and single-row order in the single-PR letter.
  [`PurchaseRequestPrint.test.tsx:57`](../../app/__tests__/epic-6/PurchaseRequestPrint.test.tsx#L57)

- Asserts the shared footer contracts and that no editor reaches print output.
  [`PurchaseRequestsClient.test.tsx:221`](../../app/__tests__/epic-6/PurchaseRequestsClient.test.tsx#L221)
