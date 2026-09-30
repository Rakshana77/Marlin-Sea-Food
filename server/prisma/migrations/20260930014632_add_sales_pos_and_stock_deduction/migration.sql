-- CreateEnum
CREATE TYPE "SaleStatus" AS ENUM ('DRAFT', 'COMPLETED', 'CANCELLED');

-- AlterEnum
ALTER TYPE "StockMovementType" ADD VALUE 'SALE';

-- AlterTable
ALTER TABLE "Payment" ADD COLUMN     "saleId" TEXT;

-- AlterTable
ALTER TABLE "Stock" ALTER COLUMN "quantityKg" SET DATA TYPE DECIMAL(12,3);

-- AlterTable
ALTER TABLE "StockMovement" ALTER COLUMN "quantityKg" SET DATA TYPE DECIMAL(12,3),
ALTER COLUMN "balanceBefore" SET DATA TYPE DECIMAL(12,3),
ALTER COLUMN "balanceAfter" SET DATA TYPE DECIMAL(12,3);

-- CreateTable
CREATE TABLE "Sale" (
    "id" TEXT NOT NULL,
    "invoiceNumber" TEXT NOT NULL,
    "idempotencyKey" TEXT,
    "saleDate" DATE NOT NULL,
    "customerId" TEXT NOT NULL,
    "totalKg" DECIMAL(12,3) NOT NULL,
    "subtotal" DECIMAL(10,2) NOT NULL,
    "discount" DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    "grandTotal" DECIMAL(10,2) NOT NULL,
    "paidAmount" DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    "changeAmount" DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    "paymentStatus" "PaymentStatus" NOT NULL DEFAULT 'PENDING',
    "status" "SaleStatus" NOT NULL DEFAULT 'COMPLETED',
    "notes" TEXT,
    "createdById" TEXT,
    "updatedById" TEXT,
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Sale_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SaleItem" (
    "id" TEXT NOT NULL,
    "saleId" TEXT NOT NULL,
    "seafoodId" TEXT NOT NULL,
    "gradeId" TEXT NOT NULL,
    "quantityKg" DECIMAL(12,3) NOT NULL,
    "sellingRate" DECIMAL(10,2) NOT NULL,
    "amount" DECIMAL(10,2) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SaleItem_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Sale_invoiceNumber_key" ON "Sale"("invoiceNumber");

-- CreateIndex
CREATE UNIQUE INDEX "Sale_idempotencyKey_key" ON "Sale"("idempotencyKey");

-- CreateIndex
CREATE INDEX "Sale_invoiceNumber_idx" ON "Sale"("invoiceNumber");

-- CreateIndex
CREATE INDEX "Sale_saleDate_idx" ON "Sale"("saleDate");

-- CreateIndex
CREATE INDEX "Sale_customerId_idx" ON "Sale"("customerId");

-- CreateIndex
CREATE INDEX "Sale_status_idx" ON "Sale"("status");

-- CreateIndex
CREATE INDEX "Sale_paymentStatus_idx" ON "Sale"("paymentStatus");

-- CreateIndex
CREATE INDEX "Sale_saleDate_status_idx" ON "Sale"("saleDate", "status");

-- CreateIndex
CREATE INDEX "Sale_customerId_status_idx" ON "Sale"("customerId", "status");

-- CreateIndex
CREATE INDEX "SaleItem_saleId_idx" ON "SaleItem"("saleId");

-- CreateIndex
CREATE INDEX "SaleItem_seafoodId_idx" ON "SaleItem"("seafoodId");

-- CreateIndex
CREATE INDEX "SaleItem_gradeId_idx" ON "SaleItem"("gradeId");

-- CreateIndex
CREATE INDEX "SaleItem_saleId_seafoodId_gradeId_idx" ON "SaleItem"("saleId", "seafoodId", "gradeId");

-- CreateIndex
CREATE INDEX "Payment_saleId_idx" ON "Payment"("saleId");

-- AddForeignKey
ALTER TABLE "Payment" ADD CONSTRAINT "Payment_saleId_fkey" FOREIGN KEY ("saleId") REFERENCES "Sale"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Sale" ADD CONSTRAINT "Sale_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Sale" ADD CONSTRAINT "Sale_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Sale" ADD CONSTRAINT "Sale_updatedById_fkey" FOREIGN KEY ("updatedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SaleItem" ADD CONSTRAINT "SaleItem_saleId_fkey" FOREIGN KEY ("saleId") REFERENCES "Sale"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SaleItem" ADD CONSTRAINT "SaleItem_seafoodId_fkey" FOREIGN KEY ("seafoodId") REFERENCES "Seafood"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SaleItem" ADD CONSTRAINT "SaleItem_gradeId_fkey" FOREIGN KEY ("gradeId") REFERENCES "SeafoodGrade"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
