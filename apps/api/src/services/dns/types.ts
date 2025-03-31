export interface DNSProvider {
  createSubdomain(subdomain: string): Promise<void>;
  deleteSubdomain(subdomain: string): Promise<void>;
  validateDNSRecord(subdomain: string): Promise<boolean>;
} 