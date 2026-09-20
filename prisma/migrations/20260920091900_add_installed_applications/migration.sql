-- CreateEnum
CREATE TYPE "LicenseType" AS ENUM ('NONE', 'FREE', 'COMMERCIAL', 'OPEN_SOURCE', 'EDUCATIONAL');

-- CreateTable
CREATE TABLE "InstalledApplication" (
    "id" TEXT NOT NULL,
    "computer_unit_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "version" TEXT,
    "license_key" TEXT,
    "license_type" "LicenseType" NOT NULL DEFAULT 'NONE',
    "install_date" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "InstalledApplication_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "InstalledApplication_computer_unit_id_idx" ON "InstalledApplication"("computer_unit_id");

-- CreateIndex
CREATE INDEX "InstalledApplication_name_idx" ON "InstalledApplication"("name");

-- AddForeignKey
ALTER TABLE "InstalledApplication" ADD CONSTRAINT "InstalledApplication_computer_unit_id_fkey" FOREIGN KEY ("computer_unit_id") REFERENCES "ComputerUnit"("id") ON DELETE CASCADE ON UPDATE CASCADE;
