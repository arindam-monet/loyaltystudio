import { useState } from "react";
import type { ActionFunctionArgs, LoaderFunctionArgs } from "@remix-run/node";
import { json, redirect } from "@remix-run/node";
import { useActionData, useLoaderData, useSubmit } from "@remix-run/react";
import {
  Page,
  Layout,
  Card,
  Text,
  BlockStack,
  Box,
  ProgressBar,
  Button,
  FormLayout,
  TextField,
  Select,
  Checkbox,
  InlineStack,
  Banner,
  Divider,
} from "@shopify/polaris";
import { TitleBar } from "@shopify/app-bridge-react";
import { authenticate } from "../shopify.server";
import { getMerchantByShop } from "../models/merchant.server";
import { LoyaltyStudioApiClient } from "../services/loyaltyStudioApi";
import { createMerchantMapping, createOrUpdateShopifySettings } from "../models/merchant.server";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const { session, admin } = await authenticate.admin(request);
  
  // Check if merchant already exists
  const merchant = await getMerchantByShop(session.shop);
  if (merchant) {
    return redirect("/app");
  }
  
  // Get shop data
  const response = await admin.graphql(
    `#graphql
      query getShopData {
        shop {
          id
          name
          email
          primaryDomain {
            url
          }
          billingAddress {
            countryCode
          }
          currencyCode
          timezoneAbbreviation
        }
      }
    `
  );
  
  const responseJson = await response.json();
  const shopData = responseJson.data.shop;
  
  return json({
    shop: session.shop,
    shopData,
  });
};

export const action = async ({ request }: ActionFunctionArgs) => {
  const { session, admin } = await authenticate.admin(request);
  const formData = await request.formData();
  
  const step = formData.get("step");
  const programName = formData.get("programName");
  const programDescription = formData.get("programDescription");
  const pointsTerminology = formData.get("pointsTerminology");
  const pointsPerDollar = formData.get("pointsPerDollar");
  const autoEnrollCustomers = formData.get("autoEnrollCustomers") === "true";
  const displayPointsInHeader = formData.get("displayPointsInHeader") === "true";
  const displayPointsInCart = formData.get("displayPointsInCart") === "true";
  
  // Get shop data
  const response = await admin.graphql(
    `#graphql
      query getShopData {
        shop {
          id
          name
          email
          primaryDomain {
            url
          }
        }
      }
    `
  );
  
  const responseJson = await response.json();
  const shopData = responseJson.data.shop;
  
  if (step === "complete") {
    try {
      // Create merchant in LoyaltyStudio
      // Note: In a real implementation, you would have an API key for authentication
      const apiClient = new LoyaltyStudioApiClient("temp-api-key", "temp-merchant-id");
      const merchantResponse = await apiClient.createMerchant({
        id: shopData.id,
        name: shopData.name,
        email: shopData.email,
        domain: session.shop,
      });
      
      // Create merchant mapping
      const loyaltyStudioMerchantId = merchantResponse.data.id;
      const merchantMapping = await createMerchantMapping(
        session,
        shopData,
        loyaltyStudioMerchantId
      );
      
      // Create settings
      await createOrUpdateShopifySettings(merchantMapping.id, {
        pointsTerminology: pointsTerminology as string || "Points",
        autoEnrollCustomers,
        displayPointsInHeader,
        displayPointsInCart,
        themeExtensionEnabled: true,
      });
      
      // Register webhooks
      // This would be implemented in a real application
      
      return redirect("/app");
    } catch (error) {
      console.error("Error setting up merchant:", error);
      return json({ error: "Failed to set up merchant" });
    }
  }
  
  return json({
    step,
    programName,
    programDescription,
    pointsTerminology,
    pointsPerDollar,
    autoEnrollCustomers,
    displayPointsInHeader,
    displayPointsInCart,
  });
};

export default function SetupWizard() {
  const { shopData } = useLoaderData<typeof loader>();
  const actionData = useActionData<typeof action>();
  const submit = useSubmit();
  
  const [step, setStep] = useState(1);
  const [programName, setProgramName] = useState(`${shopData.name} Rewards`);
  const [programDescription, setProgramDescription] = useState("Earn points on every purchase and redeem them for rewards.");
  const [pointsTerminology, setPointsTerminology] = useState("Points");
  const [pointsPerDollar, setPointsPerDollar] = useState("10");
  const [autoEnrollCustomers, setAutoEnrollCustomers] = useState(true);
  const [displayPointsInHeader, setDisplayPointsInHeader] = useState(true);
  const [displayPointsInCart, setDisplayPointsInCart] = useState(true);
  
  const totalSteps = 3;
  const progress = (step / totalSteps) * 100;
  
  const handleNext = () => {
    if (step < totalSteps) {
      setStep(step + 1);
    } else {
      // Submit the form
      const formData = new FormData();
      formData.append("step", "complete");
      formData.append("programName", programName);
      formData.append("programDescription", programDescription);
      formData.append("pointsTerminology", pointsTerminology);
      formData.append("pointsPerDollar", pointsPerDollar);
      formData.append("autoEnrollCustomers", autoEnrollCustomers.toString());
      formData.append("displayPointsInHeader", displayPointsInHeader.toString());
      formData.append("displayPointsInCart", displayPointsInCart.toString());
      
      submit(formData, { method: "post" });
    }
  };
  
  const handleBack = () => {
    if (step > 1) {
      setStep(step - 1);
    }
  };
  
  return (
    <Page>
      <TitleBar title="Set Up Your Loyalty Program" />
      <BlockStack gap="500">
        <Layout>
          <Layout.Section>
            <Card>
              <BlockStack gap="400">
                <Text as="h2" variant="headingMd">
                  {step === 1 && "Program Details"}
                  {step === 2 && "Points & Rewards"}
                  {step === 3 && "Customer Experience"}
                </Text>
                <Box paddingBlockEnd="400">
                  <ProgressBar progress={progress} size="small" />
                </Box>
                
                {actionData?.error && (
                  <Banner title="Error" status="critical">
                    <p>{actionData.error}</p>
                  </Banner>
                )}
                
                {step === 1 && (
                  <FormLayout>
                    <TextField
                      label="Program Name"
                      value={programName}
                      onChange={setProgramName}
                      autoComplete="off"
                      helpText="This is how your loyalty program will be displayed to customers."
                    />
                    <TextField
                      label="Program Description"
                      value={programDescription}
                      onChange={setProgramDescription}
                      multiline={3}
                      autoComplete="off"
                      helpText="Briefly describe your loyalty program to your customers."
                    />
                  </FormLayout>
                )}
                
                {step === 2 && (
                  <FormLayout>
                    <TextField
                      label="Points Terminology"
                      value={pointsTerminology}
                      onChange={setPointsTerminology}
                      autoComplete="off"
                      helpText="What do you want to call your points? (e.g., Points, Stars, Coins)"
                    />
                    <TextField
                      label={`${pointsTerminology} Per Dollar Spent`}
                      value={pointsPerDollar}
                      onChange={setPointsPerDollar}
                      type="number"
                      autoComplete="off"
                      helpText={`How many ${pointsTerminology.toLowerCase()} customers earn for each dollar spent.`}
                    />
                  </FormLayout>
                )}
                
                {step === 3 && (
                  <FormLayout>
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
                  </FormLayout>
                )}
                
                <Divider />
                
                <InlineStack align="end">
                  {step > 1 && (
                    <Button onClick={handleBack}>
                      Back
                    </Button>
                  )}
                  <Button primary onClick={handleNext}>
                    {step < totalSteps ? "Next" : "Complete Setup"}
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
                    Setup Guide
                  </Text>
                  <Text as="p" variant="bodyMd">
                    {step === 1 && "Start by giving your loyalty program a name and description that resonates with your brand and customers."}
                    {step === 2 && "Configure how customers earn points and what rewards they can redeem them for."}
                    {step === 3 && "Customize how customers interact with your loyalty program in your store."}
                  </Text>
                </BlockStack>
              </Card>
              <Card>
                <BlockStack gap="200">
                  <Text as="h2" variant="headingMd">
                    Store Information
                  </Text>
                  <BlockStack gap="200">
                    <InlineStack align="space-between">
                      <Text as="span" variant="bodyMd">
                        Store Name
                      </Text>
                      <Text as="span" variant="bodyMd">
                        {shopData.name}
                      </Text>
                    </InlineStack>
                    <InlineStack align="space-between">
                      <Text as="span" variant="bodyMd">
                        Currency
                      </Text>
                      <Text as="span" variant="bodyMd">
                        {shopData.currencyCode}
                      </Text>
                    </InlineStack>
                    <InlineStack align="space-between">
                      <Text as="span" variant="bodyMd">
                        Timezone
                      </Text>
                      <Text as="span" variant="bodyMd">
                        {shopData.timezoneAbbreviation}
                      </Text>
                    </InlineStack>
                  </BlockStack>
                </BlockStack>
              </Card>
            </BlockStack>
          </Layout.Section>
        </Layout>
      </BlockStack>
    </Page>
  );
}
