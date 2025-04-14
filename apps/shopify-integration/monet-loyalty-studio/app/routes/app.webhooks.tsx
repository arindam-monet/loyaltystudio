import { useState } from "react";
import type { ActionFunctionArgs, LoaderFunctionArgs } from "@remix-run/node";
import { json } from "@remix-run/node";
import { useActionData, useLoaderData, useSubmit } from "@remix-run/react";
import {
  Page,
  Layout,
  Card,
  Text,
  BlockStack,
  Button,
  Banner,
  List,
  InlineStack,
  Icon,
} from "@shopify/polaris";
import { TitleBar } from "@shopify/app-bridge-react";
import { CircleTickMajor, CircleCancelMajor } from "@shopify/polaris-icons";
import { authenticate } from "../shopify.server";
import { getMerchantByShop } from "../models/merchant.server";
import { registerWebhooks } from "../models/webhook.server";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const { session } = await authenticate.admin(request);
  
  // Get merchant mapping
  const merchant = await getMerchantByShop(session.shop);
  
  return json({
    shop: session.shop,
    merchant,
  });
};

export const action = async ({ request }: ActionFunctionArgs) => {
  const { session, admin } = await authenticate.admin(request);
  
  try {
    // Register required webhooks
    await registerWebhooks(admin.graphql, [
      {
        topic: "ORDERS_CREATE",
        address: `${process.env.SHOPIFY_APP_URL}/webhooks/orders/create`,
      },
      {
        topic: "ORDERS_UPDATED",
        address: `${process.env.SHOPIFY_APP_URL}/webhooks/orders/update`,
      },
      {
        topic: "ORDERS_CANCELLED",
        address: `${process.env.SHOPIFY_APP_URL}/webhooks/orders/cancel`,
      },
      {
        topic: "CUSTOMERS_CREATE",
        address: `${process.env.SHOPIFY_APP_URL}/webhooks/customers/create`,
      },
      {
        topic: "CUSTOMERS_UPDATE",
        address: `${process.env.SHOPIFY_APP_URL}/webhooks/customers/update`,
      },
      {
        topic: "APP_UNINSTALLED",
        address: `${process.env.SHOPIFY_APP_URL}/webhooks/app/uninstalled`,
      },
    ]);
    
    return json({ success: true });
  } catch (error) {
    console.error("Error registering webhooks:", error);
    return json({ success: false, error: "Failed to register webhooks" });
  }
};

export default function WebhooksPage() {
  const { merchant } = useLoaderData<typeof loader>();
  const actionData = useActionData<typeof action>();
  const submit = useSubmit();
  const [isRegistering, setIsRegistering] = useState(false);
  
  const handleRegisterWebhooks = () => {
    setIsRegistering(true);
    submit({}, { method: "post" });
  };
  
  return (
    <Page>
      <TitleBar title="Webhooks" />
      <BlockStack gap="500">
        <Layout>
          <Layout.Section>
            <Card>
              <BlockStack gap="400">
                <Text as="h2" variant="headingMd">
                  Webhook Management
                </Text>
                
                <Text as="p" variant="bodyMd">
                  Webhooks allow LoyaltyStudio to receive real-time updates from your Shopify store.
                  These are required for the loyalty program to function properly.
                </Text>
                
                {actionData?.success && (
                  <Banner title="Webhooks registered successfully" status="success" />
                )}
                
                {actionData?.error && (
                  <Banner title="Error registering webhooks" status="critical">
                    <p>{actionData.error}</p>
                  </Banner>
                )}
                
                <BlockStack gap="400">
                  <Text as="h3" variant="headingMd">
                    Required Webhooks
                  </Text>
                  
                  <List type="bullet">
                    <List.Item>
                      <InlineStack gap="200" align="center">
                        <Icon source={CircleTickMajor} color="success" />
                        <Text as="span" variant="bodyMd">
                          Orders Create - Triggers points accrual when a new order is placed
                        </Text>
                      </InlineStack>
                    </List.Item>
                    <List.Item>
                      <InlineStack gap="200" align="center">
                        <Icon source={CircleTickMajor} color="success" />
                        <Text as="span" variant="bodyMd">
                          Orders Updated - Updates points when an order is modified
                        </Text>
                      </InlineStack>
                    </List.Item>
                    <List.Item>
                      <InlineStack gap="200" align="center">
                        <Icon source={CircleTickMajor} color="success" />
                        <Text as="span" variant="bodyMd">
                          Orders Cancelled - Reverses points when an order is cancelled
                        </Text>
                      </InlineStack>
                    </List.Item>
                    <List.Item>
                      <InlineStack gap="200" align="center">
                        <Icon source={CircleTickMajor} color="success" />
                        <Text as="span" variant="bodyMd">
                          Customers Create - Creates loyalty profiles for new customers
                        </Text>
                      </InlineStack>
                    </List.Item>
                    <List.Item>
                      <InlineStack gap="200" align="center">
                        <Icon source={CircleTickMajor} color="success" />
                        <Text as="span" variant="bodyMd">
                          Customers Update - Updates loyalty profiles when customer data changes
                        </Text>
                      </InlineStack>
                    </List.Item>
                    <List.Item>
                      <InlineStack gap="200" align="center">
                        <Icon source={CircleTickMajor} color="success" />
                        <Text as="span" variant="bodyMd">
                          App Uninstalled - Cleans up data when the app is uninstalled
                        </Text>
                      </InlineStack>
                    </List.Item>
                  </List>
                  
                  <Button
                    primary
                    onClick={handleRegisterWebhooks}
                    loading={isRegistering}
                  >
                    Register Webhooks
                  </Button>
                </BlockStack>
              </BlockStack>
            </Card>
          </Layout.Section>
          <Layout.Section variant="oneThird">
            <Card>
              <BlockStack gap="200">
                <Text as="h2" variant="headingMd">
                  Webhook Status
                </Text>
                <Text as="p" variant="bodyMd">
                  Webhooks are essential for your loyalty program to function properly.
                  They allow LoyaltyStudio to receive real-time updates from your Shopify store.
                </Text>
                <Text as="p" variant="bodyMd">
                  If you're experiencing issues with your loyalty program, try re-registering the webhooks.
                </Text>
              </BlockStack>
            </Card>
          </Layout.Section>
        </Layout>
      </BlockStack>
    </Page>
  );
}
