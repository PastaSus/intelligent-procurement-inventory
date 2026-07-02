---
title: 'Fix code review bugs in Epics 3-6'
type: 'bugfix'
created: '2026-07-02'
status: 'done'
route: 'one-shot'
---

## Intent

**Problem:** Code review of Epics 3-6 found 4 bugs: ComputerUnit hard-delete doesn't cascade to components (was soft-deleting), Inventory component_type can't be cleared to null, PurchaseRequest fulfill doesn't increment inventory in a transaction, and ComponentStatus page runs a duplicate query.

**Approach:** Fix each bug with minimal, targeted changes: hard-delete ComputerUnit (components cascade via schema), pass `null` for empty component_type, wrap fulfill inventory increment in `$transaction`, and move IIFE query to top-level Promise.all.

## Suggested Review Order

1. `app/_actions/units.ts:124` — deleteComputerUnit: hard-delete instead of soft-delete (cascade handles components); verify revalidation paths
2. `app/_actions/inventory.ts:77` — updateInventoryItem: treat empty component_type as `null` so user can clear the field
3. `app/_actions/purchase-requests.ts:199` — fulfillPurchaseRequest: wrap inventory increment + status update in `$transaction` for data integrity
4. `app/dashboard/component-status/page.tsx:59` — move IIFE component query to top-level Promise.all to avoid duplicate DB round-trips
