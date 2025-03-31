import { env } from '../../config/env.js';
import { CloudflareProvider } from './cloudflare.js';
import { DNSProvider } from './types.js';

export class DNSProviderFactory {
  static createProvider(): DNSProvider {
    switch (env.DNS_PROVIDER) {
      case 'cloudflare':
        return new CloudflareProvider();
      // Add other providers here as needed
      default:
        throw new Error(`Unsupported DNS provider: ${env.DNS_PROVIDER}`);
    }
  }
} 