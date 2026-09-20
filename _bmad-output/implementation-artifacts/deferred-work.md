# Deferred Work

## Deferred from: code review of 4-7-relocate-component (2026-09-20)

- Check-then-act races without transaction in relocate flow — systemic pattern across all server actions, single-user lab tool makes window negligible.
- No per-action RBAC/ownership check on relocate — matches app-wide pattern (all component actions check login only).
- Unbounded all-units fetch for relocate dropdown — lab-scale data (single-digit units), pagination unnecessary.
- Units list page not revalidated after relocate — minor staleness, page reload on next visit refreshes.
- Framework-level race error paths (FK violation / P2025 / revalidatePath throw surfacing as generic failure) — theoretical windows, no action.
