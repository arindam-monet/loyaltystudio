import { env } from '../../config/env.js';
import { DNSProvider } from './types.js';

interface CloudflareRecord {
  id?: string;
  type: string;
  name: string;
  content: string;
  proxied: boolean;
  ttl: number;
}

interface CloudflareResponse {
  success: boolean;
  errors: any[];
  result?: CloudflareRecord;
}

export class CloudflareProvider implements DNSProvider {
  private apiToken: string;
  private zoneId: string;
  private baseDomain: string;

  constructor() {
    if (!env.CLOUDFLARE_API_TOKEN || !env.CLOUDFLARE_ZONE_ID || !env.BASE_DOMAIN) {
      throw new Error('Cloudflare configuration is missing: CLOUDFLARE_API_TOKEN, CLOUDFLARE_ZONE_ID, and BASE_DOMAIN are required');
    }
    this.apiToken = env.CLOUDFLARE_API_TOKEN;
    this.zoneId = env.CLOUDFLARE_ZONE_ID;
    this.baseDomain = env.BASE_DOMAIN;
    console.log('Cloudflare DNS provider initialized successfully');
  }

  private async request(endpoint: string, options: RequestInit = {}): Promise<CloudflareResponse> {
    const url = `https://api.cloudflare.com/client/v4/zones/${this.zoneId}${endpoint}`;
    const response = await fetch(url, {
      ...options,
      headers: {
        'Authorization': `Bearer ${this.apiToken}`,
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });

    const data = await response.json();
    if (!data.success) {
      throw new Error(`Cloudflare API error: ${JSON.stringify(data.errors)}`);
    }
    return data;
  }

  async createSubdomain(subdomain: string): Promise<void> {
    const record: CloudflareRecord = {
      type: 'CNAME',
      name: `${subdomain}.${this.baseDomain}`,
      content: this.baseDomain,
      proxied: true,
      ttl: 1, // Auto TTL
    };

    try {
      await this.request('/dns_records', {
        method: 'POST',
        body: JSON.stringify(record),
      });
    } catch (error) {
      console.error('Failed to create DNS record:', error);
      throw error;
    }
  }

  async deleteSubdomain(subdomain: string): Promise<void> {
    try {
      // First, find the record
      const searchResponse = await this.request(`/dns_records?name=${subdomain}.${this.baseDomain}`);
      const record = searchResponse.result;

      if (record && record.id) {
        // Then delete it
        await this.request(`/dns_records/${record.id}`, {
          method: 'DELETE',
        });
      }
    } catch (error) {
      console.error('Failed to delete DNS record:', error);
      throw error;
    }
  }

  async validateDNSRecord(subdomain: string): Promise<boolean> {
    try {
      const response = await this.request(`/dns_records?name=${subdomain}.${this.baseDomain}`);
      return response.result !== null;
    } catch (error) {
      console.error('Failed to validate DNS record:', error);
      return false;
    }
  }
}