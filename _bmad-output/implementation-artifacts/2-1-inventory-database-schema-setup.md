# Story 2.1: Inventory Database Schema & Setup

Status: done

## Story

As a developer,
I want to set up the Prisma schema for inventory items,
So that the system can store and retrieve inventory data with audit fields.

## Acceptance Criteria

1. **Given** Prisma is installed and configured
   **When** schema.prisma is updated with InventoryItem model
   **Then** model includes: id, sku, name, description, quantity, reorder_point, category, created_at, updated_at, created_by, updated_by, deleted

2. **Given** the InventoryItem schema
   **When** quantity field is defined
   **Then** quantity has constraint >= 0 enforced at database level

3. **Given** the schema is defined
   **When** `prisma migrate dev` is run
   **Then** migration completes successfully and creates/updates inventory_item table

4. **Given** the schema and migration are complete
   **When** test data is seeded with varied stock levels (low stock, normal, high)
   **Then** seed script successfully populates test inventory items for manual testing of story 2.6 (low-stock alerts)

## Tasks / Subtasks

- [x] Task 1-15: All completed (schema verified, migration in sync, validators created, seed data created, documentation added)

## Implementation Complete

**Date Completed:** 2026-05-10

**Files Created:**
1. `lib/validators/inventory.ts` - Zod schemas for inventory operations
2. `prisma/seed.ts` - Seed script with 4 test items
3. `docs/SCHEMA.md` - Schema documentation

**Build Status:**
- ✅ pnpm build - Compiled successfully
- ✅ TypeScript - No errors

**Unblocks:**
- Story 2.2: Create Inventory Item
- Story 2.3: View Inventory List
- Story 2.6: Low Stock Alerts Display