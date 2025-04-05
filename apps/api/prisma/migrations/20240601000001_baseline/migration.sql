-- CreateEnum
CREATE TYPE "WebhookEventType" AS ENUM (
  'transaction_created',
  'points_earned',
  'points_redeemed',
  'points_adjusted',
  'member_created',
  'member_updated',
  'member_deleted',
  'tier_changed',
  'reward_redeemed',
  'reward_created',
  'reward_updated',
  'reward_deleted',
  'campaign_started',
  'campaign_ended',
  'campaign_updated'
);

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

-- AddForeignKey
ALTER TABLE "Webhook" ADD CONSTRAINT "Webhook_merchantId_fkey" FOREIGN KEY ("merchantId") REFERENCES "Merchant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WebhookDeliveryLog" ADD CONSTRAINT "WebhookDeliveryLog_webhookId_fkey" FOREIGN KEY ("webhookId") REFERENCES "Webhook"("id") ON DELETE CASCADE ON UPDATE CASCADE;
