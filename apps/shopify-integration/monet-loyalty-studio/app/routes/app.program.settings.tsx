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
  FormLayout,
  TextField,
  Checkbox,
  Button,
  Banner,
  InlineStack,
  Divider,
} from "@shopify/polaris";
import { TitleBar } from "@shopify/app-bridge-react";
import { authenticate } from "../shopify.server";
import { getMerchantByShop, createOrUpdateShopifySettings } from "../models/merchant.server";

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

export const action = async ({ request }: ActionFunctionArgs) => {
  const { session } = await authenticate.admin(request);
  const formData = await request.formData();
  
  // Get merchant mapping
  const merchant = await getMerchantByShop(session.shop);
  if (!merchant) {
    return json({ error: "Merchant not found" });
  }
  
  try {
    // Update settings
    await createOrUpdateShopifySettings(merchant.id, {
      pointsTerminology: formData.get("pointsTerminology") as string,
      autoEnrollCustomers: formData.get("autoEnrollCustomers") === "true",
      displayPointsInHeader: formData.get("displayPointsInHeader") === "true",
      displayPointsInCart: formData.get("displayPointsInCart") === "true",
      themeExtensionEnabled: formData.get("themeExtensionEnabled") === "true",
    });
    
    return json({ success: true });
  } catch (error) {
    console.error("Error updating settings:", error);
    return json({ error: "Failed to update settings" });
  }
};

export default function ProgramSettingsPage() {
  const { merchant } = useLoaderData<typeof loader>();
  const actionData = useActionData<typeof action>();
  const submit = useSubmit();
  
  const [pointsTerminology, setPointsTerminology] = useState(
    merchant.settings?.pointsTerminology || "Points"
  );
  const [autoEnrollCustomers, setAutoEnrollCustomers] = useState(
    merchant.settings?.autoEnrollCustomers ?? true
  );
  const [displayPointsInHeader, setDisplayPointsInHeader] = useState(
    merchant.settings?.displayPointsInHeader ?? true
  );
  const [displayPointsInCart, setDisplayPointsInCart] = useState(
    merchant.settings?.displayPointsInCart ?? true
  );
  const [themeExtensionEnabled, setThemeExtensionEnabled] = useState(
    merchant.settings?.themeExtensionEnabled ?? true
  );
  
  const [isSaving, setIsSaving] = useState(false);
  
  const handleSave = () => {
    setIsSaving(true);
    
    const formData = new FormData();
    formData.append("pointsTerminology", pointsTerminology);
    formData.append("autoEnrollCustomers", autoEnrollCustomers.toString());
    formData.append("displayPointsInHeader", displayPointsInHeader.toString());
    formData.append("displayPointsInCart", displayPointsInCart.toString());
    formData.append("themeExtensionEnabled", themeExtensionEnabled.toString());
    
    submit(formData, { method: "post" });
  };
  
  return (
    <Page>
      <TitleBar title="Program Settings" />
      <BlockStack gap="500">
        <Layout>
          <Layout.Section>
            <Card>
              <BlockStack gap="400">
                <Text as="h2" variant="headingMd">
                  Program Settings
                </Text>
                
                {actionData?.success && (
                  <Banner title="Settings updated successfully" status="success" />
                )}
                
                {actionData?.error && (
                  <Banner title="Error updating settings" status="critical">
                    <p>{actionData.error}</p>
                  </Banner>
                )}
                
                <FormLayout>
                  <TextField
                    label="Points Terminology"
                    value={pointsTerminology}
                    onChange={setPointsTerminology}
                    autoComplete="off"
                    helpText="What do you want to call your points? (e.g., Points, Stars, Coins)"
                  />
                  
                  <Divider />
                  
                  <Text as="h3" variant="headingMd">
                    Customer Experience
                  </Text>
                  
                  <Checkbox
                    label="Automatically enroll customers in the loyalty program"
                    checked={autoEnrollCustomers}
                    onChange={setAutoEnrollCustomers}
                    helpText="If enabled, customers will be automatically enrolled when they create an account."
                  />
                  
                  <Checkbox
                    label="Display points balance in header"
                    checked={displayPointsInHeader}
                    onChange={setDisplayPointsInHeader}
                    helpText="Show the customer's points balance in the store header."
                  />
                  
                  <Checkbox
                    label="Display points to be earned at checkout"
                    checked={displayPointsInCart}
                    onChange={setDisplayPointsInCart}
                    helpText="Show how many points the customer will earn on their purchase at checkout."
                  />
                  
                  <Divider />
                  
                  <Text as="h3" variant="headingMd">
                    Theme Integration
                  </Text>
                  
                  <Checkbox
                    label="Enable theme app extension"
                    checked={themeExtensionEnabled}
                    onChange={setThemeExtensionEnabled}
                    helpText="Enable the theme app extension to display loyalty program elements in your store."
                  />
                </FormLayout>
                
                <InlineStack align="end">
                  <Button primary onClick={handleSave} loading={isSaving}>
                    Save Settings
                  </Button>
                </InlineStack>
              </BlockStack>
            </Card>
          </Layout.Section>
          <Layout.Section variant="oneThird">
            <BlockStack gap="500">
              <Card>
                <BlockStack gap="200">
                  <Text as="h2" variant="headingMd">
                    About Program Settings
                  </Text>
                  <Text as="p" variant="bodyMd">
                    These settings control how your loyalty program appears and functions in your store.
                  </Text>
                  <Text as="p" variant="bodyMd">
                    Changes to these settings will take effect immediately for new customers and orders.
                  </Text>
                </BlockStack>
              </Card>
              <Card>
                <BlockStack gap="200">
                  <Text as="h2" variant="headingMd">
                    Need More Advanced Settings?
                  </Text>
                  <Text as="p" variant="bodyMd">
                    For more advanced loyalty program configuration, visit the LoyaltyStudio merchant portal.
                  </Text>
                  <Button url="https://merchant.loyaltystudio.ai" external>
                    Go to Merchant Portal
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
