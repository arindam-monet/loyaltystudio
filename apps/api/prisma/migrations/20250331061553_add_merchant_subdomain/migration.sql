/*
  Warnings:

  - A unique constraint covering the columns `[subdomain]` on the table `Merchant` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "Merchant" ADD COLUMN     "subdomain" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "Merchant_subdomain_key" ON "Merchant"("subdomain");

-- CreateIndex
CREATE INDEX "Merchant_subdomain_idx" ON "Merchant"("subdomain");
