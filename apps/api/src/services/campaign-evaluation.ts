import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

interface CampaignEligibilityResult {
  isEligible: boolean;
  reasons: string[];
  matchedRules: any[];
}

export class CampaignEvaluationService {
  async evaluateCampaignEligibility(
    userId: string,
    campaignId: string
  ): Promise<CampaignEligibilityResult> {
    const campaign = await prisma.campaign.findUnique({
      where: { id: campaignId },
      include: {
        loyaltyProgram: true,
      },
    });

    if (!campaign) {
      throw new Error('Campaign not found');
    }

    // Check if campaign is active
    if (!campaign.isActive) {
      return {
        isEligible: false,
        reasons: ['Campaign is not active'],
        matchedRules: [],
      };
    }

    // Check campaign dates
    const now = new Date();
    if (now < campaign.startDate) {
      return {
        isEligible: false,
        reasons: ['Campaign has not started yet'],
        matchedRules: [],
      };
    }

    if (campaign.endDate && now > campaign.endDate) {
      return {
        isEligible: false,
        reasons: ['Campaign has ended'],
        matchedRules: [],
      };
    }

    // Get member's current tier
    const member = await prisma.programMember.findFirst({
      where: {
        userId,
        loyaltyProgramId: campaign.loyaltyProgramId,
      },
      include: {
        tier: true,
      },
    });

    if (!member) {
      return {
        isEligible: false,
        reasons: ['Not a member of the loyalty program'],
        matchedRules: [],
      };
    }

    // Check tier eligibility
    if (campaign.targetTierIds && campaign.targetTierIds.length > 0) {
      if (!member.tierId || !campaign.targetTierIds.includes(member.tierId)) {
        return {
          isEligible: false,
          reasons: ['Not eligible for this tier'],
          matchedRules: [],
        };
      }
    }

    // Evaluate campaign rules
    const rules = campaign.rules as any[];
    const matchedRules = [];
    const reasons = [];

    for (const rule of rules) {
      const matches = await this.evaluateRule(rule, userId, campaign.loyaltyProgramId);
      if (matches) {
        matchedRules.push(rule);
      } else {
        reasons.push(`Rule not matched: ${rule.name}`);
      }
    }

    return {
      isEligible: matchedRules.length > 0,
      reasons: reasons.length > 0 ? reasons : ['All rules matched'],
      matchedRules,
    };
  }

  private async evaluateRule(rule: any, userId: string, loyaltyProgramId: string): Promise<boolean> {
    switch (rule.type) {
      case 'POINTS_THRESHOLD':
        const member = await prisma.programMember.findFirst({
          where: {
            userId,
            loyaltyProgramId,
          },
        });
        return member?.points >= rule.threshold;

      case 'PURCHASE_HISTORY':
        const purchases = await prisma.purchase.findMany({
          where: {
            userId,
            loyaltyProgramId,
            createdAt: {
              gte: new Date(Date.now() - rule.timeframe * 24 * 60 * 60 * 1000),
            },
          },
        });
        return purchases.length >= rule.minPurchases;

      case 'SEGMENT_MEMBERSHIP':
        const segment = await prisma.segment.findFirst({
          where: {
            id: rule.segmentId,
            loyaltyProgramId,
          },
        });
        if (!segment) return false;

        const membership = await prisma.segmentMember.findFirst({
          where: {
            segmentId: segment.id,
            userId,
          },
        });
        return !!membership;

      default:
        return false;
    }
  }

  async addParticipant(userId: string, campaignId: string): Promise<void> {
    const eligibility = await this.evaluateCampaignEligibility(userId, campaignId);

    if (!eligibility.isEligible) {
      throw new Error(`Not eligible for campaign: ${eligibility.reasons.join(', ')}`);
    }

    await prisma.campaignParticipant.create({
      data: {
        campaignId,
        userId,
        joinedAt: new Date(),
        status: 'ACTIVE',
        metadata: {
          matchedRules: eligibility.matchedRules,
        },
      },
    });
  }

  async removeParticipant(userId: string, campaignId: string): Promise<void> {
    await prisma.campaignParticipant.deleteMany({
      where: {
        campaignId,
        userId,
      },
    });
  }

  async getCampaignProgress(userId: string, campaignId: string) {
    const participant = await prisma.campaignParticipant.findFirst({
      where: {
        campaignId,
        userId,
      },
      include: {
        campaign: true,
      },
    });

    if (!participant) {
      throw new Error('Not participating in this campaign');
    }

    const campaign = participant.campaign;
    const rules = campaign.rules as any[];
    const progress = [];

    for (const rule of rules) {
      const matches = await this.evaluateRule(rule, userId, campaign.loyaltyProgramId);
      progress.push({
        ruleId: rule.id,
        name: rule.name,
        completed: matches,
        progress: matches ? 100 : 0,
      });
    }

    return {
      campaignId,
      status: participant.status,
      joinedAt: participant.joinedAt,
      progress,
      totalProgress: (progress.filter(p => p.completed).length / progress.length) * 100,
    };
  }
} 