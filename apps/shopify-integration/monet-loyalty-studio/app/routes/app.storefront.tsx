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
  InlineStack,
  Tabs,
  Box,
  Divider,
  Icon,
  Thumbnail,
} from "@shopify/polaris";
import { TitleBar } from "@shopify/app-bridge-react";
import { CircleTickMajor, CircleCancelMajor } from "@shopify/polaris-icons";
import { authenticate } from "../shopify.server";
import { getMerchantByShop } from "../models/merchant.server";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const { session, admin } = await authenticate.admin(request);
  
  // Get merchant mapping
  const merchant = await getMerchantByShop(session.shop);
  if (!merchant) {
    return json({ error: "Merchant not found" });
  }
  
  // Check if theme app extension is installed
  // In a real implementation, you would check if the theme app extension is installed
  const themeAppExtensionInstalled = false;
  
  return json({
    merchant,
    themeAppExtensionInstalled,
  });
};

export const action = async ({ request }: ActionFunctionArgs) => {
  const { session, admin } = await authenticate.admin(request);
  const formData = await request.formData();
  const action = formData.get("action");
  
  if (action === "install_extension") {
    try {
      // In a real implementation, you would install the theme app extension
      return json({ success: true, message: "Theme app extension installed successfully" });
    } catch (error) {
      console.error("Error installing theme app extension:", error);
      return json({ error: "Failed to install theme app extension" });
    }
  }
  
  return null;
};

export default function StorefrontPage() {
  const { merchant, themeAppExtensionInstalled } = useLoaderData<typeof loader>();
  const actionData = useActionData<typeof action>();
  const submit = useSubmit();
  
  const [selectedTab, setSelectedTab] = useState(0);
  const [isInstalling, setIsInstalling] = useState(false);
  
  const handleInstallExtension = () => {
    setIsInstalling(true);
    
    const formData = new FormData();
    formData.append("action", "install_extension");
    
    submit(formData, { method: "post" });
  };
  
  const tabs = [
    {
      id: "points-display",
      content: "Points Display",
      accessibilityLabel: "Points Display",
      panelID: "points-display-panel",
    },
    {
      id: "rewards-catalog",
      content: "Rewards Catalog",
      accessibilityLabel: "Rewards Catalog",
      panelID: "rewards-catalog-panel",
    },
    {
      id: "checkout-integration",
      content: "Checkout Integration",
      accessibilityLabel: "Checkout Integration",
      panelID: "checkout-integration-panel",
    },
  ];
  
  return (
    <Page>
      <TitleBar title="Storefront Integration" />
      <BlockStack gap="500">
        <Layout>
          <Layout.Section>
            <Card>
              <BlockStack gap="400">
                <Text as="h2" variant="headingMd">
                  Theme App Extension
                </Text>
                
                <Text as="p" variant="bodyMd">
                  The Theme App Extension allows you to display loyalty program elements in your storefront.
                </Text>
                
                {actionData?.success && (
                  <Banner title={actionData.message} status="success" />
                )}
                
                {actionData?.error && (
                  <Banner title="Error" status="critical">
                    <p>{actionData.error}</p>
                  </Banner>
                )}
                
                <InlineStack gap="200" align="center">
                  <Icon
                    source={themeAppExtensionInstalled ? CircleTickMajor : CircleCancelMajor}
                    color={themeAppExtensionInstalled ? "success" : "critical"}
                  />
                  <Text as="span" variant="bodyMd">
                    {themeAppExtensionInstalled
                      ? "Theme App Extension is installed"
                      : "Theme App Extension is not installed"}
                  </Text>
                </InlineStack>
                
                {!themeAppExtensionInstalled && (
                  <Button
                    primary
                    onClick={handleInstallExtension}
                    loading={isInstalling}
                  >
                    Install Theme App Extension
                  </Button>
                )}
                
                <Divider />
                
                <Tabs tabs={tabs} selected={selectedTab} onSelect={setSelectedTab} />
                
                <Box paddingBlockStart="400">
                  {selectedTab === 0 && (
                    <BlockStack gap="400">
                      <Text as="h3" variant="headingMd">
                        Points Display
                      </Text>
                      <Text as="p" variant="bodyMd">
                        Display the customer's points balance in your store header and customer account.
                      </Text>
                      <InlineStack gap="400">
                        <Thumbnail
                          source="https://cdn.shopify.com/s/files/1/0262/4071/2726/files/emptystate-files.png"
                          alt="Points display example"
                        />
                        <BlockStack gap="200">
                          <Text as="h4" variant="headingMd">
                            Features
                          </Text>
                          <ul>
                            <li>Display points balance in header</li>
                            <li>Show points balance in customer account</li>
                            <li>Customize points terminology</li>
                          </ul>
                        </BlockStack>
                      </InlineStack>
                    </BlockStack>
                  )}
                  
                  {selectedTab === 1 && (
                    <BlockStack gap="400">
                      <Text as="h3" variant="headingMd">
                        Rewards Catalog
                      </Text>
                      <Text as="p" variant="bodyMd">
                        Allow customers to browse and redeem rewards in your storefront.
                      </Text>
                      <InlineStack gap="400">
                        <Thumbnail
                          source="https://cdn.shopify.com/s/files/1/0262/4071/2726/files/emptystate-files.png"
                          alt="Rewards catalog example"
                        />
                        <BlockStack gap="200">
                          <Text as="h4" variant="headingMd">
                            Features
                          </Text>
                          <ul>
                            <li>Display available rewards</li>
                            <li>Show points required for each reward</li>
                            <li>Allow one-click redemption</li>
                          </ul>
                        </BlockStack>
                      </InlineStack>
                    </BlockStack>
                  )}
                  
                  {selectedTab === 2 && (
                    <BlockStack gap="400">
                      <Text as="h3" variant="headingMd">
                        Checkout Integration
                      </Text>
                      <Text as="p" variant="bodyMd">
                        Display points to be earned and allow reward redemption during checkout.
                      </Text>
                      <InlineStack gap="400">
                        <Thumbnail
                          source="https://cdn.shopify.com/s/files/1/0262/4071/2726/files/emptystate-files.png"
                          alt="Checkout integration example"
                        />
                        <BlockStack gap="200">
                          <Text as="h4" variant="headingMd">
                            Features
                          </Text>
                          <ul>
                            <li>Show points to be earned on purchase</li>
                            <li>Display available rewards at checkout</li>
                            <li>Apply rewards to order</li>
                          </ul>
                        </BlockStack>
                      </InlineStack>
                    </BlockStack>
                  )}
                </Box>
              </BlockStack>
            </Card>
          </Layout.Section>
          <Layout.Section variant="oneThird">
            <BlockStack gap="500">
              <Card>
                <BlockStack gap="200">
                  <Text as="h2" variant="headingMd">
                    About Storefront Integration
                  </Text>
                  <Text as="p" variant="bodyMd">
                    The Theme App Extension allows you to display loyalty program elements in your storefront without modifying your theme code.
                  </Text>
                  <Text as="p" variant="bodyMd">
                    After installing the extension, you can customize the appearance and placement of loyalty elements in your theme editor.
                  </Text>
                </BlockStack>
              </Card>
              <Card>
                <BlockStack gap="200">
                  <Text as="h2" variant="headingMd">
                    Need Help?
                  </Text>
                  <Text as="p" variant="bodyMd">
                    For more information on customizing the storefront integration, visit our documentation.
                  </Text>
                  <Button url="https://docs.loyaltystudio.ai/shopify/storefront" external>
                    View Documentation
                  </Button>
                </BlockStack>
              </Card>
            </BlockStack>
          </Layout.Section>
        </Layout>
      </BlockStack>
    </Page>
  );
}
