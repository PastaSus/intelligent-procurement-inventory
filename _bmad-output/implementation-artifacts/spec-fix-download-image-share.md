---
title: 'Fix Download Image opening the desktop share sheet'
type: 'bugfix'
created: '2026-11-02'
status: 'done'
baseline_commit: 'da7588e7d94602d576d40944d821d61908f7f155'
context:
  - '{project-root}/_bmad-output/project-context.md'
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** On desktop Windows (and any desktop browser that advertises file-sharing support), clicking **Download Image** calls the Web Share API, so the OS share sheet / Phone Link dialog opens and then vanishes instead of saving the PNG. The original requirement was to use the share sheet on mobile only.

**Approach:** Detect mobile devices in `deliverBlob` and attempt `navigator.share({ files })` only there; every desktop click goes straight to the normal anchor download. Keep the existing iOS Safari new-tab fallback and AbortError handling.

## Boundaries & Constraints

**Always:**
- Desktop (Windows/macOS/Linux) must never call `navigator.share`; it downloads via the anchor fallback.
- Mobile (Android, iPhone/iPad, including iPadOS desktop-mode UA) keeps the Web Share sheet when `navigator.canShare({ files })` is true.
- If sharing is unavailable or rejects with a non-AbortError, fall back to the existing download path; AbortError stays silent.
- Keep filenames, blob types, `noopener`, and object-URL revocation unchanged.
- Add mobile detection and the gate inside `lib/print-export.ts` only; leave PDF/A4/preview code untouched.

**Ask First:**
- Changing PDF generation, A4 layout, preview dialogs, button labels, or adding any dependency.

**Never:**
- Use `html2canvas`, add server routes/uploads, send document contents anywhere, or log document data.
- Touch `prisma/schema.prisma`, migrations, `prisma/seed.ts`, or the untracked `e2e/screenshot.spec.ts`.

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|----------|--------------|---------------------------|----------------|
| Desktop download | Desktop UA, `canShare` returns true | Anchor download with the PNG filename; `navigator.share` never called | N/A |
| Mobile share | Mobile UA, `canShare` returns true | `navigator.share({ files })` opens the share sheet | AbortError → silent; other rejection → anchor download |
| Mobile without share | Mobile UA, no `canShare` | Anchor download | N/A |
| iPadOS desktop UA | `Macintosh` UA, `maxTouchPoints > 1`, share supported | Share sheet (treated as mobile) | As mobile |
| iOS Safari fallback | iOS Safari cannot anchor-download | Open the blob URL in a new tab | N/A |

</frozen-after-approval>

## Code Map

- `lib/print-export.ts` -- add mobile-device detection and gate the Web Share branch in `deliverBlob`; leave export/PDF helpers untouched.
- `lib/print-export.test.ts` -- update the share test to a mobile UA; add desktop regression, mobile-without-share, and rejection-fallback coverage.

## Tasks & Acceptance

**Execution:**
- [x] `lib/print-export.ts` -- add an internal mobile check (UA match for Android/iPhone/iPad/iPod/Mobile/Opera Mini/IEMobile/Windows Phone, plus `Macintosh` + `maxTouchPoints > 1` for iPadOS) and require it before attempting `navigator.share`.
- [x] `lib/print-export.test.ts` -- stub `navigator.userAgent` per case; assert share on mobile, no share + anchor download on desktop, anchor download when share is unsupported, anchor download on non-Abort rejection, and silence on AbortError.

**Acceptance Criteria:**
- Given a desktop UA and `canShare({ files })` returning true, when Download Image runs, then no share dialog opens and the PNG downloads through the anchor path.
- Given a mobile UA with file-sharing support, when Download Image runs, then the Web Share sheet is invoked with the PNG and no anchor click occurs.
- Given a mobile UA without file-sharing support, when Download Image runs, then the anchor download path is used.
- Given `navigator.share` rejects with a non-AbortError, then the anchor download still runs.
- Given the existing PDF/PNG export, A4 constants, and filename helpers, then their behavior and tests are unchanged.

## Spec Change Log

## Design Notes

- `navigator.canShare` is not a reliable "is mobile" signal: Windows Edge/Chrome support file sharing and surface the OS share UI. UA-based detection keeps desktop downloads deterministic.
- jsdom reports a non-mobile UA, so each test must override `navigator.userAgent` explicitly.

## Verification

**Commands:**
- `pnpm test:run lib/print-export.test.ts` -- all pass
- `pnpm test:run` -- full suite still green (one known-flaky AIChat test may be unrelated; report it)
- `pnpm lint` -- no errors
- `npx tsc --noEmit` -- no type errors
- `pnpm build` -- succeeds

**Manual checks:**
- Scratch DB, desktop Windows: open an approved request, Download Image → no share/Phone Link dialog; PNG downloads and opens.
- DevTools 390x844 mobile emulation: Download Image opens the share sheet where supported, otherwise downloads.

## Suggested Review Order

**Share gating**

- Mobile detection keys off the UA because `canShare` is true on desktop too.
  [`print-export.ts:179`](../../lib/print-export.ts#L179)

- Desktop now skips the share branch and falls through to the existing download.
  [`print-export.ts:196`](../../lib/print-export.ts#L196)

**Regression coverage**

- Per-test navigator cleanup prevents UA/capability leakage between cases.
  [`print-export.test.ts:128`](../../lib/print-export.test.ts#L128)

- Mobile share happy path, now with an Android UA.
  [`print-export.test.ts:166`](../../lib/print-export.test.ts#L166)

- Core regression test: Windows UA with `canShare` true must download, not share.
  [`print-export.test.ts:184`](../../lib/print-export.test.ts#L184)

- iPadOS desktop-mode branch (`Macintosh` + `maxTouchPoints`) still shares.
  [`print-export.test.ts:203`](../../lib/print-export.test.ts#L203)

- Mobile without file sharing falls back to a download.
  [`print-export.test.ts:220`](../../lib/print-export.test.ts#L220)

- Non-Abort share failure falls back; AbortError stays silent.
  [`print-export.test.ts:235`](../../lib/print-export.test.ts#L235)
  [`print-export.test.ts:254`](../../lib/print-export.test.ts#L254)
