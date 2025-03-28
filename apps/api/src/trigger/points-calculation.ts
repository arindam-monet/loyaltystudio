import { schemaTask, logger } from "@trigger.dev/sdk/v3";
import { z } from "zod";
import { prisma } from "../db/prisma.js";
import { PointsCalculationService } from "../services/points-calculation.js";

const schema = z.object({
  transactionId: z.string(),
  merchantId: z.string(),
  userId: z.string(),
  metadata: z.record(z.any()).optional(),
});

type PointsCalculationPayload = z.infer<typeof schema>;

// Points calculation job
export const pointsCalculationJob: ReturnType<typeof schemaTask> = schemaTask({
  id: "points-calculation",
  schema,
  retry: {
    maxAttempts: 3,
    factor: 1.8,
    minTimeoutInMs: 1000,
    maxTimeoutInMs: 30000,
    randomize: true,
  },
  run: async (payload: PointsCalculationPayload) => {
    // Log job start
    await logger.info("Starting points calculation job", { payload });

    try {
      // Get transaction and related data
      const transaction = await prisma.pointsTransaction.findUnique({
        where: { id: payload.transactionId }
      });

      if (!transaction) {
        throw new Error(`Transaction ${payload.transactionId} not found`);
      }

      const pointsService = new PointsCalculationService();

      // Calculate points using the service
      const result = await pointsService.calculatePoints({
        transactionAmount: transaction.amount,
        merchantId: payload.merchantId,
        userId: payload.userId,
        metadata: {
          transactionId: payload.transactionId,
          ...payload.metadata,
        },
      });

      // Update points balance
      await pointsService.updatePointsBalance(
        payload.userId,
        payload.merchantId,
        result.totalPoints
      );

      // Create calculation record
      await pointsService.createCalculationRecord(
        payload.transactionId,
        payload.merchantId,
        payload.userId,
        result.totalPoints,
        "COMPLETED",
        undefined
      );

      // Log success
      await logger.info("Completed points calculation", {
        transactionId: payload.transactionId,
        points: result.totalPoints,
        userId: payload.userId,
        merchantId: payload.merchantId,
        matchedRules: result.matchedRules,
      });

    } catch (error) {
      // Log error and create failed calculation record
      await logger.error("Points calculation failed", { 
        error,
        transactionId: payload.transactionId,
        merchantId: payload.merchantId,
        userId: payload.userId,
      });

      const pointsService = new PointsCalculationService();
      await pointsService.createCalculationRecord(
        payload.transactionId,
        payload.merchantId,
        payload.userId,
        0,
        "FAILED",
        error instanceof Error ? error.message : "Unknown error"
      );

      throw error;
    }
  },
});