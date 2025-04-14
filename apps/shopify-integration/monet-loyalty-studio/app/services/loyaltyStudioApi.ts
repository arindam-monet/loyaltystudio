import axios, { AxiosInstance } from "axios";

export class LoyaltyStudioApiClient {
  private client: AxiosInstance;

  constructor(apiKey: string, merchantId: string) {
    this.client = axios.create({
      baseURL: process.env.LOYALTY_STUDIO_API_URL,
      headers: {
        "X-API-Key": apiKey,
        "X-Merchant-ID": merchantId,
        "Content-Type": "application/json",
      },
    });
  }

  async createMerchant(shopData: any) {
    return this.client.post("/merchants", {
      name: shopData.name,
      email: shopData.email,
      domain: shopData.domain,
      platform: "shopify",
      platformId: shopData.id,
      // Additional merchant data
    });
  }

  async syncCustomer(customerData: any) {
    return this.client.post("/program-members", {
      externalId: customerData.id,
      email: customerData.email,
      firstName: customerData.firstName,
      lastName: customerData.lastName,
      // Additional customer data
    });
  }

  async processOrder(orderData: any) {
    return this.client.post("/transactions", {
      externalId: orderData.id,
      customerId: orderData.customer?.id,
      amount: orderData.totalPrice,
      currency: orderData.currency,
      items: orderData.lineItems?.map((item: any) => ({
        productId: item.productId,
        variantId: item.variantId,
        quantity: item.quantity,
        price: item.price,
      })),
      // Additional order data
    });
  }

  async getLoyaltyPrograms() {
    return this.client.get("/loyalty-programs");
  }

  async getRewards() {
    return this.client.get("/rewards");
  }

  async getPointsBalance(customerId: string) {
    return this.client.get(`/program-members/${customerId}/points-balance`);
  }

  async redeemReward(customerId: string, rewardId: string) {
    return this.client.post(`/program-members/${customerId}/redeem`, {
      rewardId,
    });
  }

  async getPointsHistory(customerId: string) {
    return this.client.get(`/program-members/${customerId}/transactions`);
  }
}

export default LoyaltyStudioApiClient;
