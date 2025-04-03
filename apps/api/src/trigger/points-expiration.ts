import { PrismaClient } from '@prisma/client';
import { logger } from "@trigger.dev/sdk/v3";

const prisma = new PrismaClient();

export async function handlePointsExpiration() {
  try {
    // Get all loyalty programs with points expiration settings
    const programs = await prisma.loyaltyProgram.findMany({
      where: {
        settings: {
          path: ['pointsExpiration'],
          not: null,
        },
      },
    });

    for (const program of programs) {
      const settings = program.settings as any;
      const expirationDays = settings.pointsExpiration?.days || 365;
      const expirationDate = new Date();
      expirationDate.setDate(expirationDate.getDate() - expirationDays);

      // Find points transactions older than expiration date
      const expiredTransactions = await prisma.pointsTransaction.findMany({
        where: {
          loyaltyProgramId: program.id,
          createdAt: {
            lt: expirationDate,
          },
          isExpired: false,
        },
      });

      for (const transaction of expiredTransactions) {
        // Create expiration transaction
        await prisma.pointsTransaction.create({
          data: {
            userId: transaction.userId,
            loyaltyProgramId: program.id,
            amount: -transaction.amount,
            type: 'EXPIRATION',
            reason: `Points expired after ${expirationDays} days`,
            metadata: {
              originalTransactionId: transaction.id,
            },
          },
        });

        // Mark original transaction as expired
        await prisma.pointsTransaction.update({
          where: { id: transaction.id },
          data: { isExpired: true },
        });

        // Log expiration
        await logger.info("Points expired", {
          userId: transaction.userId,
          programId: program.id,
          amount: transaction.amount,
          expirationDate,
        });
      }
    }
  } catch (error) {
    await logger.error("Failed to process points expiration", { error });
    throw error;
  }
} 