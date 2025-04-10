import { PrismaClient } from '@prisma/client';
import { Redis } from 'ioredis';
import { env } from '../config/env.js';

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

    // Apply tier multiplier if available
    let tierMultiplier = 1;
    if (userTier && userTier.benefits) {
      const benefits = userTier.benefits as Record<string, any>;
      tierMultiplier = benefits.pointsMultiplier || 1;
    }
    const pointsAfterTier = basePoints * tierMultiplier;

    // Apply campaign bonuses
    const { campaignBonus } = await this.calculateCampaignBonuses(
      activeCampaigns,
      userId,
      pointsAfterTier,
      metadata
    );

    const totalPoints = pointsAfterTier + campaignBonus;

    // Cache the calculation result
    await this.cacheCalculationResult(userId, merchantId, totalPoints);

    // Log calculation details (using console.log for now, should use fastify.log in request context)
    console.log("Points calculation completed", {
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
    loyaltyProgramId: string,
    metadata?: Record<string, any>
  ) {
    const rules = await prisma.pointsRule.findMany({
      where: {
        loyaltyProgram: {
          merchantId,
        },
        loyaltyProgramId,
        isActive: true,
      },
    });

    let totalPoints = 0;
    const matchedRules = [];

    for (const rule of rules) {
      if (this.matchesRule(rule, amount, 'EARN', metadata)) {
        const points = this.calculateRulePoints(rule, amount);
        totalPoints += points;
        matchedRules.push({
          ruleId: rule.id,
          ruleName: rule.name || 'Unnamed Rule',
          points,
          matchedConditions: []
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
    if (!conditions || !Array.isArray(conditions) || conditions.length === 0) return true;

    // Implement rule matching logic based on conditions
    return conditions.every(condition => {
      // Check if the condition applies to the transaction type
      if (condition.field === 'type' && condition.value !== type) {
        return false;
      }

      // Check if the condition applies to the transaction amount
      if (condition.field === 'amount') {
        switch (condition.operator) {
          case 'greaterThan':
            return amount > condition.value;
          case 'lessThan':
            return amount < condition.value;
          case 'equals':
            return amount === condition.value;
          default:
            return true;
        }
      }

      // Check metadata conditions
      if (metadata && condition.field.startsWith('metadata.')) {
        const metadataField = condition.field.replace('metadata.', '');
        const metadataValue = metadata[metadataField];

        if (metadataValue === undefined) return false;

        switch (condition.operator) {
          case 'equals':
            return metadataValue === condition.value;
          case 'contains':
            return String(metadataValue).includes(String(condition.value));
          default:
            return true;
        }
      }

      return true;
    });
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
    // Skip if campaign has no conditions
    if (!campaign.conditions) return true;

    const conditions = campaign.conditions as any;

    // Check user targeting if specified
    if (conditions.userTargeting) {
      // If specific users are targeted, check if current user is included
      if (conditions.userTargeting.specificUsers &&
        Array.isArray(conditions.userTargeting.specificUsers) &&
        conditions.userTargeting.specificUsers.length > 0) {
        if (!conditions.userTargeting.specificUsers.includes(userId)) {
          return false;
        }
      }
    }

    // Check metadata conditions if specified
    if (conditions.metadata && metadata) {
      for (const [key, value] of Object.entries(conditions.metadata)) {
        if (metadata[key] !== value) {
          return false;
        }
      }
    }

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
    points: number,
    status: "PENDING" | "COMPLETED" | "FAILED" = "PENDING",
    error?: string
  ) {
    return prisma.pointsCalculation.create({
      data: {
        transactionId,
        merchantId,
        userId,
        points,
        status,
        error,
        metadata: {
          timestamp: new Date().toISOString()
        },
        completedAt: status === "COMPLETED" ? new Date() : undefined,
      },
    });
  }

  /**
   * Update points balance for a user
   */
  async updatePointsBalance(
    userId: string,
    merchantId: string,
    points: number
  ) {
    // First find if a balance record exists
    const existingBalance = await prisma.pointsBalance.findFirst({
      where: {
        userId,
        merchantId,
      },
    });

    if (existingBalance) {
      // Update existing balance
      return prisma.pointsBalance.update({
        where: { id: existingBalance.id },
        data: {
          balance: {
            increment: points,
          },
        },
      });
    } else {
      // Create new balance
      return prisma.pointsBalance.create({
        data: {
          userId,
          merchantId,
          balance: points,
        },
      });
    }
  }
}