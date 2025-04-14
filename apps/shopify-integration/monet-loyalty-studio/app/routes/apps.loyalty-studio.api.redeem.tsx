import { ActionFunctionArgs } from "@remix-run/node";
import { authenticate } from "../shopify.server";
import { getMerchantByShop } from "../models/merchant.server";
import { LoyaltyStudioApiClient } from "../services/loyaltyStudioApi";

export const action = async ({ request }: ActionFunctionArgs) => {
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
    
    // Get customer ID from the request
    const customerId = url.searchParams.get("customerId");
    
    if (!customerId) {
      return new Response(JSON.stringify({ error: "Customer ID is required" }), {
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
    
    // Parse request body
    const body = await request.json();
    const { rewardId, applyToCart } = body;
    
    if (!rewardId) {
      return new Response(JSON.stringify({ error: "Reward ID is required" }), {
        status: 400,
        headers: {
          "Content-Type": "application/json",
        },
      });
    }
    
    // Redeem reward using LoyaltyStudio API
    const apiClient = new LoyaltyStudioApiClient(
      "temp-api-key", // In a real implementation, you would use a stored API key
      merchantMapping.loyaltyStudioMerchantId
    );
    
    // In a real implementation, this would call the actual API
    // For now, we'll return a mock response
    
    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
      },
    });
  } catch (error) {
    console.error("Error redeeming reward:", error);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: {
        "Content-Type": "application/json",
      },
    });
  }
};
