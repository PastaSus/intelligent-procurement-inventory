# Deferred Work

## Deferred from: code review of 4-7-relocate-component (2026-09-20)

- Check-then-act races without transaction in relocate flow — systemic pattern across all server actions, single-user lab tool makes window negligible.
- No per-action RBAC/ownership check on relocate — matches app-wide pattern (all component actions check login only).
- Unbounded all-units fetch for relocate dropdown — lab-scale data (single-digit units), pagination unnecessary.
- Units list page not revalidated after relocate — minor staleness, page reload on next visit refreshes.
- Framework-level race error paths (FK violation / P2025 / revalidatePath throw surfacing as generic failure) — theoretical windows, no action.

## Deferred from: code review of software group 8-1..8-5 (2026-09-20)

- No per-action RBAC/ownership check on software actions — matches app-wide pattern (login check only).
- Success toasts destroyed by window.location.reload() — app-wide no-optimistic-updates pattern (project-context).
- Modal/row a11y gaps (tabIndex rows, title-only buttons, no dialog roles/focus trap) — matches existing component-table patterns throughout.
- Check-then-act races (unit deleted between check and write, concurrent deletes) — theoretical windows, consistent with all existing actions.
- Seed N+1 sequential writes — seed-scale (18 rows, runs once), negligible.
