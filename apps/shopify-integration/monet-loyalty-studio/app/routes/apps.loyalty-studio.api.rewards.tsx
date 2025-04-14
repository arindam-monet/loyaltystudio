import { LoaderFunctionArgs } from "@remix-run/node";
import { authenticate } from "../shopify.server";
import { getMerchantByShop } from "../models/merchant.server";
import { LoyaltyStudioApiClient } from "../services/loyaltyStudioApi";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  try {
    // Get the shop from the request
    const url = new URL(request.url);
    const shop = url.searchParams.get("shop");
    
    if (!shop) {
      return new Response(JSON.stringify({ error: "Shop parameter is required" }), {
        status: 400,
        headers: {
          "Content-Type": "application/json",
        },
      });
    }
    
    // Get merchant mapping
    const merchantMapping = await getMerchantByShop(shop);
    if (!merchantMapping || !merchantMapping.isActive) {
      return new Response(JSON.stringify({ error: "Merchant not found or inactive" }), {
        status: 404,
        headers: {
          "Content-Type": "application/json",
        },
      });
    }
    
    // Get rewards from LoyaltyStudio API
    const apiClient = new LoyaltyStudioApiClient(
      "temp-api-key", // In a real implementation, you would use a stored API key
      merchantMapping.loyaltyStudioMerchantId
    );
    
    // In a real implementation, this would call the actual API
    // For now, we'll return mock rewards
    const rewards = [
      {
        id: "reward-1",
        name: "10% Off Your Next Order",
        description: "Get 10% off your next order",
        pointsCost: 100,
        type: "discount",
        discountValue: 10,
        discountType: "percentage",
      },
      {
        id: "reward-2",
        name: "Free Shipping",
        description: "Get free shipping on your next order",
        pointsCost: 200,
        type: "shipping",
      },
      {
        id: "reward-3",
        name: "$5 Off Your Next Order",
        description: "Get $5 off your next order",
        pointsCost: 50,
        type: "discount",
        discountValue: 5,
        discountType: "fixed",
      },
    ];
    
    return new Response(JSON.stringify({ rewards }), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
      },
    });
  } catch (error) {
    console.error("Error fetching rewards:", error);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: {
        "Content-Type": "application/json",
      },
    });
  }
};
