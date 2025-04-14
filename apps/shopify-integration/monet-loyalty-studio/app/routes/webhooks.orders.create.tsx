import { ActionFunctionArgs } from "@remix-run/node";
import { authenticate } from "../shopify.server";
import { getMerchantByShop } from "../models/merchant.server";
import { LoyaltyStudioApiClient } from "../services/loyaltyStudioApi";

export const action = async ({ request }: ActionFunctionArgs) => {
  const { topic, shop, body } = await authenticate.webhook(request);

  if (topic !== "ORDERS_CREATE") {
    return new Response("Invalid webhook topic", { status: 400 });
  }

  try {
    // Get merchant mapping
    const merchantMapping = await getMerchantByShop(shop);
    if (!merchantMapping || !merchantMapping.isActive) {
      return new Response("Merchant not found or inactive", { status: 404 });
    }
    
    // Process order in LoyaltyStudio
    const apiClient = new LoyaltyStudioApiClient(
      "temp-api-key", // In a real implementation, you would use a stored API key
      merchantMapping.loyaltyStudioMerchantId
    );
    
    const orderData = JSON.parse(body);
    await apiClient.processOrder(orderData);
    
    return new Response("Webhook processed successfully", { status: 200 });
  } catch (error) {
    console.error("Error processing order webhook:", error);
    return new Response("Error processing webhook", { status: 500 });
  }
};

export default function OrdersCreateWebhook() {
  return null;
}
