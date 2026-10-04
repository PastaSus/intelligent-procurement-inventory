-- AlterEnum: rename STAFF to TECHNICIAN (data-preserving, via type recreation)
-- 1. Create the new enum type with the desired values
CREATE TYPE "Role_new" AS ENUM ('ADMIN', 'TECHNICIAN');

-- 2. Drop the old STAFF default so the column type can be converted
ALTER TABLE "User" ALTER COLUMN "role" DROP DEFAULT;

-- 3. Convert the column to the new type, backfilling every STAFF row to TECHNICIAN inline
ALTER TABLE "User" ALTER COLUMN "role" TYPE "Role_new" USING (
  CASE WHEN "role"::text = 'STAFF' THEN 'TECHNICIAN'::"Role_new"
       ELSE "role"::text::"Role_new"
  END
);

-- 4. Set the column default to the renamed value
ALTER TABLE "User" ALTER COLUMN "role" SET DEFAULT 'TECHNICIAN';

-- 5. Replace the old enum type with the new one
ALTER TYPE "Role" RENAME TO "Role_old";
ALTER TYPE "Role_new" RENAME TO "Role";
DROP TYPE "Role_old";
