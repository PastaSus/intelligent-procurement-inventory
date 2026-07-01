-- CreateEnum
CREATE TYPE "Role" AS ENUM ('ADMIN', 'STAFF');

-- CreateEnum
CREATE TYPE "ComponentType" AS ENUM ('MOTHERBOARD', 'PROCESSOR', 'MEMORY', 'HDD', 'MONITOR', 'KEYBOARD', 'MOUSE', 'AVR', 'OPTICAL_DRIVE');

-- CreateEnum
CREATE TYPE "ComponentStatus" AS ENUM ('FUNCTIONAL', 'NEEDS_REPAIR', 'NEEDS_REPLACEMENT');

-- CreateEnum
CREATE TYPE "PurchaseRequestStatus" AS ENUM ('DRAFT', 'REQUESTED', 'APPROVED', 'REJECTED', 'FULFILLED');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password_hash" TEXT NOT NULL,
    "role" "Role" NOT NULL DEFAULT 'STAFF',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "created_by" TEXT,
    "updated_by" TEXT,
    "deleted" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PasswordResetToken" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PasswordResetToken_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LaboratoryRoom" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "created_by" TEXT,
    "updated_by" TEXT,
    "deleted" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "LaboratoryRoom_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ComputerUnit" (
    "id" TEXT NOT NULL,
    "unit_name" TEXT NOT NULL,
    "laboratory_room_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "created_by" TEXT,
    "updated_by" TEXT,
    "deleted" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "ComputerUnit_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ComputerComponent" (
    "id" TEXT NOT NULL,
    "computer_unit_id" TEXT NOT NULL,
    "type" "ComponentType" NOT NULL,
    "serial_number" TEXT NOT NULL,
    "specifications" TEXT NOT NULL,
    "status" "ComponentStatus" NOT NULL DEFAULT 'FUNCTIONAL',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "created_by" TEXT,
    "updated_by" TEXT,

    CONSTRAINT "ComputerComponent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InventoryItem" (
    "id" TEXT NOT NULL,
    "sku" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "quantity" INTEGER NOT NULL DEFAULT 0,
    "reorder_point" INTEGER NOT NULL DEFAULT 0,
    "component_type" "ComponentType",
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "created_by" TEXT,
    "updated_by" TEXT,
    "deleted" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "InventoryItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PurchaseRequest" (
    "id" TEXT NOT NULL,
    "pr_number" TEXT NOT NULL,
    "status" "PurchaseRequestStatus" NOT NULL DEFAULT 'DRAFT',
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "created_by" TEXT,
    "updated_by" TEXT,
    "deleted" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "PurchaseRequest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RequestItem" (
    "id" TEXT NOT NULL,
    "purchase_request_id" TEXT NOT NULL,
    "item_name" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "unit_price" DECIMAL(10,2),
    "total" DECIMAL(10,2),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RequestItem_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE INDEX "User_email_idx" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "PasswordResetToken_token_key" ON "PasswordResetToken"("token");

-- CreateIndex
CREATE INDEX "PasswordResetToken_user_id_idx" ON "PasswordResetToken"("user_id");

-- CreateIndex
CREATE INDEX "PasswordResetToken_token_idx" ON "PasswordResetToken"("token");

-- CreateIndex
CREATE UNIQUE INDEX "LaboratoryRoom_name_key" ON "LaboratoryRoom"("name");

-- CreateIndex
CREATE INDEX "LaboratoryRoom_name_idx" ON "LaboratoryRoom"("name");

-- CreateIndex
CREATE INDEX "LaboratoryRoom_deleted_idx" ON "LaboratoryRoom"("deleted");

-- CreateIndex
CREATE INDEX "ComputerUnit_laboratory_room_id_idx" ON "ComputerUnit"("laboratory_room_id");

-- CreateIndex
CREATE INDEX "ComputerUnit_deleted_idx" ON "ComputerUnit"("deleted");

-- CreateIndex
CREATE UNIQUE INDEX "ComputerUnit_unit_name_laboratory_room_id_key" ON "ComputerUnit"("unit_name", "laboratory_room_id");

-- CreateIndex
CREATE UNIQUE INDEX "ComputerComponent_serial_number_key" ON "ComputerComponent"("serial_number");

-- CreateIndex
CREATE INDEX "ComputerComponent_computer_unit_id_idx" ON "ComputerComponent"("computer_unit_id");

-- CreateIndex
CREATE INDEX "ComputerComponent_type_idx" ON "ComputerComponent"("type");

-- CreateIndex
CREATE INDEX "ComputerComponent_status_idx" ON "ComputerComponent"("status");

-- CreateIndex
CREATE UNIQUE INDEX "InventoryItem_sku_key" ON "InventoryItem"("sku");

-- CreateIndex
CREATE INDEX "InventoryItem_sku_idx" ON "InventoryItem"("sku");

-- CreateIndex
CREATE INDEX "InventoryItem_component_type_idx" ON "InventoryItem"("component_type");

-- CreateIndex
CREATE INDEX "InventoryItem_deleted_idx" ON "InventoryItem"("deleted");

-- CreateIndex
CREATE UNIQUE INDEX "PurchaseRequest_pr_number_key" ON "PurchaseRequest"("pr_number");

-- CreateIndex
CREATE INDEX "PurchaseRequest_status_idx" ON "PurchaseRequest"("status");

-- CreateIndex
CREATE INDEX "PurchaseRequest_deleted_idx" ON "PurchaseRequest"("deleted");

-- CreateIndex
CREATE INDEX "PurchaseRequest_created_at_idx" ON "PurchaseRequest"("created_at");

-- CreateIndex
CREATE INDEX "RequestItem_purchase_request_id_idx" ON "RequestItem"("purchase_request_id");

-- AddForeignKey
ALTER TABLE "PasswordResetToken" ADD CONSTRAINT "PasswordResetToken_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ComputerUnit" ADD CONSTRAINT "ComputerUnit_laboratory_room_id_fkey" FOREIGN KEY ("laboratory_room_id") REFERENCES "LaboratoryRoom"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ComputerComponent" ADD CONSTRAINT "ComputerComponent_computer_unit_id_fkey" FOREIGN KEY ("computer_unit_id") REFERENCES "ComputerUnit"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RequestItem" ADD CONSTRAINT "RequestItem_purchase_request_id_fkey" FOREIGN KEY ("purchase_request_id") REFERENCES "PurchaseRequest"("id") ON DELETE CASCADE ON UPDATE CASCADE;
