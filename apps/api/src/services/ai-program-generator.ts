import { GoogleGenerativeAI, GenerativeModel } from '@google/generative-ai';
import { env } from '../config/env.js';
import { prisma } from '../db/index.js';

// Define Merchant type
type Merchant = {
  id: string;
  name: string;
  metadata?: any;
  country?: string;
  currency: string;
  timezone: string;
};

interface GeneratedLoyaltyProgram {
  name: string;
  description: string;
  settings: {
    pointsName: string;
    currency: string;
    timezone: string;
  };
  rules: Array<{
    name: string;
    description: string;
    type: string;
    points: number;
    conditions: Record<string, any>;
    minAmount?: number;
    maxPoints?: number;
  }>;
  tiers?: Array<{
    name: string;
    description: string;
    pointsThreshold: number;
    benefits: Record<string, any>;
  }>;
  rewards?: Array<{
    name: string;
    description: string;
    type: string;
    pointsCost: number;
    validityPeriod?: number;
    redemptionLimit?: number;
  }>;
}

export class AIProgramGeneratorService {
  private genAI: GoogleGenerativeAI;
  private model: GenerativeModel;

  constructor() {
    this.genAI = new GoogleGenerativeAI(env.GEMINI_API_KEY);
    this.model = this.genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });
  }

  /**
   * Generate a loyalty program based on merchant details
   */
  async generateLoyaltyProgram(merchantId: string): Promise<GeneratedLoyaltyProgram> {
    // Get merchant details
    const merchant = await prisma.merchant.findUnique({
      where: { id: merchantId },
    });

    if (!merchant) {
      throw new Error('Merchant not found');
    }

    // Build prompt with merchant data
    const prompt = this.buildPrompt(merchant);

    try {
      // Generate content with Gemini
      const result = await this.model.generateContent(prompt);
      const response = result.response;
      const text = response.text();

      // Parse the response into a structured loyalty program
      return this.parseAIResponse(text, merchant);
    } catch (error) {
      console.error('Error generating loyalty program:', error);
      throw new Error('Failed to generate loyalty program');
    }
  }

  /**
   * Build a detailed prompt for Gemini based on merchant data
   */
  private buildPrompt(merchant: Merchant): string {
    return `
You are an expert loyalty program consultant. Create a complete loyalty program for a business with the following details:

Business Name: ${merchant.name}
Industry: ${merchant.metadata?.industry || 'Retail'}
Business Type: ${merchant.metadata?.businessType || 'Small Business'}
Country: ${merchant.country || 'United States'}
Currency: ${merchant.currency}
Timezone: ${merchant.timezone}

Create a comprehensive loyalty program that includes:

1. Program Name and Description:
   - Create a catchy, memorable name
   - Write a compelling description that explains the value proposition

2. Points Structure:
   - Define 2-4 ways customers can earn points
   - Include at least one rule for purchases (e.g., $1 = 1 point)
   - Consider adding bonus points for specific actions (referrals, birthdays, etc.)
   - Set appropriate point values based on the business type
   - IMPORTANT: Rule types must be one of: 'FIXED', 'PERCENTAGE', or 'DYNAMIC' only

3. Membership Tiers (if applicable):
   - Create 2-3 tiers with increasing benefits
   - Set appropriate point thresholds for each tier
   - Define specific benefits for each tier

4. Rewards:
   - Create 3-5 reward options that would appeal to this business's customers
   - Set appropriate point costs for each reward
   - Include a mix of discount-based and experience-based rewards
   - IMPORTANT: Reward types must be one of: 'PHYSICAL', 'DIGITAL', 'EXPERIENCE', or 'COUPON' only

5. Program Settings:
   - Suggest a name for points (e.g., "Stars", "Coins", etc.)
   - Use the business's actual currency and timezone

Format your response as a JSON object with the following structure:
{
  "name": "Program Name",
  "description": "Program description...",
  "settings": {
    "pointsName": "Points",
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
    },
    {
      "name": "Birthday Bonus",
      "description": "Earn bonus points on your birthday",
      "type": "DYNAMIC",
      "points": 100,
      "conditions": {"eventType": "BIRTHDAY"}
    }
  ],
  "tiers": [
    {
      "name": "Silver",
      "description": "Entry level tier",
      "pointsThreshold": 0,
      "benefits": {
        "pointsMultiplier": 1
      }
    }
  ],
  "rewards": [
    {
      "name": "5% Discount",
      "description": "Get 5% off your next purchase",
      "type": "COUPON",
      "pointsCost": 100,
      "validityPeriod": 30
    },
    {
      "name": "Free Product",
      "description": "Get a free product of your choice",
      "type": "PHYSICAL",
      "pointsCost": 500
    },
    {
      "name": "VIP Experience",
      "description": "Exclusive VIP experience",
      "type": "EXPERIENCE",
      "pointsCost": 1000
    }
  ]
}

Make sure all values are appropriate for the business type and industry. Be creative but realistic.
`;
  }

  /**
   * Parse the AI response into a structured loyalty program
   */
  private parseAIResponse(text: string, merchant: Merchant): GeneratedLoyaltyProgram {
    try {
      // Extract JSON from the response
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('No valid JSON found in the response');
      }

      const jsonStr = jsonMatch[0];
      const program = JSON.parse(jsonStr) as GeneratedLoyaltyProgram;

      // Validate and set defaults for required fields
      return {
        name: program.name || `${merchant.name} Rewards`,
        description: program.description || 'Earn points and redeem rewards',
        settings: {
          pointsName: program.settings?.pointsName || 'points',
          currency: program.settings?.currency || merchant.currency,
          timezone: program.settings?.timezone || merchant.timezone,
        },
        rules: program.rules?.length ? program.rules : [
          {
            name: 'Base Points',
            description: 'Earn points on every purchase',
            type: 'FIXED',
            points: 1,
            conditions: {},
            minAmount: 0,
          }
        ],
        tiers: program.tiers || [],
        rewards: program.rewards || [],
      };
    } catch (error) {
      console.error('Error parsing AI response:', error);

      // Return a default program if parsing fails
      return this.createDefaultProgram(merchant);
    }
  }

  /**
   * Create a default program if AI generation fails
   */
  private createDefaultProgram(merchant: Merchant): GeneratedLoyaltyProgram {
    return {
      name: `${merchant.name} Rewards`,
      description: 'Earn points on purchases and redeem them for rewards.',
      settings: {
        pointsName: 'points',
        currency: merchant.currency,
        timezone: merchant.timezone,
      },
      rules: [
        {
          name: 'Base Points',
          description: 'Earn points on every purchase',
          type: 'FIXED',
          points: 1,
          conditions: {},
          minAmount: 0,
        },
        {
          name: 'Birthday Bonus',
          description: 'Earn bonus points on your birthday',
          type: 'DYNAMIC',
          points: 100,
          conditions: {
            eventType: 'BIRTHDAY'
          },
        }
      ],
      tiers: [
        {
          name: 'Bronze',
          description: 'Entry level tier',
          pointsThreshold: 0,
          benefits: {
            pointsMultiplier: 1
          }
        },
        {
          name: 'Silver',
          description: 'Mid-level tier with enhanced benefits',
          pointsThreshold: 1000,
          benefits: {
            pointsMultiplier: 1.25,
            specialDiscounts: {
              percentage: 5
            }
          }
        },
        {
          name: 'Gold',
          description: 'Premium tier with exclusive benefits',
          pointsThreshold: 5000,
          benefits: {
            pointsMultiplier: 1.5,
            specialDiscounts: {
              percentage: 10
            },
            prioritySupport: true
          }
        }
      ],
      rewards: [
        {
          name: '5% Discount',
          description: 'Get 5% off your next purchase',
          type: 'COUPON',
          pointsCost: 100,
          validityPeriod: 30,
        },
        {
          name: '10% Discount',
          description: 'Get 10% off your next purchase',
          type: 'COUPON',
          pointsCost: 200,
          validityPeriod: 30,
        },
        {
          name: 'Free Product',
          description: 'Get a free product of your choice',
          type: 'PHYSICAL',
          pointsCost: 500,
          validityPeriod: 60,
        }
      ]
    };
  }
}
