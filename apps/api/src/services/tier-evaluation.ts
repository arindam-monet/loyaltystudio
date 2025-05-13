import prismaPkg from '@prisma/client';
const { PrismaClient } = prismaPkg;

const prisma = new PrismaClient();

interface TierEvaluationResult {
  currentTier: string | null;
  nextTier: string | null;
  pointsToNextTier: number;
  shouldUpgrade: boolean;
  shouldDowngrade: boolean;
}

export class TierEvaluationService {
  async evaluateMemberTier(userId: string, loyaltyProgramId: string): Promise<TierEvaluationResult> {
    // Get member's current tier and points
    const member = await prisma.programMember.findFirst({
      where: {
        userId,
        tier: {
          loyaltyProgramId
        }
      },
      include: {
        tier: true,
      },
    });

    if (!member) {
      throw new Error('Member not found');
    }

    // Get all tiers for the program
    const tiers = await prisma.programTier.findMany({
      where: {
        loyaltyProgramId,
      },
      orderBy: {
        pointsThreshold: 'asc',
      },
    });

    // Find current and next tier
    let currentTier = null;
    let nextTier = null;
    let pointsToNextTier = 0;

    for (let i = 0; i < tiers.length; i++) {
      if (member.pointsBalance >= tiers[i].pointsThreshold) {
        currentTier = tiers[i];
        if (i < tiers.length - 1) {
          nextTier = tiers[i + 1];
          pointsToNextTier = nextTier.pointsThreshold - member.pointsBalance;
        }
      } else {
        if (!currentTier) {
          nextTier = tiers[i];
          pointsToNextTier = nextTier.pointsThreshold - member.pointsBalance;
        }
        break;
      }
    }

    // Check if tier should be updated
    const shouldUpgrade = nextTier && member.pointsBalance >= nextTier.pointsThreshold;
    const shouldDowngrade = currentTier && member.pointsBalance < currentTier.pointsThreshold;

    return {
      currentTier: currentTier?.id || null,
      nextTier: nextTier?.id || null,
      pointsToNextTier,
      shouldUpgrade,
      shouldDowngrade,
    };
  }

  async updateMemberTier(userId: string, loyaltyProgramId: string): Promise<void> {
    const evaluation = await this.evaluateMemberTier(userId, loyaltyProgramId);

    if (evaluation.shouldUpgrade || evaluation.shouldDowngrade) {
      const newTierId = evaluation.shouldUpgrade ? evaluation.nextTier : evaluation.currentTier;

      await prisma.programMember.updateMany({
        where: {
          userId: userId,
          tier: {
            loyaltyProgramId: loyaltyProgramId
          }
        },
        data: {
          tierId: newTierId,
        },
      });

      // Log tier change - commented out as tierChange model doesn't exist
      // We would need to create this model in the schema first
      /*
      await prisma.tierChange.create({
        data: {
          userId,
          loyaltyProgramId,
          oldTierId: evaluation.currentTier,
          newTierId,
          pointsAtChange: evaluation.pointsToNextTier,
          changeType: evaluation.shouldUpgrade ? 'UPGRADE' : 'DOWNGRADE',
        },
      });
      */
    }
  }

  async getTierProgress(userId: string, loyaltyProgramId: string) {
    const evaluation = await this.evaluateMemberTier(userId, loyaltyProgramId);
    const member = await prisma.programMember.findFirst({
      where: {
        userId,
        tier: {
          loyaltyProgramId
        }
      },
    });

    if (!member) {
      throw new Error('Member not found');
    }

    return {
      currentTier: evaluation.currentTier,
      nextTier: evaluation.nextTier,
      currentPoints: member.pointsBalance,
      pointsToNextTier: evaluation.pointsToNextTier,
      progressPercentage: evaluation.nextTier
        ? (member.pointsBalance / evaluation.pointsToNextTier) * 100
        : 100,
    };
  }
}