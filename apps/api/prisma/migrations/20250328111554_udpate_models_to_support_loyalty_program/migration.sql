/*
  Warnings:

  - Added the required column `loyaltyProgramId` to the `PointsRule` table without a default value. This is not possible if the table is not empty.
  - Added the required column `loyaltyProgramId` to the `Reward` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "PointsRule" ADD COLUMN     "loyaltyProgramId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "Reward" ADD COLUMN     "loyaltyProgramId" TEXT NOT NULL;

-- CreateTable
CREATE TABLE "LoyaltyProgram" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "merchantId" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LoyaltyProgram_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PointsBalance" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "merchantId" TEXT NOT NULL,
    "balance" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PointsBalance_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PointsCalculation" (
    "id" TEXT NOT NULL,
    "transactionId" TEXT NOT NULL,
    "merchantId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "points" INTEGER,
    "status" TEXT NOT NULL,
    "error" TEXT,
    "metadata" JSONB,
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PointsCalculation_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "LoyaltyProgram_merchantId_idx" ON "LoyaltyProgram"("merchantId");

-- CreateIndex
CREATE INDEX "PointsBalance_userId_idx" ON "PointsBalance"("userId");

-- CreateIndex
CREATE INDEX "PointsBalance_merchantId_idx" ON "PointsBalance"("merchantId");

-- CreateIndex
CREATE UNIQUE INDEX "PointsBalance_userId_merchantId_key" ON "PointsBalance"("userId", "merchantId");

-- CreateIndex
CREATE INDEX "PointsCalculation_transactionId_idx" ON "PointsCalculation"("transactionId");

-- CreateIndex
CREATE INDEX "PointsCalculation_merchantId_idx" ON "PointsCalculation"("merchantId");

-- CreateIndex
CREATE INDEX "PointsCalculation_userId_idx" ON "PointsCalculation"("userId");

-- CreateIndex
CREATE INDEX "PointsCalculation_status_idx" ON "PointsCalculation"("status");

-- CreateIndex
CREATE INDEX "PointsRule_loyaltyProgramId_idx" ON "PointsRule"("loyaltyProgramId");

-- CreateIndex
CREATE INDEX "Reward_loyaltyProgramId_idx" ON "Reward"("loyaltyProgramId");

-- AddForeignKey
ALTER TABLE "LoyaltyProgram" ADD CONSTRAINT "LoyaltyProgram_merchantId_fkey" FOREIGN KEY ("merchantId") REFERENCES "Merchant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PointsRule" ADD CONSTRAINT "PointsRule_loyaltyProgramId_fkey" FOREIGN KEY ("loyaltyProgramId") REFERENCES "LoyaltyProgram"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Reward" ADD CONSTRAINT "Reward_loyaltyProgramId_fkey" FOREIGN KEY ("loyaltyProgramId") REFERENCES "LoyaltyProgram"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PointsBalance" ADD CONSTRAINT "PointsBalance_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PointsBalance" ADD CONSTRAINT "PointsBalance_merchantId_fkey" FOREIGN KEY ("merchantId") REFERENCES "Merchant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PointsCalculation" ADD CONSTRAINT "PointsCalculation_transactionId_fkey" FOREIGN KEY ("transactionId") REFERENCES "PointsTransaction"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PointsCalculation" ADD CONSTRAINT "PointsCalculation_merchantId_fkey" FOREIGN KEY ("merchantId") REFERENCES "Merchant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PointsCalculation" ADD CONSTRAINT "PointsCalculation_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
