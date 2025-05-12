import prismaPkg from '@prisma/client';
const { PrismaClient, WebhookEventType } = prismaPkg;
import type { PointsTransaction, PointsRule } from '@prisma/client';
import { z } from 'zod';
import { evaluateSegmentsAfterTransaction } from './segment-evaluation.js';
import { webhookService } from '../services/webhook.js';

const prismaClient = new PrismaClient();

const schema = z.object({
  transactionId: z.string(),
  merchantId: z.string(),
  userId: z.string(),
});

type PointsCalculationPayload = z.infer<typeof schema>;

interface TransactionMetadata {
  merchantId: string;
  amount?: number;
  category?: string;
}

interface RuleMetadata {
  type: 'FIXED' | 'PERCENTAGE' | 'DYNAMIC';
  maxPoints?: number;
  minAmount?: number;
  categoryRules?: Record<string, { points: number }>;
  timeRules?: Array<{
    daysOfWeek?: number[];
    startHour?: number;
    endHour?: number;
    points: number;
  }>;
}

export async function calculatePoints(transactionId: string) {
  let transaction: (PointsTransaction & { user: any }) | null = null;
  try {
    transaction = await prismaClient.pointsTransaction.findUnique({
      where: { id: transactionId },
      include: {
        user: true,
      },
    });

    if (!transaction) {
      throw new Error('Transaction not found');
    }

    const metadata = transaction.metadata as unknown as TransactionMetadata;
    if (!metadata?.merchantId) {
      throw new Error('Transaction metadata missing merchantId');
    }

    // Get active points rules for the merchant
    const rules = await prismaClient.pointsRule.findMany({
      where: {
        loyaltyProgram: {
          merchantId: metadata.merchantId,
        },
        isActive: true,
      },
    });

    let totalPoints = 0;
    const matchedRules = [];

    // Calculate points based on rules
    for (const rule of rules) {
      const points = await evaluateRule(transaction, rule);
      if (points > 0) {
        totalPoints += points;
        matchedRules.push({
          ruleId: rule.id,
          points,
        });
      }
    }

    // Create points calculation record
    const calculation = await prismaClient.pointsCalculation.create({
      data: {
        transactionId,
        merchantId: metadata.merchantId,
        userId: transaction.userId,
        points: totalPoints,
        status: 'COMPLETED',
        metadata: {
          matchedRules,
        },
        completedAt: new Date(),
      },
    });

    // Update points balance
    // First find if a balance record exists
    const existingBalance = await prismaClient.pointsBalance.findFirst({
      where: {
        userId: transaction.userId,
        merchantId: metadata.merchantId,
      },
    });

    if (existingBalance) {
      // Update existing balance
      await prismaClient.pointsBalance.update({
        where: { id: existingBalance.id },
        data: {
          balance: {
            increment: totalPoints,
          },
        },
      });
    } else {
      // Create new balance
      await prismaClient.pointsBalance.create({
        data: {
          userId: transaction.userId,
          merchantId: metadata.merchantId,
          balance: totalPoints,
        },
      });
    }

    // Send webhook for points earned
    if (totalPoints > 0) {
      await webhookService.sendWebhook(
        metadata.merchantId,
        WebhookEventType.points_earned,
        {
          transactionId,
          userId: transaction.userId || '',
          points: totalPoints,
          matchedRules,
          timestamp: new Date().toISOString()
        }
      ).catch(err => console.error('Failed to send points earned webhook:', err));
    }

    // Evaluate segments after points calculation
    if (transaction.userId) {
      await evaluateSegmentsAfterTransaction(transaction.userId, metadata.merchantId);
    }

    return calculation;
  } catch (error) {
    console.error('Failed to calculate points:', error);

    // Create failed calculation record
    if (transaction) {
      const metadata = transaction.metadata as unknown as TransactionMetadata;
      await prismaClient.pointsCalculation.create({
        data: {
          transactionId,
          merchantId: metadata?.merchantId || '',
          userId: transaction.userId,
          status: 'FAILED',
          error: error instanceof Error ? error.message : 'Unknown error',
          completedAt: new Date(),
        },
      });
    }

    throw error;
  }
}

async function evaluateRule(transaction: PointsTransaction, rule: PointsRule): Promise<number> {
  // Basic rule evaluation
  let points = 0;
  const ruleMetadata = rule.metadata as unknown as RuleMetadata;

  switch (ruleMetadata.type) {
    case 'FIXED':
      points = rule.points;
      break;
    case 'PERCENTAGE':
      // Assuming transaction amount is stored in metadata
      const amount = (transaction.metadata as unknown as TransactionMetadata)?.amount || 0;
      points = Math.floor(amount * (rule.points / 100));
      break;
    case 'DYNAMIC':
      // Evaluate dynamic rule conditions
      points = await evaluateDynamicRule(transaction, rule);
      break;
  }

  // Apply max points limit if set
  if (ruleMetadata.maxPoints && points > ruleMetadata.maxPoints) {
    points = ruleMetadata.maxPoints;
  }

  // Check minimum amount requirement if set
  if (ruleMetadata.minAmount) {
    const amount = (transaction.metadata as unknown as TransactionMetadata)?.amount || 0;
    if (amount < ruleMetadata.minAmount) {
      return 0;
    }
  }

  return points;
}

async function evaluateDynamicRule(transaction: PointsTransaction, rule: PointsRule): Promise<number> {
  const ruleMetadata = rule.metadata as unknown as RuleMetadata;

  // Evaluate category rules if present
  if (ruleMetadata.categoryRules) {
    const category = (transaction.metadata as unknown as TransactionMetadata)?.category;
    if (category) {
      const categoryRule = ruleMetadata.categoryRules[category];
      if (categoryRule) {
        return categoryRule.points;
      }
    }
  }

  // Evaluate time-based rules if present
  if (ruleMetadata.timeRules) {
    const transactionTime = new Date(transaction.createdAt);
    const timeRules = ruleMetadata.timeRules;

    for (const timeRule of timeRules) {
      if (isTimeInRange(transactionTime, timeRule)) {
        return timeRule.points;
      }
    }
  }

  return 0;
}

function isTimeInRange(time: Date, rule: {
  daysOfWeek?: number[];
  startHour?: number;
  endHour?: number;
  points: number;
}): boolean {
  const hour = time.getHours();
  const day = time.getDay();

  // Check day of week if specified
  if (rule.daysOfWeek && !rule.daysOfWeek.includes(day)) {
    return false;
  }

  // Check time range
  if (rule.startHour !== undefined && rule.endHour !== undefined) {
    return hour >= rule.startHour && hour < rule.endHour;
  }

  return false;
}