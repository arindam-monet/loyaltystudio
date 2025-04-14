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
    
    // Get points balance from LoyaltyStudio API
    const apiClient = new LoyaltyStudioApiClient(
      "temp-api-key", // In a real implementation, you would use a stored API key
      merchantMapping.loyaltyStudioMerchantId
    );
    
    // In a real implementation, this would call the actual API
    // For now, we'll return a mock response
    const balance = 500;
    
    return new Response(JSON.stringify({ balance }), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
      },
    });
  } catch (error) {
    console.error("Error fetching points balance:", error);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: {
        "Content-Type": "application/json",
      },
    });
  }
};
