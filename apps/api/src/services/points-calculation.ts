import { prisma } from "../db/prisma.js";
import { logger } from "@trigger.dev/sdk/v3";

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
    // Get loyalty program's active rules
    const rules = await prisma.pointsRule.findMany({
      where: {
        loyaltyProgramId: context.loyaltyProgramId,
        isActive: true,
      },
    });

    let totalPoints = 0;
    const matchedRules = [];

    // Check each rule against the event data
    for (const rule of rules) {
      let matches = true;
      const matchedConditions = [];

      for (const condition of rule.conditions) {
        const value = context.metadata?.[condition.field];
        if (!value) {
          matches = false;
          break;
        }

        let conditionMatches = false;
        switch (condition.operator) {
          case 'equals':
            conditionMatches = value === condition.value;
            break;
          case 'greaterThan':
            conditionMatches = value > condition.value;
            break;
          case 'lessThan':
            conditionMatches = value < condition.value;
            break;
          case 'contains':
            conditionMatches = Array.isArray(value) 
              ? value.includes(condition.value)
              : String(value).includes(String(condition.value));
            break;
          default:
            conditionMatches = false;
        }

        if (!conditionMatches) {
          matches = false;
          break;
        }

        matchedConditions.push(condition);
      }

      if (matches) {
        totalPoints += rule.points;
        matchedRules.push({
          ruleId: rule.id,
          ruleName: rule.name,
          points: rule.points,
          matchedConditions
        });
      }
    }

    // Log calculation details
    await logger.info("Points calculation completed", {
      transactionAmount: context.transactionAmount,
      totalPoints,
      merchantId: context.merchantId,
      userId: context.userId,
      loyaltyProgramId: context.loyaltyProgramId,
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