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
        tier: {
          loyaltyProgramId: campaign.loyaltyProgramId
        }
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
    // Assuming targetTierIds is stored in campaign.metadata
    const campaignData = campaign as any;
    if (campaignData?.metadata?.targetTierIds &&
      Array.isArray(campaignData.metadata.targetTierIds) &&
      campaignData.metadata.targetTierIds.length > 0) {
      if (!member.tierId || !campaignData.metadata.targetTierIds.includes(member.tierId)) {
        return {
          isEligible: false,
          reasons: ['Not eligible for this tier'],
          matchedRules: [],
        };
      }
    }

    // Evaluate campaign rules
    // Assuming rules are stored in campaign.conditions
    const rules = (campaign.conditions as any)?.rules || [];
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
            tier: {
              loyaltyProgramId
            }
          },
        });
        return member?.pointsBalance >= rule.threshold;

      case 'PURCHASE_HISTORY':
        // Purchase model doesn't exist yet, so we'll return false
        // This would need to be implemented once the Purchase model is added to the schema
        /*
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
        */
        console.warn('Purchase model not implemented yet');
        return false;

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
        status: 'ACTIVE',
        metadata: {
          matchedRules: eligibility.matchedRules,
          joinedAt: new Date().toISOString() // Store as metadata since joinedAt is not a field
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
    // Assuming rules are stored in campaign.conditions
    const rules = (campaign.conditions as any)?.rules || [];
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

    // Extract joinedAt from metadata
    const metadata = participant.metadata as any;
    const joinedAt = metadata?.joinedAt ? new Date(metadata.joinedAt) : new Date();

    return {
      campaignId,
      status: participant.status,
      joinedAt,
      progress,
      totalProgress: progress.length > 0 ? (progress.filter(p => p.completed).length / progress.length) * 100 : 0,
    };
  }
}