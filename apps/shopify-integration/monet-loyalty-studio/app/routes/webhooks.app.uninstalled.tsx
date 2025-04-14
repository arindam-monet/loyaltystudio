import type { ActionFunctionArgs } from "@remix-run/node";
import { authenticate } from "../shopify.server";
import { prisma } from "../db.server";
import { deactivateMerchantByShop } from "../models/merchant.server";

export const action = async ({ request }: ActionFunctionArgs) => {
  const { shop, session, topic } = await authenticate.webhook(request);

  console.log(`Received ${topic} webhook for ${shop}`);

  try {
    // Deactivate merchant in our database
    await deactivateMerchantByShop(shop);

    // Webhook requests can trigger multiple times and after an app has already been uninstalled.
    // If this webhook already ran, the session may have been deleted previously.
    if (session) {
      await prisma.session.deleteMany({ where: { shop } });
    }

    return new Response("Webhook processed successfully", { status: 200 });
  } catch (error) {
    console.error("Error processing app uninstalled webhook:", error);
    return new Response("Error processing webhook", { status: 500 });
  }
};

export default function AppUninstalledWebhook() {
  return null;
}
