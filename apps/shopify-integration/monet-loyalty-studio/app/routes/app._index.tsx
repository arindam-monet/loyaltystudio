import { useEffect, useState } from "react";
import type { ActionFunctionArgs, LoaderFunctionArgs } from "@remix-run/node";
import { json } from "@remix-run/node";
import { useFetcher, useLoaderData } from "@remix-run/react";
import {
  Page,
  Layout,
  Text,
  Card,
  Button,
  BlockStack,
  Box,
  List,
  Link,
  InlineStack,
  EmptyState,
  SkeletonBodyText,
  SkeletonDisplayText,
  Icon,
  Badge,
  Divider,
  ButtonGroup,
  Banner,
} from "@shopify/polaris";
import { TitleBar, useAppBridge } from "@shopify/app-bridge-react";
import { authenticate } from "../shopify.server";
import { getMerchantByShop } from "../models/merchant.server";
import { StarFilledMinor, StarOutlineMinor } from "@shopify/polaris-icons";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const { session } = await authenticate.admin(request);
  
  // Check if merchant exists in our database
  const merchant = await getMerchantByShop(session.shop);
  
  return json({
    shop: session.shop,
    merchant,
  });
};

export const action = async ({ request }: ActionFunctionArgs) => {
  const { session, admin } = await authenticate.admin(request);
  const formData = await request.formData();
  const action = formData.get("action");
  
  if (action === "setup_wizard") {
    // Redirect to setup wizard
    return json({ redirectTo: "/app/setup" });
  }
  
  return null;
};

export default function Index() {
  const { shop, merchant } = useLoaderData<typeof loader>();
  const fetcher = useFetcher<typeof action>();
  const shopify = useAppBridge();
  const [isLoading, setIsLoading] = useState(false);
  
  useEffect(() => {
    if (fetcher.data?.redirectTo) {
      // Navigate to the setup wizard
      window.location.href = fetcher.data.redirectTo;
    }
  }, [fetcher.data]);
  
  const startSetupWizard = () => {
    fetcher.submit({ action: "setup_wizard" }, { method: "POST" });
  };

  return (
    <Page>
      <TitleBar title="LoyaltyStudio for Shopify" />
      <BlockStack gap="500">
        {!merchant ? (
          // Show setup screen if merchant doesn't exist
          <Layout>
            <Layout.Section>
              <Card>
                <BlockStack gap="500">
                  <BlockStack gap="200">
                    <Text as="h2" variant="headingMd">
                      Welcome to LoyaltyStudio for Shopify
                    </Text>
                    <Text variant="bodyMd" as="p">
                      Create a powerful loyalty program for your Shopify store in minutes. Reward customers for purchases, referrals, and more.
                    </Text>
                  </BlockStack>
                  <EmptyState
                    heading="Get started with your loyalty program"
                    action={{
                      content: "Set up your loyalty program",
                      onAction: startSetupWizard,
                      loading: isLoading,
                    }}
                    image="https://cdn.shopify.com/s/files/1/0262/4071/2726/files/emptystate-files.png"
                  >
                    <p>Create a loyalty program tailored to your business in just a few steps.</p>
                  </EmptyState>
                </BlockStack>
              </Card>
            </Layout.Section>
            <Layout.Section variant="oneThird">
              <BlockStack gap="500">
                <Card>
                  <BlockStack gap="200">
                    <Text as="h2" variant="headingMd">
                      Why choose LoyaltyStudio?
                    </Text>
                    <List>
                      <List.Item>Quick 10-minute setup</List.Item>
                      <List.Item>AI-powered program suggestions</List.Item>
                      <List.Item>Automatic data synchronization</List.Item>
                      <List.Item>Customizable rewards and rules</List.Item>
                      <List.Item>Seamless storefront integration</List.Item>
                    </List>
                  </BlockStack>
                </Card>
              </BlockStack>
            </Layout.Section>
          </Layout>
        ) : (
          // Show dashboard if merchant exists
          <Layout>
            <Layout.Section>
              <Card>
                <BlockStack gap="400">
                  <Text as="h2" variant="headingMd">
                    Loyalty Program Dashboard
                  </Text>
                  <BlockStack gap="200">
                    <InlineStack align="space-between">
                      <Text as="span" variant="bodyMd">
                        Active Members
                      </Text>
                      <Text as="span" variant="bodyMd" fontWeight="bold">
                        0
                      </Text>
                    </InlineStack>
                    <InlineStack align="space-between">
                      <Text as="span" variant="bodyMd">
                        Points Issued
                      </Text>
                      <Text as="span" variant="bodyMd" fontWeight="bold">
                        0
                      </Text>
                    </InlineStack>
                    <InlineStack align="space-between">
                      <Text as="span" variant="bodyMd">
                        Rewards Redeemed
                      </Text>
                      <Text as="span" variant="bodyMd" fontWeight="bold">
                        0
                      </Text>
                    </InlineStack>
                  </BlockStack>
                  <Divider />
                  <ButtonGroup>
                    <Button url="/app/program/members">View Members</Button>
                    <Button url="/app/program/rewards">Manage Rewards</Button>
                    <Button url="/app/program/rules">Edit Rules</Button>
                  </ButtonGroup>
                </BlockStack>
              </Card>
              <Box paddingBlockStart="400">
                <Card>
                  <BlockStack gap="400">
                    <Text as="h2" variant="headingMd">
                      Recent Activity
                    </Text>
                    <Banner title="No recent activity" status="info">
                      <p>Your loyalty program is set up, but there hasn't been any activity yet.</p>
                    </Banner>
                  </BlockStack>
                </Card>
              </Box>
            </Layout.Section>
            <Layout.Section variant="oneThird">
              <BlockStack gap="500">
                <Card>
                  <BlockStack gap="200">
                    <Text as="h2" variant="headingMd">
                      Program Status
                    </Text>
                    <InlineStack align="space-between">
                      <Text as="span" variant="bodyMd">
                        Status
                      </Text>
                      <Badge status="success">Active</Badge>
                    </InlineStack>
                    <InlineStack align="space-between">
                      <Text as="span" variant="bodyMd">
                        Points Currency
                      </Text>
                      <Text as="span" variant="bodyMd">
                        {merchant.settings?.pointsTerminology || "Points"}
                      </Text>
                    </InlineStack>
                    <InlineStack align="space-between">
                      <Text as="span" variant="bodyMd">
                        Auto-Enrollment
                      </Text>
                      <Text as="span" variant="bodyMd">
                        {merchant.settings?.autoEnrollCustomers ? "Enabled" : "Disabled"}
                      </Text>
                    </InlineStack>
                  </BlockStack>
                </Card>
                <Card>
                  <BlockStack gap="200">
                    <Text as="h2" variant="headingMd">
                      Quick Actions
                    </Text>
                    <List>
                      <List.Item>
                        <Link url="/app/program/settings" removeUnderline>
                          Program Settings
                        </Link>
                      </List.Item>
                      <List.Item>
                        <Link url="/app/storefront" removeUnderline>
                          Storefront Integration
                        </Link>
                      </List.Item>
                      <List.Item>
                        <Link url="/app/program/campaigns" removeUnderline>
                          Create Campaign
                        </Link>
                      </List.Item>
                      <List.Item>
                        <Link url="/app/analytics" removeUnderline>
                          View Analytics
                        </Link>
                      </List.Item>
                    </List>
                  </BlockStack>
                </Card>
              </BlockStack>
            </Layout.Section>
          </Layout>
        )}
      </BlockStack>
    </Page>
  );
}
