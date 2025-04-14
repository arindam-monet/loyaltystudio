import type { LoaderFunctionArgs } from "@remix-run/node";
import { json } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";
import {
  Page,
  Layout,
  Card,
  Text,
  BlockStack,
  Banner,
} from "@shopify/polaris";
import { TitleBar } from "@shopify/app-bridge-react";
import { authenticate } from "../shopify.server";
import { getMerchantByShop } from "../models/merchant.server";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const { session } = await authenticate.admin(request);
  
  // Get merchant mapping
  const merchant = await getMerchantByShop(session.shop);
  if (!merchant) {
    return json({ error: "Merchant not found" });
  }
  
  return json({
    merchant,
  });
};

export default function AnalyticsPage() {
  const { merchant } = useLoaderData<typeof loader>();
  
  return (
    <Page>
      <TitleBar title="Analytics" />
      <BlockStack gap="500">
        <Layout>
          <Layout.Section>
            <Card>
              <BlockStack gap="400">
                <Text as="h2" variant="headingMd">
                  Program Analytics
                </Text>
                
                <Banner title="Coming Soon" status="info">
                  <p>The program analytics functionality is coming soon.</p>
                </Banner>
              </BlockStack>
            </Card>
          </Layout.Section>
        </Layout>
      </BlockStack>
    </Page>
  );
}
