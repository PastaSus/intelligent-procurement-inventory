# Deferred Work

## Deferred from: pre-defense review (2026-10-08)

- Switch technician seed account from `tech@example.com` to the real lab technician's email — pending professor confirmation of the address. When doing it: update the upsert key in `prisma/seed.ts` (plus stale-row cleanup for the old address, same pattern as the existing `staff@example.com` deleteMany), update the seed-data note in `_bmad-output/project-context.md`, reseed, and re-verify login + e2e. Context: admin is already real (`aarongtxd@gmail.com` / `admin123`); tech is still placeholder (`tech@example.com` / `tech123`). Note the DB also carries a legacy `admin@example.com` ADMIN row from older seeds (users are upserted, not wiped) — e2e currently signs in with it.

## Deferred from: code review of 4-7-relocate-component (2026-09-20)

- Check-then-act races without transaction in relocate flow — systemic pattern across all server actions, single-user lab tool makes window negligible.
- No per-action RBAC/ownership check on relocate — matches app-wide pattern (all component actions check login only). — RESOLVED by Epic 9 (Story 9-2: fail-closed ADMIN gates + isAdmin UI hiding).
- Unbounded all-units fetch for relocate dropdown — lab-scale data (single-digit units), pagination unnecessary.
- Units list page not revalidated after relocate — minor staleness, page reload on next visit refreshes.
- Framework-level race error paths (FK violation / P2025 / revalidatePath throw surfacing as generic failure) — theoretical windows, no action.

## Deferred from: code review of software group 8-1..8-5 (2026-09-20)

- No per-action RBAC/ownership check on software actions — matches app-wide pattern (login check only). — RESOLVED by Epic 9 (Story 9-2: fail-closed ADMIN gates + isAdmin UI hiding).
- Success toasts destroyed by window.location.reload() — app-wide no-optimistic-updates pattern (project-context).
- Modal/row a11y gaps (tabIndex rows, title-only buttons, no dialog roles/focus trap) — matches existing component-table patterns throughout.
- Check-then-act races (unit deleted between check and write, concurrent deletes) — theoretical windows, consistent with all existing actions.
- Seed N+1 sequential writes — seed-scale (18 rows, runs once), negligible.

## Deferred from: code review of reports group 8-6..8-7 (2026-09-20)

- No role gate on report action — matches app-wide pattern (login check only). — RESOLVED by Epic 9 (reports are shared-view per the locked matrix; inventory/PR mutations gated by Story 9-2).
- Rapid-filter response race (earlier response overwrites later) — theoretical; React transitions serialize at lab interaction rates.
- Report pagination — report inherently needs full dataset; lab-scale data.
- Deep-linkable filters via searchParams — not in ACs; nice-to-have.
