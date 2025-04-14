import type { HeadersFunction, LoaderFunctionArgs } from "@remix-run/node";
import { json } from "@remix-run/node";
import { Link, Outlet, useLoaderData, useRouteError } from "@remix-run/react";
import { boundary } from "@shopify/shopify-app-remix/server";
import { AppProvider } from "@shopify/shopify-app-remix/react";
import { NavMenu } from "@shopify/app-bridge-react";
import polarisStyles from "@shopify/polaris/build/esm/styles.css?url";

import { authenticate } from "../shopify.server";
import { getMerchantByShop } from "../models/merchant.server";

export const links = () => [{ rel: "stylesheet", href: polarisStyles }];

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const { session } = await authenticate.admin(request);

  // Check if merchant exists in our database
  const merchant = await getMerchantByShop(session.shop);

  return json({
    apiKey: process.env.SHOPIFY_API_KEY || "",
    merchant,
  });
};

export default function App() {
  const { apiKey, merchant } = useLoaderData<typeof loader>();

  return (
    <AppProvider isEmbeddedApp apiKey={apiKey}>
      <NavMenu>
        <Link to="/app" rel="home">
          Dashboard
        </Link>

        {merchant && (
          <>
            <Link to="/app/program/members">Members</Link>
            <Link to="/app/program/rewards">Rewards</Link>
            <Link to="/app/program/rules">Rules</Link>
            <Link to="/app/program/campaigns">Campaigns</Link>
            <Link to="/app/analytics">Analytics</Link>
            <Link to="/app/storefront">Storefront</Link>
            <Link to="/app/webhooks">Webhooks</Link>
            <Link to="/app/program/settings">Settings</Link>
          </>
        )}
      </NavMenu>
      <Outlet />
    </AppProvider>
  );
}

// Shopify needs Remix to catch some thrown responses, so that their headers are included in the response.
export function ErrorBoundary() {
  return boundary.error(useRouteError());
}

export const headers: HeadersFunction = (headersArgs) => {
  return boundary.headers(headersArgs);
};
