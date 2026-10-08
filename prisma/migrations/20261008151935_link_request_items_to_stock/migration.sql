-- Link RequestItem rows to the stock part they request (nullable: old free-text rows stay unlinked)
ALTER TABLE "RequestItem" ADD COLUMN "inventory_item_id" TEXT;

-- Backfill old rows: link only when exactly one non-deleted stock part
-- matches the snapshot name (trimmed, case-insensitive). Ambiguous or
-- unmatched rows keep NULL and use the legacy name-match fallback on fulfill.
UPDATE "RequestItem" AS ri
SET "inventory_item_id" = ii."id"
FROM "InventoryItem" AS ii
WHERE ri."inventory_item_id" IS NULL
  AND ii."deleted" = false
  AND lower(trim(ii."name")) = lower(trim(ri."item_name"))
  AND NOT EXISTS (
    SELECT 1 FROM "InventoryItem" AS other
    WHERE other."id" <> ii."id"
      AND other."deleted" = false
      AND lower(trim(other."name")) = lower(trim(ri."item_name"))
  );

CREATE INDEX "RequestItem_inventory_item_id_idx" ON "RequestItem"("inventory_item_id");

-- Prisma default referential action for an optional relation on Postgres
ALTER TABLE "RequestItem" ADD CONSTRAINT "RequestItem_inventory_item_id_fkey" FOREIGN KEY ("inventory_item_id") REFERENCES "InventoryItem"("id") ON DELETE SET NULL ON UPDATE CASCADE;
