import prismaPkg from '@prisma/client';
const { PrismaClient } = prismaPkg;
import { SegmentService } from '../services/segment.js';

const prisma = new PrismaClient();
const segmentService = new SegmentService();

export async function evaluateSegmentsAfterTransaction(userId: string, merchantId: string) {
  try {
    // Get all active segments for the merchant's loyalty programs
    const segments = await prisma.segment.findMany({
      where: {
        isActive: true,
        loyaltyProgram: {
          merchantId,
        },
      },
      include: {
        members: {
          where: {
            userId,
          },
        },
      },
    });

    // Evaluate each segment
    for (const segment of segments) {
      const matches = await segmentService.evaluateSegmentCriteria(userId, segment.id);
      const isMember = segment.members.length > 0;

      // If user matches criteria but isn't a member, add them
      if (matches && !isMember) {
        await segmentService.addMemberToSegment(segment.id, userId, {
          joinedAt: new Date(),
          reason: 'Transaction triggered evaluation',
        });
      }
      // If user doesn't match criteria but is a member, remove them
      else if (!matches && isMember) {
        await segmentService.removeMemberFromSegment(segment.id, userId);
      }
    }
  } catch (error) {
    console.error('Failed to evaluate segments after transaction:', error);
  }
}

export async function evaluateSegmentsAfterRedemption(userId: string, merchantId: string) {
  try {
    // Get all active segments for the merchant's loyalty programs
    const segments = await prisma.segment.findMany({
      where: {
        isActive: true,
        loyaltyProgram: {
          merchantId,
        },
      },
      include: {
        members: {
          where: {
            userId,
          },
        },
      },
    });

    // Evaluate each segment
    for (const segment of segments) {
      const matches = await segmentService.evaluateSegmentCriteria(userId, segment.id);
      const isMember = segment.members.length > 0;

      // If user matches criteria but isn't a member, add them
      if (matches && !isMember) {
        await segmentService.addMemberToSegment(segment.id, userId, {
          joinedAt: new Date(),
          reason: 'Redemption triggered evaluation',
        });
      }
      // If user doesn't match criteria but is a member, remove them
      else if (!matches && isMember) {
        await segmentService.removeMemberFromSegment(segment.id, userId);
      }
    }
  } catch (error) {
    console.error('Failed to evaluate segments after redemption:', error);
  }
}

export async function evaluateSegmentsAfterPointsAdjustment(userId: string, merchantId: string) {
  try {
    // Get all active segments for the merchant's loyalty programs
    const segments = await prisma.segment.findMany({
      where: {
        isActive: true,
        loyaltyProgram: {
          merchantId,
        },
      },
      include: {
        members: {
          where: {
            userId,
          },
        },
      },
    });

    // Evaluate each segment
    for (const segment of segments) {
      const matches = await segmentService.evaluateSegmentCriteria(userId, segment.id);
      const isMember = segment.members.length > 0;

      // If user matches criteria but isn't a member, add them
      if (matches && !isMember) {
        await segmentService.addMemberToSegment(segment.id, userId, {
          joinedAt: new Date(),
          reason: 'Points adjustment triggered evaluation',
        });
      }
      // If user doesn't match criteria but is a member, remove them
      else if (!matches && isMember) {
        await segmentService.removeMemberFromSegment(segment.id, userId);
      }
    }
  } catch (error) {
    console.error('Failed to evaluate segments after points adjustment:', error);
  }
}

// Scheduled job to evaluate all segments periodically
export async function evaluateAllSegments() {
  try {
    // Get all active segments
    const segments = await prisma.segment.findMany({
      where: {
        isActive: true,
      },
      include: {
        members: true,
      },
    });

    // Get all users who have any activity
    const users = await prisma.user.findMany({
      where: {
        OR: [
          { pointsTransactions: { some: {} } },
          { rewardRedemptions: { some: {} } },
          { pointsBalances: { some: {} } },
        ],
      },
    });

    // Evaluate each user against each segment
    for (const user of users) {
      for (const segment of segments) {
        const matches = await segmentService.evaluateSegmentCriteria(user.id, segment.id);
        const isMember = segment.members.some(m => m.userId === user.id);

        // If user matches criteria but isn't a member, add them
        if (matches && !isMember) {
          await segmentService.addMemberToSegment(segment.id, user.id, {
            joinedAt: new Date(),
            reason: 'Scheduled evaluation',
          });
        }
        // If user doesn't match criteria but is a member, remove them
        else if (!matches && isMember) {
          await segmentService.removeMemberFromSegment(segment.id, user.id);
        }
      }
    }
  } catch (error) {
    console.error('Failed to evaluate all segments:', error);
  }
}