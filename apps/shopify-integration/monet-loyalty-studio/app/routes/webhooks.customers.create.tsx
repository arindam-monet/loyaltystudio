import { ActionFunctionArgs } from "@remix-run/node";
import { authenticate } from "../shopify.server";
import { getMerchantByShop } from "../models/merchant.server";
import { LoyaltyStudioApiClient } from "../services/loyaltyStudioApi";

export const action = async ({ request }: ActionFunctionArgs) => {
  const { topic, shop, body } = await authenticate.webhook(request);

  if (topic !== "CUSTOMERS_CREATE") {
    return new Response("Invalid webhook topic", { status: 400 });
  }

  try {
    // Get merchant mapping
    const merchantMapping = await getMerchantByShop(shop);
    if (!merchantMapping || !merchantMapping.isActive) {
      return new Response("Merchant not found or inactive", { status: 404 });
    }
    
    // Check if auto-enrollment is enabled
    if (!merchantMapping.settings?.autoEnrollCustomers) {
      return new Response("Auto-enrollment disabled", { status: 200 });
    }
    
    // Process customer in LoyaltyStudio
    const apiClient = new LoyaltyStudioApiClient(
      "temp-api-key", // In a real implementation, you would use a stored API key
      merchantMapping.loyaltyStudioMerchantId
    );
    
    const customerData = JSON.parse(body);
    await apiClient.syncCustomer({
      id: customerData.id,
      email: customerData.email,
      firstName: customerData.first_name,
      lastName: customerData.last_name,
    });
    
    return new Response("Webhook processed successfully", { status: 200 });
  } catch (error) {
    console.error("Error processing customer webhook:", error);
    return new Response("Error processing webhook", { status: 500 });
  }
};

export default function CustomersCreateWebhook() {
  return null;
}
