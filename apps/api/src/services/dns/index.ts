import { env } from '../../config/env.js';
import { CloudflareProvider } from './cloudflare.js';
import { MockDNSProvider } from './mock.js';
import { DNSProvider } from './types.js';

export class DNSProviderFactory {
  static createProvider(): DNSProvider {
    try {
      // If DNS_PROVIDER is not set or is 'none', use the mock provider
      if (!env.DNS_PROVIDER || env.DNS_PROVIDER === 'none') {
        console.log('No DNS provider configured, using mock provider');
        return new MockDNSProvider();
      }

      switch (env.DNS_PROVIDER) {
        case 'cloudflare':
          try {
            return new CloudflareProvider();
          } catch (error) {
            console.warn('Failed to initialize Cloudflare provider:', error.message);
            console.log('Falling back to mock DNS provider');
            return new MockDNSProvider();
          }
        // Add other providers here as needed
        default:
          console.warn(`Unsupported DNS provider: ${env.DNS_PROVIDER}, using mock provider`);
          return new MockDNSProvider();
      }
    } catch (error) {
      console.warn('Error creating DNS provider:', error.message);
      console.log('Falling back to mock DNS provider');
      return new MockDNSProvider();
    }
  }
}