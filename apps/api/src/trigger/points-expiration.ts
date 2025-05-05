import { schemaTask, logger } from "@trigger.dev/sdk/v3";
import { prisma } from "../db/prisma.js";
import { z } from "zod";
import crypto from 'crypto';

// Define the schema for the points expiration job
const schema = z.object({
  // Optional parameters for testing or manual triggering
  programId: z.string().optional(),
});

type PointsExpirationPayload = z.infer<typeof schema>;

// Points expiration job definition
export const pointsExpirationJob = schemaTask({
  id: "points-expiration",
  schema,
  run: async (payload: PointsExpirationPayload) => {
    logger.info("Starting points expiration job", { payload });

    try {
      // Get all loyalty programs with points expiration settings
      let programs = [];

      if (payload.programId) {
        programs = await prisma.loyaltyProgram.findMany({
          where: { id: payload.programId }
        });
      } else {
        programs = await prisma.loyaltyProgram.findMany({
          where: {
            settings: {
              path: ['pointsExpiration'],
              not: null,
            },
          },
        });
      }

      logger.info(`Found ${programs.length} programs with expiration settings`);

      let totalExpiredTransactions = 0;
      let totalPointsExpired = 0;

      for (const program of programs) {
        const settings = program.settings as any;
        const expirationDays = settings.pointsExpiration?.days || 365;
        const expirationDate = new Date();
        expirationDate.setDate(expirationDate.getDate() - expirationDays);

        logger.info(`Processing program ${program.id} with ${expirationDays} days expiration period`, {
          programId: program.id,
          expirationDays,
          expirationDate,
        });

        // Find points transactions older than expiration date that belong to this program
        // Use raw SQL query to work around schema issues
        const expiredTransactions = await prisma.$queryRaw<any[]>`
          SELECT pt.*
          FROM "PointsTransaction" pt
          JOIN "LoyaltyProgram" lp ON pt."loyaltyProgramId" = lp.id
          WHERE lp.id = ${program.id}::text
          AND pt."createdAt" < ${expirationDate}::timestamp
          AND pt."isExpired" = false
          AND pt.amount > 0
          AND pt.type != 'EXPIRATION'
        `;

        logger.info(`Found ${expiredTransactions.length} expired transactions for program ${program.id}`);

        for (const transaction of expiredTransactions) {
          // Create expiration transaction using raw SQL to work around schema issues
          await prisma.$executeRaw`
            INSERT INTO "PointsTransaction" (
              id, "userId", "programMemberId", amount, type, reason, metadata, "loyaltyProgramId", "createdAt", "updatedAt"
            ) VALUES (
              ${crypto.randomUUID()},
              ${transaction.userId},
              ${transaction.programMemberId},
              ${-transaction.amount},
              'EXPIRATION',
              ${`Points expired after ${expirationDays} days`},
              ${{ originalTransactionId: transaction.id }}::jsonb,
              ${program.id},
              NOW(),
              NOW()
            )
          `;

          // Mark original transaction as expired
          await prisma.$executeRaw`UPDATE "PointsTransaction" SET "isExpired" = true WHERE id = ${transaction.id}::text`;

          // Update user's points balance
          if (transaction.userId) {
            await prisma.pointsBalance.updateMany({
              where: {
                userId: transaction.userId,
                merchantId: program.merchantId,
              },
              data: {
                balance: {
                  decrement: transaction.amount,
                },
              },
            });
          }

          // Update program member's points balance if applicable
          if (transaction.programMemberId) {
            await prisma.programMember.update({
              where: { id: transaction.programMemberId },
              data: {
                pointsBalance: {
                  decrement: transaction.amount,
                },
              },
            });
          }

          totalExpiredTransactions++;
          totalPointsExpired += transaction.amount;

          // Log expiration
          logger.info("Points expired", {
            userId: transaction.userId,
            programId: program.id,
            amount: transaction.amount,
            expirationDate,
          });
        }
      }

      logger.info("Points expiration job completed", {
        totalPrograms: programs.length,
        totalExpiredTransactions,
        totalPointsExpired,
      });

      return {
        totalPrograms: programs.length,
        totalExpiredTransactions,
        totalPointsExpired,
      };
    } catch (error) {
      logger.error("Failed to process points expiration", { error });
      throw error;
    }
  }
});

// Export a standalone function for testing or manual triggering
export async function handlePointsExpiration(programId?: string) {
  return pointsExpirationJob.trigger({ programId });
}