import { schemaTask, logger } from "@trigger.dev/sdk/v3";
import { z } from "zod";
import { prisma } from "../db/prisma.js";

const schema = z.object({
  redemptionId: z.string(),
  merchantId: z.string(),
  userId: z.string(),
  metadata: z.record(z.any()).optional(),
});

type RewardRedemptionPayload = z.infer<typeof schema>;

// Reward redemption processing job
export const rewardRedemptionJob: ReturnType<typeof schemaTask> = schemaTask({
  id: "reward-redemption",
  schema,
  retry: {
    maxAttempts: 3,
    factor: 1.8,
    minTimeoutInMs: 1000,
    maxTimeoutInMs: 30000,
    randomize: true,
  },
  run: async (payload: RewardRedemptionPayload) => {
    await logger.info("Starting reward redemption processing job", { payload });

    try {
      // Get redemption details
      const redemption = await prisma.rewardRedemption.findUnique({
        where: { id: payload.redemptionId },
        include: {
          reward: true,
          user: true,
        },
      });

      if (!redemption) {
        throw new Error(`Redemption ${payload.redemptionId} not found`);
      }

      // Check if user has enough points
      const userBalance = await prisma.pointsBalance.findUnique({
        where: {
          userId_merchantId: {
            userId: payload.userId,
            merchantId: payload.merchantId,
          },
        },
      });

      if (!userBalance || userBalance.balance < redemption.reward.pointsCost) {
        // Update redemption status to failed
        await prisma.rewardRedemption.update({
          where: { id: payload.redemptionId },
          data: {
            status: "FAILED",
            metadata: {
              failureReason: "INSUFFICIENT_POINTS",
            },
          },
        });

        await logger.warn(`Redemption ${payload.redemptionId} failed: insufficient points`, {
          userId: payload.userId,
          requiredPoints: redemption.reward.pointsCost,
          availablePoints: userBalance?.balance || 0,
        });
      } else {
        // Deduct points from user's balance
        await prisma.pointsBalance.update({
          where: {
            userId_merchantId: {
              userId: payload.userId,
              merchantId: payload.merchantId,
            },
          },
          data: {
            balance: {
              decrement: redemption.reward.pointsCost,
            },
          },
        });

        // Create points transaction record
        await prisma.pointsTransaction.create({
          data: {
            userId: payload.userId,
            amount: -redemption.reward.pointsCost,
            type: "REDEEM",
            reason: `Redeemed reward: ${redemption.reward.name}`,
            metadata: {
              redemptionId: payload.redemptionId,
              rewardId: redemption.rewardId,
            },
          },
        });

        // Update redemption status to completed
        await prisma.rewardRedemption.update({
          where: { id: payload.redemptionId },
          data: {
            status: "COMPLETED",
            metadata: {
              completedAt: new Date().toISOString(),
            },
          },
        });

        await logger.info(`Processed redemption ${payload.redemptionId}`, {
          userId: payload.userId,
          rewardId: redemption.rewardId,
          pointsCost: redemption.reward.pointsCost,
        });
      }

      await logger.info("Completed reward redemption processing job");
    } catch (error) {
      await logger.error("Reward redemption processing job failed", { 
        error,
        redemptionId: payload.redemptionId,
        merchantId: payload.merchantId,
        userId: payload.userId,
      });
      throw error;
    }
  },
}); 