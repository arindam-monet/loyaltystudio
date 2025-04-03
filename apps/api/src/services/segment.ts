import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export interface SegmentCriteria {
  type: 'STATIC' | 'DYNAMIC' | 'HYBRID';
  conditions: {
    field: string;
    operator: string;
    value: any;
  }[];
}

export class SegmentService {
  // Create a new segment
  async createSegment(data: {
    name: string;
    description?: string;
    type: 'STATIC' | 'DYNAMIC' | 'HYBRID';
    criteria: any;
    isActive?: boolean;
    loyaltyProgramId: string;
  }) {
    return prisma.segment.create({
      data,
      include: {
        members: true
      }
    });
  }

  // Update a segment
  async updateSegment(id: string, data: Partial<{
    name: string;
    description: string;
    type: 'STATIC' | 'DYNAMIC' | 'HYBRID';
    criteria: any;
    isActive: boolean;
  }>) {
    return prisma.segment.update({
      where: { id },
      data,
      include: {
        members: true
      }
    });
  }

  // Delete a segment
  async deleteSegment(id: string) {
    return prisma.segment.delete({
      where: { id }
    });
  }

  // Get all segments for a loyalty program
  async getSegments(loyaltyProgramId: string) {
    return prisma.segment.findMany({
      where: {
        loyaltyProgramId,
      },
      include: {
        members: {
          include: {
            user: {
              select: {
                id: true,
                email: true,
                name: true,
              }
            }
          }
        }
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  // Get segment members
  async getSegmentMembers(segmentId: string) {
    return prisma.segmentMember.findMany({
      where: {
        segmentId,
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            name: true,
          }
        }
      },
      orderBy: {
        joinedAt: 'desc',
      },
    });
  }

  // Add member to segment
  async addMemberToSegment(segmentId: string, userId: string, metadata?: any) {
    return prisma.segmentMember.create({
      data: {
        segmentId,
        userId,
        metadata,
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            name: true,
          }
        }
      }
    });
  }

  // Remove member from segment
  async removeMemberFromSegment(segmentId: string, userId: string) {
    return prisma.segmentMember.delete({
      where: {
        segmentId_userId: {
          segmentId,
          userId,
        },
      },
    });
  }

  // Evaluate if a user matches segment criteria
  async evaluateSegmentCriteria(userId: string, segmentId: string): Promise<boolean> {
    const segment = await prisma.segment.findUnique({
      where: { id: segmentId },
      include: {
        members: {
          where: { userId }
        }
      }
    });

    if (!segment) {
      throw new Error('Segment not found');
    }

    // For static segments, just check if user is already a member
    if (segment.type === 'STATIC') {
      return segment.members.length > 0;
    }

    // For dynamic segments, evaluate criteria
    if (segment.type === 'DYNAMIC') {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        include: {
          pointsBalances: true,
          pointsTransactions: true,
          rewardRedemptions: true,
        }
      });

      if (!user) {
        throw new Error('User not found');
      }

      return this.evaluateUserAgainstCriteria(user, segment.criteria as SegmentCriteria);
    }

    // For hybrid segments, check both static and dynamic criteria
    if (segment.type === 'HYBRID') {
      const isStaticMember = segment.members.length > 0;
      if (isStaticMember) return true;

      const user = await prisma.user.findUnique({
        where: { id: userId },
        include: {
          pointsBalances: true,
          pointsTransactions: true,
          rewardRedemptions: true,
        }
      });

      if (!user) {
        throw new Error('User not found');
      }

      return this.evaluateUserAgainstCriteria(user, segment.criteria as SegmentCriteria);
    }

    return false;
  }

  // Helper method to evaluate user against segment criteria
  private evaluateUserAgainstCriteria(user: any, criteria: SegmentCriteria): boolean {
    return criteria.conditions.every(condition => {
      switch (condition.field) {
        case 'pointsBalance':
          return this.evaluateNumericCondition(
            user.pointsBalances[0]?.balance || 0,
            condition.operator,
            condition.value
          );
        case 'transactionCount':
          return this.evaluateNumericCondition(
            user.pointsTransactions.length,
            condition.operator,
            condition.value
          );
        case 'redemptionCount':
          return this.evaluateNumericCondition(
            user.rewardRedemptions.length,
            condition.operator,
            condition.value
          );
        case 'lastActivity':
          const lastActivity = user.pointsTransactions[0]?.createdAt;
          if (!lastActivity) return false;
          return this.evaluateDateCondition(
            lastActivity,
            condition.operator,
            condition.value
          );
        default:
          return false;
      }
    });
  }

  // Helper method to evaluate numeric conditions
  private evaluateNumericCondition(value: number, operator: string, target: number): boolean {
    switch (operator) {
      case 'gt':
        return value > target;
      case 'gte':
        return value >= target;
      case 'lt':
        return value < target;
      case 'lte':
        return value <= target;
      case 'eq':
        return value === target;
      default:
        return false;
    }
  }

  // Helper method to evaluate date conditions
  private evaluateDateCondition(value: Date, operator: string, target: string): boolean {
    const dateValue = new Date(value);
    const targetDate = new Date(target);

    switch (operator) {
      case 'after':
        return dateValue > targetDate;
      case 'before':
        return dateValue < targetDate;
      case 'between':
        const [start, end] = target.split(',');
        return dateValue >= new Date(start) && dateValue <= new Date(end);
      default:
        return false;
    }
  }
} 