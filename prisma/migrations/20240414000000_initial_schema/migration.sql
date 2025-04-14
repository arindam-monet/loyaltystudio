-- CreateTable
CREATE TABLE "Session" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "shop" TEXT NOT NULL,
  "state" TEXT NOT NULL,
  "isOnline" BOOLEAN NOT NULL DEFAULT false,
  "scope" TEXT,
  "expires" DATETIME,
  "accessToken" TEXT NOT NULL,
  "userId" BIGINT,
  "firstName" TEXT,
  "lastName" TEXT,
  "email" TEXT,
  "accountOwner" BOOLEAN NOT NULL DEFAULT false,
  "locale" TEXT,
  "collaborator" BOOLEAN DEFAULT false,
  "emailVerified" BOOLEAN DEFAULT false
);

-- CreateTable
CREATE TABLE "MerchantMapping" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "shopifyShopId" TEXT NOT NULL,
  "shopifyDomain" TEXT NOT NULL,
  "loyaltyStudioMerchantId" TEXT NOT NULL,
  "accessToken" TEXT NOT NULL,
  "scopes" TEXT NOT NULL,
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "WebhookSubscription" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "merchantMappingId" TEXT NOT NULL,
  "topic" TEXT NOT NULL,
  "address" TEXT NOT NULL,
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" DATETIME NOT NULL,
  CONSTRAINT "WebhookSubscription_merchantMappingId_fkey" FOREIGN KEY ("merchantMappingId") REFERENCES "MerchantMapping" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ShopifySettings" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "merchantMappingId" TEXT NOT NULL,
  "pointsTerminology" TEXT NOT NULL DEFAULT 'Points',
  "autoEnrollCustomers" BOOLEAN NOT NULL DEFAULT true,
  "displayPointsInHeader" BOOLEAN NOT NULL DEFAULT true,
  "displayPointsInCart" BOOLEAN NOT NULL DEFAULT true,
  "themeExtensionEnabled" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" DATETIME NOT NULL,
  CONSTRAINT "ShopifySettings_merchantMappingId_fkey" FOREIGN KEY ("merchantMappingId") REFERENCES "MerchantMapping" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "MerchantMapping_shopifyShopId_key" ON "MerchantMapping"("shopifyShopId");

-- CreateIndex
CREATE UNIQUE INDEX "MerchantMapping_shopifyDomain_key" ON "MerchantMapping"("shopifyDomain");

-- CreateIndex
CREATE UNIQUE INDEX "WebhookSubscription_merchantMappingId_topic_key" ON "WebhookSubscription"("merchantMappingId", "topic");

-- CreateIndex
CREATE UNIQUE INDEX "ShopifySettings_merchantMappingId_key" ON "ShopifySettings"("merchantMappingId");
