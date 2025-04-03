import { PrismaClient } from '@prisma/client';
import { Redis } from 'ioredis';
import { env } from '../config/env.js';
import { logger } from "@trigger.dev/sdk/v3";

const prisma = new PrismaClient();
const redis = new Redis(env.REDIS_URL);

// Types for points calculation
export interface PointsCalculationContext {
  transactionAmount: number;
  merchantId: string;
  userId: string;
  loyaltyProgramId: string;
  metadata?: Record<string, any>;
}

export interface PointsRule {
  id: string;
  name: string;
  description?: string;
  conditions: Array<{
    field: string;
    operator: 'equals' | 'greaterThan' | 'lessThan' | 'contains';
    value: any;
  }>;
  points: number;
  metadata?: Record<string, any>;
}

export interface PointsCalculationResult {
  totalPoints: number;
  matchedRules: Array<{
    ruleId: string;
    ruleName: string;
    points: number;
    matchedConditions: Array<{
      field: string;
      operator: string;
      value: any;
    }>;
  }>;
  metadata?: Record<string, any>;
}

export class PointsCalculationService {
  /**
   * Calculate points based on transaction context and loyalty program rules
   */
  async calculatePoints(context: PointsCalculationContext): Promise<PointsCalculationResult> {
    const { transactionAmount, merchantId, userId, loyaltyProgramId, metadata } = context;

    // Get user's current tier and active campaigns
    const [userTier, activeCampaigns] = await Promise.all([
      this.getUserTier(userId, merchantId),
      this.getActiveCampaigns(merchantId),
    ]);

    // Calculate base points from rules
    const { basePoints, matchedRules } = await this.calculateBasePoints(merchantId, transactionAmount, loyaltyProgramId, metadata);

    // Apply tier multiplier
    const tierMultiplier = userTier?.benefits?.pointsMultiplier || 1;
    const pointsAfterTier = basePoints * tierMultiplier;

    // Apply campaign bonuses
    const { campaignBonus, matchedCampaigns } = await this.calculateCampaignBonuses(
      activeCampaigns,
      userId,
      pointsAfterTier,
      metadata
    );

    const totalPoints = pointsAfterTier + campaignBonus;

    // Cache the calculation result
    await this.cacheCalculationResult(userId, merchantId, totalPoints);

    // Log calculation details
    await logger.info("Points calculation completed", {
      transactionAmount,
      totalPoints,
      merchantId,
      userId,
      loyaltyProgramId,
      matchedRules
    });

    return {
      totalPoints,
      matchedRules,
      metadata: {
        calculationMethod: "rule_based",
        matchedRulesCount: matchedRules.length,
        timestamp: new Date().toISOString()
      }
    };
  }

  private async getUserTier(userId: string, merchantId: string) {
    const member = await prisma.programMember.findFirst({
      where: {
        userId,
        tier: {
          loyaltyProgram: {
            merchantId,
          },
        },
      },
      include: {
        tier: true,
      },
    });

    return member?.tier;
  }

  private async getActiveCampaigns(merchantId: string) {
    const now = new Date();
    return prisma.campaign.findMany({
      where: {
        loyaltyProgram: {
          merchantId,
        },
        isActive: true,
        startDate: {
          lte: now,
        },
        endDate: {
          gte: now,
        },
      },
    });
  }

  private async calculateBasePoints(
    merchantId: string,
    amount: number,
    type: string,
    metadata?: Record<string, any>
  ) {
    const rules = await prisma.pointsRule.findMany({
      where: {
        loyaltyProgram: {
          merchantId,
        },
        isActive: true,
      },
    });

    let totalPoints = 0;
    const matchedRules = [];

    for (const rule of rules) {
      if (this.matchesRule(rule, amount, type, metadata)) {
        const points = this.calculateRulePoints(rule, amount);
        totalPoints += points;
        matchedRules.push({
          ruleId: rule.id,
          points,
        });
      }
    }

    return { basePoints: totalPoints, matchedRules };
  }

  private async calculateCampaignBonuses(
    campaigns: any[],
    userId: string,
    basePoints: number,
    metadata?: Record<string, any>
  ) {
    let totalBonus = 0;
    const matchedCampaigns = [];

    for (const campaign of campaigns) {
      if (this.matchesCampaign(campaign, userId, metadata)) {
        const bonus = this.calculateCampaignBonus(campaign, basePoints);
        totalBonus += bonus;
        matchedCampaigns.push({
          campaignId: campaign.id,
          bonus,
        });
      }
    }

    return { campaignBonus: totalBonus, matchedCampaigns };
  }

  private matchesRule(rule: any, amount: number, type: string, metadata?: Record<string, any>) {
    const conditions = rule.conditions;
    if (!conditions) return true;

    // Implement rule matching logic based on conditions
    // This is a simplified version - expand based on your needs
    return true;
  }

  private calculateRulePoints(rule: any, amount: number) {
    switch (rule.type) {
      case 'FIXED':
        return rule.points;
      case 'PERCENTAGE':
        return Math.floor(amount * (rule.points / 100));
      case 'DYNAMIC':
        // Implement dynamic calculation based on rule configuration
        return rule.points;
      default:
        return 0;
    }
  }

  private matchesCampaign(campaign: any, userId: string, metadata?: Record<string, any>) {
    // Implement campaign matching logic
    return true;
  }

  private calculateCampaignBonus(campaign: any, basePoints: number) {
    switch (campaign.type) {
      case 'POINTS_MULTIPLIER':
        return Math.floor(basePoints * (campaign.rewards?.multiplier || 1));
      case 'BONUS_POINTS':
        return campaign.rewards?.bonusPoints || 0;
      default:
        return 0;
    }
  }

  private async cacheCalculationResult(userId: string, merchantId: string, points: number) {
    const key = `points:${userId}:${merchantId}`;
    await redis.incrby(key, points);
    await redis.expire(key, 86400); // Cache for 24 hours
  }

  /**
   * Create a points calculation record
   */
  async createCalculationRecord(
    transactionId: string,
    merchantId: string,
    userId: string,
    loyaltyProgramId: string,
    points: number,
    status: "PENDING" | "COMPLETED" | "FAILED" = "PENDING",
    error?: string
  ) {
    return prisma.pointsCalculation.create({
      data: {
        transactionId,
        merchantId,
        userId,
        loyaltyProgramId,
        points,
        status,
        error,
      },
    });
  }

  /**
   * Update points balance for a user
   */
  async updatePointsBalance(
    userId: string,
    merchantId: string,
    loyaltyProgramId: string,
    points: number
  ) {
    return prisma.pointsBalance.upsert({
      where: {
        userId_merchantId: {
          userId,
          merchantId,
        },
      },
      create: {
        userId,
        merchantId,
        loyaltyProgramId,
        balance: points,
      },
      update: {
        balance: {
          increment: points,
        },
      },
    });
  }
} 