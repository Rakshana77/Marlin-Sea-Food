-- CreateEnum
CREATE TYPE "PurchaseBillStatus" AS ENUM ('DRAFT', 'POSTED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "PaymentMethod" AS ENUM ('CASH', 'UPI', 'BANK_TRANSFER', 'CREDIT');

-- CreateEnum
CREATE TYPE "PaymentStatus" AS ENUM ('PENDING', 'PARTIALLY_PAID', 'PAID', 'CANCELLED');

-- CreateEnum
CREATE TYPE "StockMovementType" AS ENUM ('PURCHASE', 'EXPORT', 'ADJUSTMENT', 'RETURN', 'WASTE');

-- CreateTable
CREATE TABLE "PurchaseBill" (
    "id" TEXT NOT NULL,
    "billNumber" TEXT NOT NULL,
    "billDate" DATE NOT NULL,
    "fishermanId" TEXT NOT NULL,
    "totalKg" DECIMAL(10,2) NOT NULL,
    "subtotal" DECIMAL(10,2) NOT NULL,
    "discount" DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    "grandTotal" DECIMAL(10,2) NOT NULL,
    "paidAmount" DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    "outstandingAmount" DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    "paymentStatus" "PaymentStatus" NOT NULL DEFAULT 'PENDING',
    "status" "PurchaseBillStatus" NOT NULL DEFAULT 'POSTED',
    "notes" TEXT,
    "createdById" TEXT,
    "updatedById" TEXT,
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PurchaseBill_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PurchaseBillItem" (
    "id" TEXT NOT NULL,
    "purchaseBillId" TEXT NOT NULL,
    "seafoodId" TEXT NOT NULL,
    "gradeId" TEXT NOT NULL,
    "quantityKg" DECIMAL(10,2) NOT NULL,
    "purchaseRate" DECIMAL(10,2) NOT NULL,
    "amount" DECIMAL(10,2) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PurchaseBillItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Payment" (
    "id" TEXT NOT NULL,
    "purchaseBillId" TEXT,
    "amount" DECIMAL(10,2) NOT NULL,
    "paymentMethod" "PaymentMethod" NOT NULL,
    "paymentStatus" "PaymentStatus" NOT NULL DEFAULT 'PAID',
    "paymentDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "referenceNumber" TEXT,
    "notes" TEXT,
    "createdById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Payment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Stock" (
    "id" TEXT NOT NULL,
    "seafoodId" TEXT NOT NULL,
    "gradeId" TEXT NOT NULL,
    "quantityKg" DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Stock_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StockMovement" (
    "id" TEXT NOT NULL,
    "stockId" TEXT NOT NULL,
    "seafoodId" TEXT NOT NULL,
    "gradeId" TEXT NOT NULL,
    "movementType" "StockMovementType" NOT NULL,
    "quantityKg" DECIMAL(10,2) NOT NULL,
    "balanceBefore" DECIMAL(10,2) NOT NULL,
    "balanceAfter" DECIMAL(10,2) NOT NULL,
    "referenceType" TEXT NOT NULL,
    "referenceId" TEXT,
    "movementDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "notes" TEXT,
    "createdById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "StockMovement_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "PurchaseBill_billNumber_key" ON "PurchaseBill"("billNumber");

-- CreateIndex
CREATE INDEX "PurchaseBill_billNumber_idx" ON "PurchaseBill"("billNumber");

-- CreateIndex
CREATE INDEX "PurchaseBill_billDate_idx" ON "PurchaseBill"("billDate");

-- CreateIndex
CREATE INDEX "PurchaseBill_fishermanId_idx" ON "PurchaseBill"("fishermanId");

-- CreateIndex
CREATE INDEX "PurchaseBill_status_idx" ON "PurchaseBill"("status");

-- CreateIndex
CREATE INDEX "PurchaseBill_paymentStatus_idx" ON "PurchaseBill"("paymentStatus");

-- CreateIndex
CREATE INDEX "PurchaseBill_billDate_status_idx" ON "PurchaseBill"("billDate", "status");

-- CreateIndex
CREATE INDEX "PurchaseBill_fishermanId_status_idx" ON "PurchaseBill"("fishermanId", "status");

-- CreateIndex
CREATE INDEX "PurchaseBillItem_purchaseBillId_idx" ON "PurchaseBillItem"("purchaseBillId");

-- CreateIndex
CREATE INDEX "PurchaseBillItem_seafoodId_idx" ON "PurchaseBillItem"("seafoodId");

-- CreateIndex
CREATE INDEX "PurchaseBillItem_gradeId_idx" ON "PurchaseBillItem"("gradeId");

-- CreateIndex
CREATE INDEX "PurchaseBillItem_purchaseBillId_seafoodId_gradeId_idx" ON "PurchaseBillItem"("purchaseBillId", "seafoodId", "gradeId");

-- CreateIndex
CREATE INDEX "Payment_purchaseBillId_idx" ON "Payment"("purchaseBillId");

-- CreateIndex
CREATE INDEX "Payment_paymentStatus_idx" ON "Payment"("paymentStatus");

-- CreateIndex
CREATE INDEX "Payment_paymentDate_idx" ON "Payment"("paymentDate");

-- CreateIndex
CREATE INDEX "Payment_paymentMethod_idx" ON "Payment"("paymentMethod");

-- CreateIndex
CREATE INDEX "Stock_seafoodId_idx" ON "Stock"("seafoodId");

-- CreateIndex
CREATE INDEX "Stock_gradeId_idx" ON "Stock"("gradeId");

-- CreateIndex
CREATE UNIQUE INDEX "Stock_seafoodId_gradeId_key" ON "Stock"("seafoodId", "gradeId");

-- CreateIndex
CREATE INDEX "StockMovement_stockId_idx" ON "StockMovement"("stockId");

-- CreateIndex
CREATE INDEX "StockMovement_seafoodId_idx" ON "StockMovement"("seafoodId");

-- CreateIndex
CREATE INDEX "StockMovement_gradeId_idx" ON "StockMovement"("gradeId");

-- CreateIndex
CREATE INDEX "StockMovement_movementType_idx" ON "StockMovement"("movementType");

-- CreateIndex
CREATE INDEX "StockMovement_movementDate_idx" ON "StockMovement"("movementDate");

-- CreateIndex
CREATE INDEX "StockMovement_referenceType_referenceId_idx" ON "StockMovement"("referenceType", "referenceId");

-- AddForeignKey
ALTER TABLE "PurchaseBill" ADD CONSTRAINT "PurchaseBill_fishermanId_fkey" FOREIGN KEY ("fishermanId") REFERENCES "Fisherman"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PurchaseBill" ADD CONSTRAINT "PurchaseBill_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PurchaseBill" ADD CONSTRAINT "PurchaseBill_updatedById_fkey" FOREIGN KEY ("updatedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PurchaseBillItem" ADD CONSTRAINT "PurchaseBillItem_purchaseBillId_fkey" FOREIGN KEY ("purchaseBillId") REFERENCES "PurchaseBill"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PurchaseBillItem" ADD CONSTRAINT "PurchaseBillItem_seafoodId_fkey" FOREIGN KEY ("seafoodId") REFERENCES "Seafood"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PurchaseBillItem" ADD CONSTRAINT "PurchaseBillItem_gradeId_fkey" FOREIGN KEY ("gradeId") REFERENCES "SeafoodGrade"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Payment" ADD CONSTRAINT "Payment_purchaseBillId_fkey" FOREIGN KEY ("purchaseBillId") REFERENCES "PurchaseBill"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Payment" ADD CONSTRAINT "Payment_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Stock" ADD CONSTRAINT "Stock_seafoodId_fkey" FOREIGN KEY ("seafoodId") REFERENCES "Seafood"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Stock" ADD CONSTRAINT "Stock_gradeId_fkey" FOREIGN KEY ("gradeId") REFERENCES "SeafoodGrade"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StockMovement" ADD CONSTRAINT "StockMovement_stockId_fkey" FOREIGN KEY ("stockId") REFERENCES "Stock"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StockMovement" ADD CONSTRAINT "StockMovement_seafoodId_fkey" FOREIGN KEY ("seafoodId") REFERENCES "Seafood"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StockMovement" ADD CONSTRAINT "StockMovement_gradeId_fkey" FOREIGN KEY ("gradeId") REFERENCES "SeafoodGrade"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StockMovement" ADD CONSTRAINT "StockMovement_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
