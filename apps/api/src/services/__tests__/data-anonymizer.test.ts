import { describe, it, expect, beforeEach } from 'vitest';
import { DataAnonymizerService } from '../data-anonymizer.js';

describe('DataAnonymizerService', () => {
  let anonymizer: DataAnonymizerService;

  beforeEach(() => {
    anonymizer = new DataAnonymizerService();
  });

  describe('anonymizeMerchant', () => {
    it('should anonymize merchant data while preserving non-sensitive fields', () => {
      const merchant = {
        id: 'merchant-123',
        name: 'Acme Coffee Shop',
        email: 'contact@acmecoffee.com',
        website: 'https://acmecoffee.com',
        phone: '+1-555-123-4567',
        address: '123 Main St',
        city: 'San Francisco',
        state: 'CA',
        zipCode: '94105',
        country: 'United States',
        industry: 'Food & Beverage',
        currency: 'USD',
        timezone: 'America/Los_Angeles',
        metadata: {
          businessType: 'Small Business'
        }
      };

      const anonymized = anonymizer.anonymizeMerchant(merchant);

      // Verify sensitive fields are anonymized
      expect(anonymized.name).not.toBe(merchant.name);
      expect(anonymized.email).not.toBe(merchant.email);
      expect(anonymized.website).not.toBe(merchant.website);
      expect(anonymized.phone).not.toBe(merchant.phone);
      expect(anonymized.address).not.toBe(merchant.address);
      expect(anonymized.city).not.toBe(merchant.city);
      expect(anonymized.state).not.toBe(merchant.state);
      expect(anonymized.zipCode).not.toBe(merchant.zipCode);

      // Verify non-sensitive fields are preserved
      expect(anonymized.id).toBe(merchant.id);
      expect(anonymized.country).toBe(merchant.country);
      expect(anonymized.industry).toBe(merchant.industry);
      expect(anonymized.currency).toBe(merchant.currency);
      expect(anonymized.timezone).toBe(merchant.timezone);
      expect(anonymized.metadata).toEqual(merchant.metadata);
    });

    it('should handle missing fields gracefully', () => {
      const merchant = {
        id: 'merchant-123',
        name: 'Acme Coffee Shop',
        country: 'United States',
        industry: 'Food & Beverage',
        currency: 'USD',
        timezone: 'America/Los_Angeles'
      };

      const anonymized = anonymizer.anonymizeMerchant(merchant);

      // Verify the function doesn't crash with missing fields
      expect(anonymized.name).not.toBe(merchant.name);
      expect(anonymized.country).toBe(merchant.country);
    });
  });

  describe('deAnonymizeText', () => {
    it('should replace anonymized values with original values in text', () => {
      const merchant = {
        name: 'Acme Coffee Shop',
        email: 'contact@acmecoffee.com'
      };

      // First anonymize to populate the internal maps
      const anonymized = anonymizer.anonymizeMerchant(merchant);

      // Create a text that contains the anonymized values
      const text = `Welcome to ${anonymized.name}! Contact us at ${anonymized.email} for more information.`;

      // De-anonymize the text
      const deAnonymized = anonymizer.deAnonymizeText(text);

      // Verify the original values are restored
      expect(deAnonymized).toContain(merchant.name);
      expect(deAnonymized).toContain(merchant.email);
      expect(deAnonymized).not.toContain(anonymized.name);
      expect(deAnonymized).not.toContain(anonymized.email);
    });

    it('should handle text with no anonymized values', () => {
      const text = 'This text contains no anonymized values.';
      const deAnonymized = anonymizer.deAnonymizeText(text);
      expect(deAnonymized).toBe(text);
    });
  });
});
