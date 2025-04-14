# LoyaltyStudio Shopify Integration

This is the Shopify integration for LoyaltyStudio, allowing Shopify merchants to implement and manage loyalty programs directly within their Shopify admin interface.

## Features

- Seamless integration with Shopify admin
- Real-time data synchronization
- Theme App Extensions for storefront integration
- Webhook processing for orders and customers
- Loyalty program management
- Rewards and points management

## Tech Stack

- Remix.js for the Shopify app
- Shopify Polaris for UI components
- Prisma for database access
- Shopify App Bridge for admin integration
- Theme App Extensions for storefront integration

## Getting Started

### Prerequisites

- Node.js 18.x or higher
- pnpm
- Shopify Partner account
- Shopify development store

### Installation

1. Clone the repository
2. Run the setup script:

```bash
./scripts/setup-shopify-app.sh
```

3. Configure your Shopify app in the Shopify Partner Dashboard
4. Update the `.env` file with your Shopify API credentials

### Development

To start the development server:

```bash
cd monet-loyalty-studio
pnpm dev
```

### Deployment

To deploy the app to Shopify:

```bash
cd monet-loyalty-studio
pnpm deploy
```

## Architecture

The Shopify integration follows a microservice architecture:

1. **Shopify Embedded App**: A Remix.js app embedded in the Shopify admin
2. **LoyaltyStudio API**: The main API for loyalty program management
3. **Theme App Extensions**: Shopify theme extensions for storefront integration
4. **Webhooks**: Real-time data synchronization between Shopify and LoyaltyStudio

## Database Schema

The Shopify integration uses its own database with the following tables:

- `Session`: Shopify session data
- `MerchantMapping`: Mapping between Shopify merchants and LoyaltyStudio merchants
- `WebhookSubscription`: Registered webhooks for each merchant
- `ShopifySettings`: Merchant-specific settings for the Shopify integration

## API Integration

The Shopify app communicates with the LoyaltyStudio API using the `LoyaltyStudioApiClient`. This client handles authentication and API requests to the main LoyaltyStudio system.

## Webhooks

The integration uses Shopify webhooks to receive real-time updates for:

- Orders (create, update, cancel)
- Customers (create, update)
- App uninstallation

## Theme App Extensions

The Theme App Extensions provide customer-facing loyalty program features:

- Points balance display
- Rewards catalog
- Checkout integration

## License

This project is licensed under the MIT License - see the LICENSE file for details.
