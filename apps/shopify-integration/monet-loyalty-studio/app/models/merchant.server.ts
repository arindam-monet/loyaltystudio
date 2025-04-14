import { prisma } from "../db.server";

export async function createMerchantMapping(
  session: any,
  shopData: any,
  loyaltyStudioMerchantId: string
) {
  return prisma.merchantMapping.create({
    data: {
      shopifyShopId: shopData.id,
      shopifyDomain: session.shop,
      loyaltyStudioMerchantId,
      accessToken: session.accessToken,
      scopes: session.scope || "",
    },
  });
}

export async function getMerchantByShop(shop: string) {
  return prisma.merchantMapping.findUnique({
    where: {
      shopifyDomain: shop,
    },
    include: {
      settings: true,
    },
  });
}

export async function getMerchantById(id: string) {
  return prisma.merchantMapping.findUnique({
    where: {
      id,
    },
    include: {
      settings: true,
    },
  });
}

export async function updateMerchantMapping(
  id: string,
  data: {
    accessToken?: string;
    scopes?: string;
    isActive?: boolean;
  }
) {
  return prisma.merchantMapping.update({
    where: {
      id,
    },
    data,
  });
}

export async function deactivateMerchantByShop(shop: string) {
  return prisma.merchantMapping.update({
    where: {
      shopifyDomain: shop,
    },
    data: {
      isActive: false,
    },
  });
}

export async function createOrUpdateShopifySettings(
  merchantMappingId: string,
  settings: {
    pointsTerminology?: string;
    autoEnrollCustomers?: boolean;
    displayPointsInHeader?: boolean;
    displayPointsInCart?: boolean;
    themeExtensionEnabled?: boolean;
  }
) {
  return prisma.shopifySettings.upsert({
    where: {
      merchantMappingId,
    },
    update: settings,
    create: {
      merchantMappingId,
      ...settings,
    },
  });
}
