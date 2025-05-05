import { DNSProvider } from './types.js';

export class MockDNSProvider implements DNSProvider {
  constructor() {
    console.log('Using Mock DNS Provider - DNS operations will be logged but not performed');
  }

  async createSubdomain(subdomain: string): Promise<void> {
    console.log(`[MOCK DNS] Would create subdomain: ${subdomain}`);
  }

  async deleteSubdomain(subdomain: string): Promise<void> {
    console.log(`[MOCK DNS] Would delete subdomain: ${subdomain}`);
  }

  async validateDNSRecord(subdomain: string): Promise<boolean> {
    console.log(`[MOCK DNS] Would validate DNS record for subdomain: ${subdomain}`);
    return true;
  }
}
