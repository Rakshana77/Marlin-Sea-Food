-- CreateEnum
CREATE TYPE "DailyRateStatus" AS ENUM ('DRAFT', 'PUBLISHED', 'ARCHIVED');

-- CreateTable
CREATE TABLE "DailyRate" (
    "id" TEXT NOT NULL,
    "rateDate" DATE NOT NULL,
    "seafoodId" TEXT NOT NULL,
    "gradeId" TEXT NOT NULL,
    "purchaseRate" DECIMAL(10,2) NOT NULL,
    "sellingRate" DECIMAL(10,2) NOT NULL,
    "status" "DailyRateStatus" NOT NULL DEFAULT 'DRAFT',
    "version" INTEGER NOT NULL DEFAULT 1,
    "publishedAt" TIMESTAMP(3),
    "publishedById" TEXT,
    "createdById" TEXT,
    "updatedById" TEXT,
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DailyRate_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "DailyRate_rateDate_idx" ON "DailyRate"("rateDate");

-- CreateIndex
CREATE INDEX "DailyRate_seafoodId_idx" ON "DailyRate"("seafoodId");

-- CreateIndex
CREATE INDEX "DailyRate_gradeId_idx" ON "DailyRate"("gradeId");

-- CreateIndex
CREATE INDEX "DailyRate_status_idx" ON "DailyRate"("status");

-- CreateIndex
CREATE INDEX "DailyRate_rateDate_status_idx" ON "DailyRate"("rateDate", "status");

-- CreateIndex
CREATE INDEX "DailyRate_seafoodId_gradeId_rateDate_idx" ON "DailyRate"("seafoodId", "gradeId", "rateDate");

-- CreateIndex
CREATE INDEX "DailyRate_rateDate_seafoodId_idx" ON "DailyRate"("rateDate", "seafoodId");

-- CreateIndex
CREATE INDEX "DailyRate_rateDate_gradeId_idx" ON "DailyRate"("rateDate", "gradeId");

-- CreateIndex
CREATE UNIQUE INDEX "DailyRate_rateDate_seafoodId_gradeId_version_key" ON "DailyRate"("rateDate", "seafoodId", "gradeId", "version");

-- AddForeignKey
ALTER TABLE "DailyRate" ADD CONSTRAINT "DailyRate_seafoodId_fkey" FOREIGN KEY ("seafoodId") REFERENCES "Seafood"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DailyRate" ADD CONSTRAINT "DailyRate_gradeId_fkey" FOREIGN KEY ("gradeId") REFERENCES "SeafoodGrade"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DailyRate" ADD CONSTRAINT "DailyRate_publishedById_fkey" FOREIGN KEY ("publishedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DailyRate" ADD CONSTRAINT "DailyRate_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DailyRate" ADD CONSTRAINT "DailyRate_updatedById_fkey" FOREIGN KEY ("updatedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
