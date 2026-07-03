---
title: 'Apply UX Department Brand Palette'
type: 'feature'
created: '2026-07-03'
baseline_commit: 'f906c1c08a7544b0dfaa1616961da544cf66b7b9'
status: 'done'
context: []
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** The UX Design Specification guessed wrong brand colors. The actual CCS logo is primarily grayscale (`#121212`, `#ebebeb`, `#a9a9a9`) with maroon `#402020` and gold `#e0c020` as accents — but the codebase uses default shadcn black/white theming. The department brand exists only in the logo file, not in the UI.

**Approach:** Apply the actual logo-derived palette hierarchy: grays are the primary foundation (backgrounds, text, cards), maroon/gold are used sparingly as brand accents. Add custom Tailwind `@theme` tokens and shadcn CSS variable overrides in `globals.css`, and update the sidebar.

## Boundaries & Constraints

**Always:**
- All color changes go through CSS variables or `@theme` tokens — no hardcoded color values in components
- Preserve dark mode via `prefers-color-scheme` but adapt to the department palette (dark sidebar stays dark)
- Maintain WCAG AA contrast: `#121212` on `#ebebeb`, maroon `#402020` on light bg, gold `#e0c020` only on dark backgrounds
- shadcn components (`bg-primary`, `text-primary-foreground`, etc.) must inherit new colors automatically via CSS variable overrides — no per-component edits
- Colors MUST follow the CCS logo hierarchy: **grays are primary** (`#121212`, `#ebebeb`, `#a9a9a9`), **maroon `#402020` is brand accent**, gold `#e0c020` is highlight accent, crimson `#800000` is danger

**Ask First:**
- Extracting shared `StatusBadge` or `StatCard` components — can defer to follow-up

**Never:**
- Do not add new dependencies or npm packages
- Do not change component logic, behavior, or layout structure — only colors and theme tokens

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|----------|--------------|---------------------------|----------------|
| Light mode (default) | Browser loads page with no `prefers-color-scheme` | `--background: #ebebeb`, `--foreground: #121212`, default button uses gray, maroon appears only on active/accent elements | N/A |
| Dark mode | Browser has `prefers-color-scheme: dark` | Sidebar remains `#121212` (already dark), content area uses dark variant of palette | N/A |
| Missing CSS variable | Component references `--primary` that doesn't load | Falls back to shadcn default — verify all vars are defined in `:root` | N/A |

</frozen-after-approval>

## Code Map

- `app/globals.css` — Add department palette `@theme` tokens and shadcn CSS variable overrides using logo-derived colors
- `components/navigation.tsx` — Apply dark sidebar styling (`#121212` bg, `#a9a9a9` idle, `#402020` maroon active)

## Tasks & Acceptance

**Execution:**
- [x] `app/globals.css` — Add `dept-*` color tokens in `@theme inline` block (`dept-gray-50: #ebebeb`, `dept-gray-400: #a9a9a9`, `dept-gray-900: #121212`, `dept-maroon: #402020`, `dept-gold: #e0c020`, `dept-crimson: #800000`), add shadcn CSS variable overrides in `:root` with grays as primary foundation, maroon as accent, gold as highlight, crimson as destructive
- [x] `components/navigation.tsx` — Replace `bg-card` on sidebar with `bg-[#121212] text-[#a9a9a9]`, active items get `bg-[#402020] text-white`, bottom nav uses palette-appropriate colors

**Acceptance Criteria:**
- Given the dashboard loads, when viewing the page background, then it is `#ebebeb` light gray with `#121212` near-black text (grays as primary foundation)
- Given the dashboard loads, when viewing the sidebar, then it has a dark `#121212` background with `#a9a9a9` idle text and `#402020` maroon active state
- Given any default shadcn Button, when inspecting its styling, then it uses gray tones — maroon is reserved for active/accent elements only
- Given an active nav item, when inspecting its background, then it uses `#402020` maroon
- Given a gold accent element, when inspecting its color, then it is `#e0c020` (not `#ffee29`)

## Verification

**Commands:**
- `npm run build` — expected: no build errors
- `npm run lint` — expected: no lint errors

## Suggested Review Order

**Theme foundation**

- Light/dark mode CSS variables mapping the CCS logo palette — grays as primary, maroon/gold as accent
  [`globals.css:4`](../../app/globals.css#L4)

- Custom `dept-*` Tailwind v4 tokens for use across components
  [`globals.css:48`](../../app/globals.css#L48)

**Navigation branding**

- Dark `#121212` sidebar with `#a9a9a9` idle and `#402020` maroon active state
  [`navigation.tsx:59`](../../components/navigation.tsx#L59)

- Bottom nav matching palette with maroon active indicator
  [`navigation.tsx:42`](../../components/navigation.tsx#L42)

**Toast consistency**

- Swapped hardcoded green/red/blue Tailwind classes for theme variable‑driven styling
  [`toast-container.tsx:7`](../../components/ui/toast-container.tsx#L7)
