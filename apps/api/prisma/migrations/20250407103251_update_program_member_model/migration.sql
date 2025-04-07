-- CreateEnum
CREATE TYPE "WebhookEventType" AS ENUM ('transaction_created', 'points_earned', 'points_redeemed', 'points_adjusted', 'member_created', 'member_updated', 'member_deleted', 'tier_changed', 'reward_redeemed', 'reward_created', 'reward_updated', 'reward_deleted', 'campaign_started', 'campaign_ended', 'campaign_updated');

-- DropForeignKey
ALTER TABLE "PointsBalance" DROP CONSTRAINT "PointsBalance_userId_fkey";

-- DropForeignKey
ALTER TABLE "PointsCalculation" DROP CONSTRAINT "PointsCalculation_userId_fkey";

-- DropForeignKey
ALTER TABLE "PointsTransaction" DROP CONSTRAINT "PointsTransaction_userId_fkey";

-- DropForeignKey
ALTER TABLE "ProgramMember" DROP CONSTRAINT "ProgramMember_userId_fkey";

-- DropForeignKey
ALTER TABLE "RewardRedemption" DROP CONSTRAINT "RewardRedemption_userId_fkey";

-- DropForeignKey
ALTER TABLE "SegmentMember" DROP CONSTRAINT "SegmentMember_userId_fkey";

-- DropIndex
DROP INDEX "ProgramMember_userId_tierId_key";

-- AlterTable
ALTER TABLE "PointsBalance" ADD COLUMN     "programMemberId" TEXT,
ALTER COLUMN "userId" DROP NOT NULL;

-- AlterTable
ALTER TABLE "PointsCalculation" ADD COLUMN     "programMemberId" TEXT,
ALTER COLUMN "userId" DROP NOT NULL;

-- AlterTable
ALTER TABLE "PointsTransaction" ADD COLUMN     "programMemberId" TEXT,
ALTER COLUMN "userId" DROP NOT NULL;

-- AlterTable
ALTER TABLE "ProgramMember" ADD COLUMN     "email" TEXT,
ADD COLUMN     "externalId" TEXT,
ADD COLUMN     "name" TEXT,
ADD COLUMN     "phoneNumber" TEXT,
ALTER COLUMN "userId" DROP NOT NULL;

-- AlterTable
ALTER TABLE "RewardRedemption" ADD COLUMN     "programMemberId" TEXT,
ALTER COLUMN "userId" DROP NOT NULL;

-- AlterTable
ALTER TABLE "SegmentMember" ADD COLUMN     "programMemberId" TEXT,
ALTER COLUMN "userId" DROP NOT NULL;

-- CreateTable
CREATE TABLE "Webhook" (
    "id" TEXT NOT NULL,
    "merchantId" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "events" "WebhookEventType"[],
    "secret" TEXT NOT NULL,
    "description" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Webhook_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WebhookDeliveryLog" (
    "id" TEXT NOT NULL,
    "webhookId" TEXT NOT NULL,
    "eventType" "WebhookEventType" NOT NULL,
    "payload" JSONB NOT NULL,
    "statusCode" INTEGER,
    "response" TEXT,
    "error" TEXT,
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "successful" BOOLEAN NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "WebhookDeliveryLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Webhook_merchantId_idx" ON "Webhook"("merchantId");

-- CreateIndex
CREATE INDEX "WebhookDeliveryLog_webhookId_idx" ON "WebhookDeliveryLog"("webhookId");

-- CreateIndex
CREATE INDEX "WebhookDeliveryLog_eventType_idx" ON "WebhookDeliveryLog"("eventType");

-- CreateIndex
CREATE INDEX "WebhookDeliveryLog_successful_idx" ON "WebhookDeliveryLog"("successful");

-- CreateIndex
CREATE INDEX "PointsTransaction_programMemberId_idx" ON "PointsTransaction"("programMemberId");

-- CreateIndex
CREATE INDEX "ProgramMember_email_idx" ON "ProgramMember"("email");

-- CreateIndex
CREATE INDEX "RewardRedemption_programMemberId_idx" ON "RewardRedemption"("programMemberId");

-- AddForeignKey
ALTER TABLE "PointsTransaction" ADD CONSTRAINT "PointsTransaction_programMemberId_fkey" FOREIGN KEY ("programMemberId") REFERENCES "ProgramMember"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PointsTransaction" ADD CONSTRAINT "PointsTransaction_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProgramMember" ADD CONSTRAINT "ProgramMember_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SegmentMember" ADD CONSTRAINT "SegmentMember_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RewardRedemption" ADD CONSTRAINT "RewardRedemption_programMemberId_fkey" FOREIGN KEY ("programMemberId") REFERENCES "ProgramMember"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RewardRedemption" ADD CONSTRAINT "RewardRedemption_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PointsBalance" ADD CONSTRAINT "PointsBalance_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PointsCalculation" ADD CONSTRAINT "PointsCalculation_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Webhook" ADD CONSTRAINT "Webhook_merchantId_fkey" FOREIGN KEY ("merchantId") REFERENCES "Merchant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WebhookDeliveryLog" ADD CONSTRAINT "WebhookDeliveryLog_webhookId_fkey" FOREIGN KEY ("webhookId") REFERENCES "Webhook"("id") ON DELETE CASCADE ON UPDATE CASCADE;
