---
story_id: 5.2
story_key: 5-2-dashboard-ui-with-stats-cards
epic_id: 5
epic_title: Dashboard & AI Chat Interface
story_title: Dashboard UI with Stats Cards
status: done
created: 2026-05-13
---

# Story 5-2: Dashboard UI with Stats Cards

## Story Foundation

**User Story:**
As a user,
I want to view dashboard with stats cards and low stock alerts,
So that I can quickly assess inventory status.

**Acceptance Criteria:**

| Given | When | Then |
|-------|------|------|
| User navigates to Dashboard | Page loads | Stats cards display: total items, low stock count, pending POs |
| Items are below reorder point | Page loads | Color-coded indicators show stock status (red/yellow/green) (FR23) |
| Items are below reorder point | Page loads | Progress bars show stock vs reorder point (FR24) |
| User views Dashboard | Page renders | Dashboard meets WCAG 2.1 AA (NFR8) |

---

## Developer Context

### Current State

The dashboard page at `/app/dashboard/page.tsx` currently renders placeholder stats cards with hardcoded `0` values. The page uses `lucide-react` icons (`Package`, `TrendingUp`, `Users`). It's a Server Component.

### Data Source

**Server Action:** `getDashboardStats()` from `@/app/_actions/dashboard` returns:
```typescript
{
  success: true,
  data: { totalInventory: number, lowStockCount: number, pendingPOs: number }
}
```

### Files to Modify

| File | Action | Description |
|------|--------|-------------|
| `/app/dashboard/page.tsx` | MODIFY | Replace placeholder with real data and indicators |
| `/app/dashboard/components/StockIndicators.tsx` | NEW | Color-coded indicator + progress bar component |

### Code Patterns to Follow

- **Server Components** for initial data fetching — call `getDashboardStats()` directly
- **snake_case** for DB fields, **camelCase** for TS
- **PascalCase** for components
- **shadcn/ui** + **Tailwind CSS v4** styling
- Use existing `bg-card`, `text-muted-foreground`, `border` utility classes

---

## Technical Requirements

### Color-Coded Indicators (FR23)

| Status | Color | Condition |
|--------|-------|-----------|
| Red (critical) | `bg-red-500` / `text-red-500` | quantity === 0 or quantity < reorder_point * 0.5 |
| Yellow (warning) | `bg-yellow-500` / `text-yellow-500` | quantity < reorder_point |
| Green (ok) | `bg-green-500` / `text-green-500` | quantity >= reorder_point |

### Progress Bars (FR24)

- Progress = `quantity / reorder_point * 100`
- Cap at 100% (don't overflow)
- Color matches the indicator above

### WCAG 2.1 AA Compliance (NFR8)

- Minimum color contrast 4.5:1 — use proper Tailwind shade variants
- ARIA labels on progress bars (`role="progressbar"`, `aria-valuenow`, `aria-valuemin`, `aria-valuemax`)
- Keyboard navigable
- Semantic HTML structure

### Package Dependencies

All already available:
- `lucide-react` — icons
- `tailwindcss` — styling
- `@/app/_actions/dashboard` — data

---

## Notes

- Story 5-1 created the data layer (`getDashboardStats()` action + `/api/dashboard` route)
- Use the Server Action directly from the Server Component — no client-side fetching needed
- Keep the dashboard responsive: `grid-cols-1 md:grid-cols-3`
- Recent PO list can be added as a secondary section below the stats cards (read from the API route or add a separate query)

---

## Tasks/Subtasks

- [x] Add `getLowStockItems()` server action to fetch individual low stock items
- [x] Create `StockIndicators.tsx` with color-coded status (red/yellow/green) (FR23)
- [x] Create `StockIndicators.tsx` with accessible progress bars (role="progressbar", aria-valuenow/max) (FR24)
- [x] Update `dashboard/page.tsx` to call `getDashboardStats()` for real data
- [x] Display stat cards: total items, low stock count, pending POs
- [x] Display low stock items list with stock indicators and progress bars
- [x] Handle error/loading states (empty state when no low stock items)
- [x] TypeScript check passes (0 errors)
- [x] ESLint clean on new/modified files

### Review Findings (patches applied)

- [x] [Review][Patch] Division by zero — added guard for reorderPoint=0 (StockIndicators.tsx)
- [x] [Review][Patch] Inefficient query — moved filter to SQL WHERE clause (dashboard.ts)
- [x] [Review][Patch] WCAG color contrast — changed to darker shades (red-700, yellow-600, green-700)
- [x] [Review][Patch] WCAG text contrast — changed to darker text colors (red-800, yellow-800, green-800)

---

## Dev Agent Record

### Implementation Plan

**Files modified/created:**

1. **`app/_actions/dashboard.ts`** — Added `getLowStockItems()` that fetches inventory items sorted by quantity ascending, filters for low stock, returns top 10.

2. **`app/dashboard/components/StockIndicators.tsx`** — New component with:
   - `getStockStatus()` helper mapping quantity/reorder_point to critical/warning/ok
   - `StockIndicator` component rendering icon + progress bar + ratio text
   - WCAG-compliant progress bar with `role="progressbar"`, `aria-valuenow`, `aria-valuemax`, `aria-label`
   - Color-coded: red (critical), yellow (warning), green (ok)

3. **`app/dashboard/page.tsx`** — Rewritten as async Server Component:
   - Fetches data via `getDashboardStats()` and `getLowStockItems()` in parallel
   - Renders 3 stat cards with real data (total items, low stock count, pending POs)
   - Renders low stock items section with stock indicators (only when items exist)
   - Clean empty state when no low stock items

### Debug Log

- First lint pass: unused import `TrendingUp` in page.tsx, unused `bg` in StockIndicators → resolved
- No TypeScript errors at any point

### Completion Notes

✅ Story 5-2 implemented successfully. Dashboard now shows real data from the database with accessible color-coded stock indicators and progress bars.

