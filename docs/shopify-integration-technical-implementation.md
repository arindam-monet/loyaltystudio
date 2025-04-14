# Shopify Integration Technical Implementation

## 1. Introduction

This document outlines the technical implementation details for integrating LoyaltyStudio with Shopify. The integration will enable Shopify merchants to seamlessly implement and manage loyalty programs directly within their Shopify admin interface while leveraging the full power of LoyaltyStudio's loyalty engine.

### 1.1 Scope

The integration includes:
- A Remix-based Shopify embedded app
- Backend API integration with LoyaltyStudio
- Shopify webhook processing
- Theme App Extensions for storefront integration
- Data synchronization between Shopify and LoyaltyStudio

### 1.2 Key Technical Objectives

- Create a seamless embedded experience within Shopify Admin
- Implement real-time data synchronization
- Provide a native-feeling UI using Shopify Polaris
- Enable quick setup with AI-powered program generation
- Support storefront integration through Theme App Extensions

## 2. Architecture Overview

### 2.1 High-Level Architecture

```
┌─────────────────┐      ┌─────────────────┐      ┌─────────────────┐
│                 │      │                 │      │                 │
│  Shopify Store  │◄────►│  Shopify App    │◄────►│  LoyaltyStudio  │
│  (Merchant)     │      │  (Remix)        │      │  API (Fastify)  │
│                 │      │                 │      │                 │
└─────────────────┘      └─────────────────┘      └─────────────────┘
        │                                                  │
        │                                                  │
        ▼                                                  ▼
┌─────────────────┐                              ┌─────────────────┐
│                 │                              │                 │
│  Storefront     │                              │  Merchant Web   │
│  Integration    │                              │  (Advanced)     │
│                 │                              │                 │
└─────────────────┘                              └─────────────────┘
```

### 2.2 Component Breakdown

1. **Shopify Embedded App (Remix)**
   - Handles authentication via Shopify OAuth
   - Provides UI for loyalty program management
   - Communicates with LoyaltyStudio API
   - Manages app lifecycle events

2. **LoyaltyStudio API Integration**
   - Exposes endpoints for the Shopify app
   - Processes data from Shopify
   - Manages loyalty program logic
   - Handles tenant isolation

3. **Webhook Processing**
   - Receives and processes Shopify webhooks
   - Updates loyalty data based on store events
   - Ensures data consistency

4. **Theme App Extensions**
   - Provides customer-facing loyalty components
   - Integrates with Shopify storefront
   - Displays points, rewards, and program information

### 2.3 Data Flow

1. **Installation & Authentication**
   - Merchant installs app from Shopify App Store
   - OAuth flow establishes API access
   - Merchant account created/mapped in LoyaltyStudio
   - Initial data sync performed

2. **Ongoing Operations**
   - Webhooks notify of store events (orders, customers)
   - App UI allows program management
   - Theme extensions display loyalty info to customers
   - API calls synchronize data between systems

## 3. Technical Components

### 3.1 Shopify Embedded App

#### 3.1.1 App Setup

```javascript
// app/shopify.server.js
import { shopifyApp } from "@shopify/shopify-app-remix";
import { restResources } from "@shopify/shopify-api/rest/admin/2023-10";

export const shopify = shopifyApp({
  apiKey: process.env.SHOPIFY_API_KEY,
  apiSecretKey: process.env.SHOPIFY_API_SECRET,
  scopes: [
    "read_products",
    "write_products",
    "read_orders",
    "read_customers",
    "write_customers",
    "read_discounts",
    "write_discounts",
    "read_themes",
    "write_themes"
  ],
  appUrl: process.env.SHOPIFY_APP_URL,
  restResources,
});
```

#### 3.1.2 Authentication Flow

1. **OAuth Initialization**
   - Redirect to Shopify OAuth endpoint
   - Request required scopes
   - Receive authorization code

2. **Token Exchange**
   - Exchange code for access token
   - Store token securely
   - Set up session management

3. **Session Management**
   - Use Shopify App Bridge for session handling
   - Implement token refresh mechanism
   - Handle session expiration

#### 3.1.3 App Bridge Integration

```javascript
// app/routes/app._index.jsx
import { useAppBridge } from "@shopify/app-bridge-react";
import { Redirect } from "@shopify/app-bridge/actions";

export default function Index() {
  const app = useAppBridge();
  const redirect = Redirect.create(app);
  
  const navigateToProducts = () => {
    redirect.dispatch(Redirect.Action.ADMIN_PATH, {
      path: "/products",
    });
  };
  
  // Component implementation
}
```

#### 3.1.4 UI Framework

- Use Shopify Polaris for admin UI components
- Implement responsive layouts
- Follow Shopify design patterns
- Supplement with shadcn/ui where needed

```javascript
// app/routes/app.program.jsx
import {
  Page,
  Layout,
  Card,
  ResourceList,
  TextStyle,
  Button,
} from "@shopify/polaris";

export default function ProgramManagement() {
  return (
    <Page title="Loyalty Program">
      <Layout>
        <Layout.Section>
          <Card title="Program Overview">
            {/* Program overview content */}
          </Card>
        </Layout.Section>
        <Layout.Section secondary>
          <Card title="Quick Actions">
            {/* Action buttons */}
          </Card>
        </Layout.Section>
      </Layout>
    </Page>
  );
}
```

### 3.2 Backend API Integration

#### 3.2.1 API Client

```javascript
// app/services/loyaltyStudioApi.js
import axios from "axios";

export class LoyaltyStudioApiClient {
  constructor(apiKey, merchantId) {
    this.client = axios.create({
      baseURL: process.env.LOYALTY_STUDIO_API_URL,
      headers: {
        "X-API-Key": apiKey,
        "X-Merchant-ID": merchantId,
        "Content-Type": "application/json",
      },
    });
  }

  async createMerchant(shopData) {
    return this.client.post("/merchants", {
      name: shopData.name,
      email: shopData.email,
      domain: shopData.domain,
      platform: "shopify",
      platformId: shopData.id,
      // Additional merchant data
    });
  }

  async syncCustomer(customerData) {
    return this.client.post("/program-members", {
      externalId: customerData.id,
      email: customerData.email,
      firstName: customerData.firstName,
      lastName: customerData.lastName,
      // Additional customer data
    });
  }

  async processOrder(orderData) {
    return this.client.post("/transactions", {
      externalId: orderData.id,
      customerId: orderData.customer.id,
      amount: orderData.totalPrice,
      currency: orderData.currency,
      items: orderData.lineItems.map(item => ({
        productId: item.productId,
        variantId: item.variantId,
        quantity: item.quantity,
        price: item.price,
      })),
      // Additional order data
    });
  }

  // Additional API methods
}
```

#### 3.2.2 Merchant Mapping

- Create/map Shopify merchants to LoyaltyStudio accounts
- Store Shopify-specific configuration
- Handle multi-store merchants
- Implement proper tenant isolation

```javascript
// app/models/merchant.server.js
import { prisma } from "../db.server";

export async function createMerchantMapping(session, shopData, loyaltyStudioMerchantId) {
  return prisma.merchantMapping.create({
    data: {
      shopifyShopId: shopData.id,
      shopifyDomain: session.shop,
      loyaltyStudioMerchantId,
      accessToken: session.accessToken,
      scopes: session.scope,
    },
  });
}

export async function getMerchantByShop(shop) {
  return prisma.merchantMapping.findUnique({
    where: {
      shopifyDomain: shop,
    },
  });
}
```

### 3.3 Webhook Processing

#### 3.3.1 Webhook Registration

```javascript
// app/routes/webhooks.jsx
import { authenticate } from "../shopify.server";
import { registerWebhooks } from "../models/webhook.server";

export const action = async ({ request }) => {
  const { admin } = await authenticate.admin(request);
  
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
  
  return null;
};
```

#### 3.3.2 Webhook Processing

```javascript
// app/routes/webhooks.orders.create.jsx
import { LoyaltyStudioApiClient } from "../services/loyaltyStudioApi";
import { getMerchantByShop } from "../models/merchant.server";

export const action = async ({ request }) => {
  // Verify webhook signature
  const hmacHeader = request.headers.get("X-Shopify-Hmac-Sha256");
  const rawBody = await request.text();
  
  if (!verifyWebhookSignature(rawBody, hmacHeader)) {
    return new Response("Invalid webhook signature", { status: 401 });
  }
  
  const payload = JSON.parse(rawBody);
  const shop = request.headers.get("X-Shopify-Shop-Domain");
  
  try {
    // Get merchant mapping
    const merchantMapping = await getMerchantByShop(shop);
    if (!merchantMapping) {
      return new Response("Merchant not found", { status: 404 });
    }
    
    // Process order in LoyaltyStudio
    const apiClient = new LoyaltyStudioApiClient(
      merchantMapping.apiKey,
      merchantMapping.loyaltyStudioMerchantId
    );
    
    await apiClient.processOrder(payload);
    
    return new Response("Webhook processed", { status: 200 });
  } catch (error) {
    console.error("Webhook processing error:", error);
    return new Response("Webhook processing failed", { status: 500 });
  }
};

function verifyWebhookSignature(body, hmac) {
  // Implement HMAC verification logic
  // ...
}
```

#### 3.3.3 Webhook Topics

| Topic | Purpose | Processing Logic |
|-------|---------|------------------|
| `orders/create` | Process new orders for points accrual | Award points based on order value and rules |
| `orders/updated` | Update points for modified orders | Adjust points if order value changes |
| `orders/cancelled` | Reverse points for cancelled orders | Remove points awarded for cancelled orders |
| `orders/fulfilled` | Award points on fulfillment (if configured) | Award points when items are shipped |
| `customers/create` | Create program member for new customers | Create loyalty profile for new customers |
| `customers/update` | Update program member details | Keep loyalty profile in sync with customer data |
| `app/uninstalled` | Clean up when app is uninstalled | Handle data cleanup and deactivation |

### 3.4 Theme App Extensions

#### 3.4.1 Extension Configuration

```json
// shopify.theme.extension.toml
name = "LoyaltyStudio"
type = "theme"

[settings]
  [[settings.fields]]
    key = "points_display_enabled"
    type = "boolean"
    label = "Enable Points Display"
    default = true
  
  [[settings.fields]]
    key = "rewards_catalog_enabled"
    type = "boolean"
    label = "Enable Rewards Catalog"
    default = true
  
  [[settings.fields]]
    key = "points_terminology"
    type = "text"
    label = "Points Terminology"
    default = "Points"
```

#### 3.4.2 Theme Blocks

```liquid
{% comment %} blocks/points-balance.liquid {% endcomment %}
{% if block.settings.points_display_enabled %}
  <div class="loyalty-studio-points-balance">
    <h3>{{ block.settings.points_terminology }} Balance</h3>
    <div class="points-value" data-loyalty-studio-points-balance>
      {% if customer %}
        <div class="loading-indicator">Loading...</div>
      {% else %}
        <p>Sign in to view your {{ block.settings.points_terminology }} balance</p>
      {% endif %}
    </div>
  </div>
{% endif %}

<script>
  document.addEventListener('DOMContentLoaded', function() {
    if (document.querySelector('[data-loyalty-studio-points-balance]') && window.customer) {
      fetch('/apps/loyalty-studio/api/points-balance', {
        headers: {
          'Accept': 'application/json',
        },
      })
      .then(response => response.json())
      .then(data => {
        const balanceElement = document.querySelector('[data-loyalty-studio-points-balance]');
        balanceElement.innerHTML = `<p class="points-value">${data.balance} ${block.settings.points_terminology}</p>`;
      })
      .catch(error => {
        console.error('Error fetching points balance:', error);
      });
    }
  });
</script>
```

#### 3.4.3 JavaScript Integration

```javascript
// assets/loyalty-studio.js
class LoyaltyStudio {
  constructor() {
    this.apiBase = '/apps/loyalty-studio/api';
    this.init();
  }
  
  init() {
    this.initPointsDisplay();
    this.initRewardsCatalog();
    this.initCheckoutIntegration();
  }
  
  initPointsDisplay() {
    const pointsElements = document.querySelectorAll('[data-loyalty-studio-points]');
    if (pointsElements.length && window.customer) {
      this.fetchPointsBalance().then(balance => {
        pointsElements.forEach(el => {
          el.textContent = balance;
        });
      });
    }
  }
  
  async fetchPointsBalance() {
    try {
      const response = await fetch(`${this.apiBase}/points-balance`);
      const data = await response.json();
      return data.balance;
    } catch (error) {
      console.error('Error fetching points balance:', error);
      return 0;
    }
  }
  
  // Additional methods for rewards catalog, checkout integration, etc.
}

// Initialize on DOM ready
document.addEventListener('DOMContentLoaded', () => {
  window.loyaltyStudio = new LoyaltyStudio();
});
```

## 4. Data Models

### 4.1 Merchant Mapping

```prisma
// prisma/schema.prisma
model MerchantMapping {
  id                     String   @id @default(uuid())
  shopifyShopId          String   @unique
  shopifyDomain          String   @unique
  loyaltyStudioMerchantId String
  accessToken            String
  scopes                 String
  isActive               Boolean  @default(true)
  createdAt              DateTime @default(now())
  updatedAt              DateTime @updatedAt
  
  // Relations
  webhooks               WebhookSubscription[]
  settings               ShopifySettings?
}
```

### 4.2 Webhook Subscriptions

```prisma
// prisma/schema.prisma
model WebhookSubscription {
  id               String   @id @default(uuid())
  merchantMappingId String
  topic            String
  address          String
  createdAt        DateTime @default(now())
  updatedAt        DateTime @updatedAt
  
  // Relations
  merchantMapping  MerchantMapping @relation(fields: [merchantMappingId], references: [id])
  
  @@unique([merchantMappingId, topic])
}
```

### 4.3 Shopify Settings

```prisma
// prisma/schema.prisma
model ShopifySettings {
  id                     String   @id @default(uuid())
  merchantMappingId      String   @unique
  pointsTerminology      String   @default("Points")
  autoEnrollCustomers    Boolean  @default(true)
  displayPointsInHeader  Boolean  @default(true)
  displayPointsInCart    Boolean  @default(true)
  themeExtensionEnabled  Boolean  @default(true)
  createdAt              DateTime @default(now())
  updatedAt              DateTime @updatedAt
  
  // Relations
  merchantMapping        MerchantMapping @relation(fields: [merchantMappingId], references: [id])
}
```

## 5. API Endpoints

### 5.1 Shopify App API Endpoints

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/points-balance` | GET | Get customer points balance |
| `/api/rewards` | GET | Get available rewards |
| `/api/redeem` | POST | Redeem points for a reward |
| `/api/history` | GET | Get points transaction history |
| `/api/enroll` | POST | Enroll customer in loyalty program |

### 5.2 LoyaltyStudio API Integration

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/merchants` | POST | Create/update merchant |
| `/program-members` | POST | Create/update program member |
| `/transactions` | POST | Process order/transaction |
| `/rewards` | GET/POST | Manage rewards |
| `/rules` | GET/POST | Manage earning rules |

## 6. Implementation Phases

### 6.1 Phase 1: Core Integration (4-6 weeks)

#### Week 1: Project Setup
- Set up Remix app using Shopify CLI
- Configure repository structure
- Set up CI/CD pipeline
- Implement basic app structure

#### Week 2: Authentication
- Implement OAuth flow
- Set up session management
- Create merchant mapping logic
- Implement API key generation

#### Week 3: Basic UI
- Implement program dashboard
- Create setup wizard
- Set up core navigation
- Implement Polaris components

#### Week 4: Webhook Integration
- Implement webhook registration
- Create webhook processing logic
- Set up order processing
- Implement customer synchronization

#### Week 5-6: Testing & Refinement
- Fix bugs
- Optimize performance
- Conduct initial merchant testing
- Refine user experience

### 6.2 Phase 2: Enhanced Features (4-6 weeks)

#### Week 7-8: Program Management
- Implement rules builder
- Create rewards management
- Set up campaign creation
- Implement program settings

#### Week 9-10: Storefront Integration
- Create Theme App Extensions
- Implement Liquid snippets
- Set up customer portal
- Integrate with checkout

#### Week 11-12: Advanced Features
- Implement reporting
- Create analytics dashboard
- Set up advanced configuration
- Implement API management

### 6.3 Phase 3: Optimization & Launch (2-4 weeks)

#### Week 13: Performance Optimization
- Improve load times
- Enhance API efficiency
- Implement caching strategy
- Optimize database queries

#### Week 14: Documentation
- Create merchant guides
- Document API endpoints
- Prepare support resources
- Create developer documentation

#### Week 15: App Store Submission
- Prepare app listing
- Create screenshots
- Develop promotional materials
- Submit for review

#### Week 16: Launch & Marketing
- Public release
- Launch marketing campaign
- Support merchant onboarding
- Monitor performance

## 7. Security Considerations

### 7.1 Authentication & Authorization

- Implement Shopify OAuth securely
- Use HTTPS for all communications
- Store access tokens securely
- Implement proper session management
- Use JWT for API authentication

### 7.2 Data Protection

- Encrypt sensitive data
- Implement proper tenant isolation
- Follow GDPR and privacy regulations
- Implement data retention policies
- Handle app uninstallation data cleanup

### 7.3 Webhook Security

- Verify webhook signatures
- Implement rate limiting
- Log webhook activities
- Handle webhook failures gracefully
- Implement retry mechanisms

## 8. Testing Strategy

### 8.1 Unit Testing

- Test individual components and functions
- Use Vitest for JavaScript/TypeScript testing
- Aim for >80% code coverage
- Automate tests in CI pipeline

```javascript
// tests/api-client.test.js
import { describe, it, expect, vi } from 'vitest';
import { LoyaltyStudioApiClient } from '../app/services/loyaltyStudioApi';

describe('LoyaltyStudioApiClient', () => {
  it('should create a merchant', async () => {
    // Mock axios
    const mockPost = vi.fn().mockResolvedValue({ data: { id: 'merchant-123' } });
    vi.mock('axios', () => ({
      create: () => ({
        post: mockPost,
      }),
    }));
    
    const client = new LoyaltyStudioApiClient('test-key', 'test-merchant');
    const result = await client.createMerchant({
      name: 'Test Shop',
      email: 'test@example.com',
      domain: 'test.myshopify.com',
      id: 'shop-123',
    });
    
    expect(mockPost).toHaveBeenCalledWith('/merchants', expect.objectContaining({
      name: 'Test Shop',
      email: 'test@example.com',
    }));
    expect(result.data.id).toBe('merchant-123');
  });
});
```

### 8.2 Integration Testing

- Test Shopify API integration
- Verify webhook processing
- Test data synchronization
- Validate authentication flows

### 8.3 End-to-End Testing

- Test complete merchant journeys
- Verify storefront integration
- Test reward redemption flow
- Validate points accrual from orders

### 8.4 Performance Testing

- Measure app load times
- Test webhook processing throughput
- Verify API response times
- Test with high-volume data scenarios

## 9. Deployment & CI/CD

### 9.1 CI/CD Pipeline

```yaml
# .github/workflows/ci.yml
name: CI/CD Pipeline

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main, develop]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
      - name: Install dependencies
        run: npm ci
      - name: Run tests
        run: npm test
  
  deploy-staging:
    needs: test
    if: github.ref == 'refs/heads/develop'
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
      - name: Install dependencies
        run: npm ci
      - name: Build
        run: npm run build
      - name: Deploy to staging
        run: npx shopify app deploy
        env:
          SHOPIFY_CLI_PARTNERS_TOKEN: ${{ secrets.SHOPIFY_CLI_PARTNERS_TOKEN }}
          SHOPIFY_CLI_STORE: ${{ secrets.SHOPIFY_STAGING_STORE }}
  
  deploy-production:
    needs: test
    if: github.ref == 'refs/heads/main'
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
      - name: Install dependencies
        run: npm ci
      - name: Build
        run: npm run build
      - name: Deploy to production
        run: npx shopify app deploy
        env:
          SHOPIFY_CLI_PARTNERS_TOKEN: ${{ secrets.SHOPIFY_CLI_PARTNERS_TOKEN }}
          SHOPIFY_CLI_STORE: ${{ secrets.SHOPIFY_PRODUCTION_STORE }}
```

### 9.2 Environment Configuration

```
# .env.example
# Shopify API
SHOPIFY_API_KEY=your_api_key
SHOPIFY_API_SECRET=your_api_secret
SHOPIFY_APP_URL=https://your-app-url.com

# LoyaltyStudio API
LOYALTY_STUDIO_API_URL=https://api.loyaltystudio.ai
LOYALTY_STUDIO_API_KEY=your_loyalty_studio_api_key

# Database
DATABASE_URL=postgresql://user:password@localhost:5432/shopify_app

# Session
SESSION_SECRET=your_session_secret
```

## 10. Monitoring & Maintenance

### 10.1 Logging Strategy

- Implement structured logging
- Log key events and errors
- Use log levels appropriately
- Implement request ID tracking
- Set up log aggregation

```javascript
// app/utils/logger.js
import winston from 'winston';

const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  defaultMeta: { service: 'shopify-app' },
  transports: [
    new winston.transports.Console(),
    // Add additional transports as needed
  ],
});

export default logger;
```

### 10.2 Error Tracking

- Implement error boundaries in UI
- Set up error monitoring service
- Track API failures
- Monitor webhook processing errors
- Set up alerts for critical issues

### 10.3 Performance Monitoring

- Track app load times
- Monitor API response times
- Measure webhook processing time
- Track database query performance
- Monitor resource utilization

## 11. Conclusion

This technical implementation document provides a comprehensive plan for building the LoyaltyStudio Shopify integration. By following this plan, we will create a seamless, high-performance integration that enables Shopify merchants to easily implement and manage loyalty programs.

The implementation will be carried out in three phases, starting with core integration, followed by enhanced features, and concluding with optimization and launch. Each phase has clear deliverables and timelines to ensure the project stays on track.

## 12. Appendix

### 12.1 Technology Stack

| Component | Technology |
|-----------|------------|
| Shopify App | Remix, TypeScript |
| UI Framework | Polaris, shadcn/ui |
| API Client | Axios |
| Database | PostgreSQL, Prisma |
| Authentication | Shopify OAuth, JWT |
| Testing | Vitest, Playwright |
| CI/CD | GitHub Actions |
| Logging | Winston |
| Monitoring | Datadog/New Relic |

### 12.2 Resources

- [Shopify App Development Documentation](https://shopify.dev/docs/apps)
- [Remix Documentation](https://remix.run/docs)
- [Shopify Polaris Design System](https://polaris.shopify.com/)
- [Shopify GraphQL Admin API](https://shopify.dev/api/admin-graphql)
- [Shopify Webhooks](https://shopify.dev/api/admin-rest/webhook)
- [Theme App Extensions](https://shopify.dev/docs/apps/build/online-store/theme-app-extensions)
