-- CreateEnum
CREATE TYPE "SaleType" AS ENUM ('WHOLESALE', 'EXPORT');

-- CreateEnum
CREATE TYPE "AdvancePaymentMethod" AS ENUM ('CASH', 'BANK_TRANSFER', 'UPI');

-- CreateEnum
CREATE TYPE "AdvanceStatus" AS ENUM ('ACTIVE', 'FULLY_RECOVERED', 'WRITTEN_OFF', 'CANCELLED');

-- CreateEnum
CREATE TYPE "AdvanceEntryType" AS ENUM ('DISBURSEMENT', 'RECOVERY_DEDUCTION', 'RECOVERY_REVERSAL', 'CASH_REPAYMENT', 'WRITE_OFF');

-- CreateEnum
CREATE TYPE "LedgerDirection" AS ENUM ('DEBIT', 'CREDIT');

-- CreateEnum
CREATE TYPE "ExpenseCategory" AS ENUM ('ICE', 'DIESEL_FUEL', 'COOLIE_WAGES', 'PACKING', 'ELECTRICITY', 'MAINTENANCE', 'SALARY', 'OTHER');

-- CreateEnum
CREATE TYPE "ExpensePaymentMethod" AS ENUM ('CASH', 'UPI', 'BANK_TRANSFER');

-- CreateEnum
CREATE TYPE "ExpenseStatus" AS ENUM ('RECORDED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "DayEndStatus" AS ENUM ('OPEN', 'CLOSED', 'REOPENED');

-- AlterTable
ALTER TABLE "PurchaseBill" ADD COLUMN     "advanceDeducted" DECIMAL(10,2) NOT NULL DEFAULT 0.00,
ADD COLUMN     "netPayableCash" DECIMAL(10,2) NOT NULL DEFAULT 0.00,
ADD COLUMN     "totalGrossKg" DECIMAL(10,2) NOT NULL DEFAULT 0.00,
ADD COLUMN     "totalTareKg" DECIMAL(10,2) NOT NULL DEFAULT 0.00;

-- AlterTable
ALTER TABLE "PurchaseBillItem" ADD COLUMN     "cratesCount" INTEGER NOT NULL DEFAULT 1,
ADD COLUMN     "grossKg" DECIMAL(10,2) NOT NULL DEFAULT 0.00,
ADD COLUMN     "tareKg" DECIMAL(10,2) NOT NULL DEFAULT 0.00;

-- AlterTable
ALTER TABLE "Sale" ADD COLUMN     "destinationPort" TEXT,
ADD COLUMN     "dispatchDate" TIMESTAMP(3),
ADD COLUMN     "exportCompanyId" TEXT,
ADD COLUMN     "exportRef" TEXT,
ADD COLUMN     "saleType" "SaleType" NOT NULL DEFAULT 'WHOLESALE',
ADD COLUMN     "taxAmount" DECIMAL(10,2) NOT NULL DEFAULT 0.00,
ADD COLUMN     "totalCogs" DECIMAL(12,2) NOT NULL DEFAULT 0.00,
ADD COLUMN     "totalGrossProfit" DECIMAL(12,2) NOT NULL DEFAULT 0.00,
ALTER COLUMN "customerId" DROP NOT NULL;

-- AlterTable
ALTER TABLE "SaleItem" ADD COLUMN     "cogsAmount" DECIMAL(12,2) NOT NULL DEFAULT 0.00,
ADD COLUMN     "costRate" DECIMAL(10,2) NOT NULL DEFAULT 0.00,
ADD COLUMN     "grossProfit" DECIMAL(12,2) NOT NULL DEFAULT 0.00;

-- AlterTable
ALTER TABLE "Stock" ADD COLUMN     "averageCost" DECIMAL(10,2) NOT NULL DEFAULT 0.00,
ADD COLUMN     "totalValue" DECIMAL(12,2) NOT NULL DEFAULT 0.00;

-- AlterTable
ALTER TABLE "StockMovement" ADD COLUMN     "totalCost" DECIMAL(12,2),
ADD COLUMN     "unitCost" DECIMAL(10,2);

-- CreateTable
CREATE TABLE "FishermanAdvance" (
    "id" TEXT NOT NULL,
    "advanceNumber" TEXT NOT NULL,
    "fishermanId" TEXT NOT NULL,
    "sanctionDate" DATE NOT NULL,
    "disbursedAmount" DECIMAL(12,2) NOT NULL,
    "paymentMethod" "AdvancePaymentMethod" NOT NULL,
    "paymentRef" TEXT,
    "status" "AdvanceStatus" NOT NULL DEFAULT 'ACTIVE',
    "notes" TEXT,
    "createdById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FishermanAdvance_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FishermanAdvanceLedger" (
    "id" TEXT NOT NULL,
    "fishermanId" TEXT NOT NULL,
    "advanceId" TEXT,
    "entryType" "AdvanceEntryType" NOT NULL,
    "direction" "LedgerDirection" NOT NULL,
    "amount" DECIMAL(12,2) NOT NULL,
    "balanceBefore" DECIMAL(12,2) NOT NULL,
    "balanceAfter" DECIMAL(12,2) NOT NULL,
    "referenceType" TEXT NOT NULL,
    "referenceId" TEXT,
    "notes" TEXT,
    "createdById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "FishermanAdvanceLedger_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Expense" (
    "id" TEXT NOT NULL,
    "expenseNumber" TEXT NOT NULL,
    "expenseDate" DATE NOT NULL,
    "category" "ExpenseCategory" NOT NULL,
    "amount" DECIMAL(10,2) NOT NULL,
    "paymentMethod" "ExpensePaymentMethod" NOT NULL,
    "recipient" TEXT NOT NULL,
    "status" "ExpenseStatus" NOT NULL DEFAULT 'RECORDED',
    "notes" TEXT,
    "createdById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Expense_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DayEndClosing" (
    "id" TEXT NOT NULL,
    "businessDate" DATE NOT NULL,
    "closingStatus" "DayEndStatus" NOT NULL DEFAULT 'CLOSED',
    "openingStockKg" DECIMAL(12,3) NOT NULL,
    "totalReceivedKg" DECIMAL(12,3) NOT NULL,
    "totalSoldKg" DECIMAL(12,3) NOT NULL,
    "totalWastageKg" DECIMAL(12,3) NOT NULL,
    "totalAdjustedKg" DECIMAL(12,3) NOT NULL,
    "expectedClosingStockKg" DECIMAL(12,3) NOT NULL,
    "actualPhysicalStockKg" DECIMAL(12,3) NOT NULL,
    "stockVarianceKg" DECIMAL(12,3) NOT NULL,
    "openingCash" DECIMAL(10,2) NOT NULL,
    "cashReceivedSales" DECIMAL(10,2) NOT NULL,
    "cashPaidPurchases" DECIMAL(10,2) NOT NULL,
    "cashPaidAdvances" DECIMAL(10,2) NOT NULL,
    "cashPaidExpenses" DECIMAL(10,2) NOT NULL,
    "expectedClosingCash" DECIMAL(10,2) NOT NULL,
    "actualPhysicalCash" DECIMAL(10,2) NOT NULL,
    "cashVariance" DECIMAL(10,2) NOT NULL,
    "varianceReason" TEXT,
    "closedById" TEXT NOT NULL,
    "closedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "reopenedById" TEXT,
    "reopenedAt" TIMESTAMP(3),
    "reopenReason" TEXT,

    CONSTRAINT "DayEndClosing_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "FishermanAdvance_advanceNumber_key" ON "FishermanAdvance"("advanceNumber");

-- CreateIndex
CREATE INDEX "FishermanAdvance_advanceNumber_idx" ON "FishermanAdvance"("advanceNumber");

-- CreateIndex
CREATE INDEX "FishermanAdvance_fishermanId_idx" ON "FishermanAdvance"("fishermanId");

-- CreateIndex
CREATE INDEX "FishermanAdvance_sanctionDate_idx" ON "FishermanAdvance"("sanctionDate");

-- CreateIndex
CREATE INDEX "FishermanAdvance_status_idx" ON "FishermanAdvance"("status");

-- CreateIndex
CREATE INDEX "FishermanAdvanceLedger_fishermanId_createdAt_idx" ON "FishermanAdvanceLedger"("fishermanId", "createdAt");

-- CreateIndex
CREATE INDEX "FishermanAdvanceLedger_referenceType_referenceId_idx" ON "FishermanAdvanceLedger"("referenceType", "referenceId");

-- CreateIndex
CREATE INDEX "FishermanAdvanceLedger_fishermanId_idx" ON "FishermanAdvanceLedger"("fishermanId");

-- CreateIndex
CREATE INDEX "FishermanAdvanceLedger_advanceId_idx" ON "FishermanAdvanceLedger"("advanceId");

-- CreateIndex
CREATE UNIQUE INDEX "Expense_expenseNumber_key" ON "Expense"("expenseNumber");

-- CreateIndex
CREATE INDEX "Expense_expenseDate_idx" ON "Expense"("expenseDate");

-- CreateIndex
CREATE INDEX "Expense_category_idx" ON "Expense"("category");

-- CreateIndex
CREATE INDEX "Expense_status_idx" ON "Expense"("status");

-- CreateIndex
CREATE INDEX "Expense_expenseNumber_idx" ON "Expense"("expenseNumber");

-- CreateIndex
CREATE UNIQUE INDEX "DayEndClosing_businessDate_key" ON "DayEndClosing"("businessDate");

-- CreateIndex
CREATE INDEX "DayEndClosing_businessDate_idx" ON "DayEndClosing"("businessDate");

-- CreateIndex
CREATE INDEX "DayEndClosing_closingStatus_idx" ON "DayEndClosing"("closingStatus");

-- CreateIndex
CREATE INDEX "Sale_exportCompanyId_idx" ON "Sale"("exportCompanyId");

-- CreateIndex
CREATE INDEX "Sale_saleType_idx" ON "Sale"("saleType");

-- AddForeignKey
ALTER TABLE "Sale" ADD CONSTRAINT "Sale_exportCompanyId_fkey" FOREIGN KEY ("exportCompanyId") REFERENCES "ExportCompany"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FishermanAdvance" ADD CONSTRAINT "FishermanAdvance_fishermanId_fkey" FOREIGN KEY ("fishermanId") REFERENCES "Fisherman"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FishermanAdvance" ADD CONSTRAINT "FishermanAdvance_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FishermanAdvanceLedger" ADD CONSTRAINT "FishermanAdvanceLedger_fishermanId_fkey" FOREIGN KEY ("fishermanId") REFERENCES "Fisherman"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FishermanAdvanceLedger" ADD CONSTRAINT "FishermanAdvanceLedger_advanceId_fkey" FOREIGN KEY ("advanceId") REFERENCES "FishermanAdvance"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FishermanAdvanceLedger" ADD CONSTRAINT "FishermanAdvanceLedger_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Expense" ADD CONSTRAINT "Expense_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DayEndClosing" ADD CONSTRAINT "DayEndClosing_closedById_fkey" FOREIGN KEY ("closedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DayEndClosing" ADD CONSTRAINT "DayEndClosing_reopenedById_fkey" FOREIGN KEY ("reopenedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Check Constraints for Financial & Inventory Invariants
ALTER TABLE "Stock" ADD CONSTRAINT "chk_stock_quantity_non_negative" CHECK ("quantityKg" >= 0);
ALTER TABLE "Stock" ADD CONSTRAINT "chk_stock_avg_cost_non_negative" CHECK ("averageCost" >= 0);
ALTER TABLE "FishermanAdvanceLedger" ADD CONSTRAINT "chk_advance_ledger_amount_positive" CHECK ("amount" > 0);
ALTER TABLE "FishermanAdvanceLedger" ADD CONSTRAINT "chk_advance_ledger_balance_non_negative" CHECK ("balanceAfter" >= 0);
ALTER TABLE "PurchaseBillItem" ADD CONSTRAINT "chk_purchase_item_tare_valid" CHECK ("grossKg" >= "tareKg");
