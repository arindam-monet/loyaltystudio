import { describe, it, expect, beforeEach, vi } from 'vitest';
import { AIProgramGeneratorService } from '../ai-program-generator.js';
import { DataAnonymizerService } from '../data-anonymizer.js';
import { prisma } from '../../db/index.js';

// Mock dependencies
vi.mock('../../db/index.js', () => ({
  prisma: {
    merchant: {
      findUnique: vi.fn(),
    },
  },
}));

vi.mock('@google/generative-ai', () => {
  return {
    GoogleGenerativeAI: vi.fn().mockImplementation(() => ({
      getGenerativeModel: vi.fn().mockImplementation(() => ({
        generateContent: vi.fn().mockResolvedValue({
          response: {
            text: vi.fn().mockReturnValue(`
              {
                "name": "Test Program",
                "description": "A test loyalty program",
                "settings": {
                  "pointsName": "Stars",
                  "currency": "USD",
                  "timezone": "UTC"
                },
                "rules": [
                  {
                    "name": "Base Points",
                    "description": "Earn points on every purchase",
                    "type": "FIXED",
                    "points": 1,
                    "conditions": {},
                    "minAmount": 0
                  }
                ]
              }
            `),
          },
        }),
      })),
    })),
  };
});

vi.mock('../data-anonymizer.js');

describe('AIProgramGeneratorService', () => {
  let service: AIProgramGeneratorService;
  let mockAnonymizer: any;

  beforeEach(() => {
    vi.resetAllMocks();

    // Setup mock for DataAnonymizerService
    mockAnonymizer = {
      anonymizeMerchant: vi.fn().mockImplementation(merchant => ({
        ...merchant,
        name: 'Anonymized Business',
        email: 'anonymous@example.com',
      })),
      deAnonymizeText: vi.fn().mockImplementation(text =>
        text.replace('Anonymized Business', 'Real Business')
      ),
      reset: vi.fn(),
    };

    // @ts-ignore - Mocking the constructor
    vi.mocked(DataAnonymizerService).mockImplementation(() => mockAnonymizer);

    service = new AIProgramGeneratorService();
  });

  describe('generateLoyaltyProgram', () => {
    it('should anonymize merchant data before sending to AI', async () => {
      // Mock merchant data
      const mockMerchant = {
        id: 'merchant-123',
        name: 'Real Business',
        email: 'contact@realbusiness.com',
        currency: 'USD',
        timezone: 'UTC',
      };

      // Mock prisma response
      vi.mocked(prisma.merchant.findUnique).mockResolvedValue(mockMerchant as any);

      // Call the method
      await service.generateLoyaltyProgram('merchant-123');

      // Verify anonymizer was called
      expect(mockAnonymizer.anonymizeMerchant).toHaveBeenCalledWith(mockMerchant);
    });

    it('should de-anonymize AI response', async () => {
      // Mock merchant data
      const mockMerchant = {
        id: 'merchant-123',
        name: 'Real Business',
        email: 'contact@realbusiness.com',
        currency: 'USD',
        timezone: 'UTC',
      };

      // Mock prisma response
      vi.mocked(prisma.merchant.findUnique).mockResolvedValue(mockMerchant as any);

      // Call the method
      await service.generateLoyaltyProgram('merchant-123');

      // Verify de-anonymizer was called
      expect(mockAnonymizer.deAnonymizeText).toHaveBeenCalled();
    });
  });
});
