# Story 4.1: Purchase Order Database Schema & Setup

**Epic:** Epic 4 - Purchase Order Management
**Status:** done
**Story ID:** 4-1

## Overview

As a developer, I want to set up the Prisma schema for purchase orders, so that the system can store POs with line items and status tracking.

## Acceptance Criteria

**Given** Prisma is installed and configured
**When** `schema.prisma` is updated with PurchaseOrder and POItem models
**Then** PurchaseOrder includes: id, po_number, vendor_id, status (Draft/Approved/Sent), created_at, updated_at, created_by, updated_by, deleted
**And** POItem includes: id, purchase_order_id, item_name, quantity, unit_price, total
**And** migration runs successfully

## Implementation Notes

Completed via migration `20260508131924_init`:
- `PurchaseOrder` model with `po_number` (unique), `vendor_id` (FK to Vendor), `status` enum (DRAFT/APPROVED/SENT), and full audit fields
- `POItem` model with `purchase_order_id` (FK to PurchaseOrder), `item_name`, `quantity`, `unit_price`, `total`
- Cascade delete on POItem when PurchaseOrder is deleted
- Indexes on `purchase_order_id`, `status`, `vendor_id`, `deleted`, `created_at`

## Files Modified/Created

- `prisma/schema.prisma` — PurchaseOrder + POItem models + PurchaseOrderStatus enum
- `prisma/migrations/20260508131924_init/migration.sql` — Initial migration

## Dependencies

- Story 3.1 (Vendor schema) — Vendor foreign key dependency

## Test Verification

- [x] Migration runs without errors
- [x] Prisma client generates correctly (`npx prisma generate`)
- [x] Foreign key relationship between PurchaseOrder and Vendor works
- [x] Cascade delete on POItem verified

---
**Completed:** 2026-05-08
**Verified by:** Developer agent
