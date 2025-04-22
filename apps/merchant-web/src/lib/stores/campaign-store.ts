import { create } from 'zustand';

export type CampaignRule = {
  id?: string;
  name: string;
  type: 'POINTS_THRESHOLD' | 'PURCHASE_HISTORY' | 'SEGMENT_MEMBERSHIP';
  threshold?: number;
  timeframe?: number;
  minPurchases?: number;
  segmentId?: string;
};

export interface Campaign {
  id: string;
  name: string;
  description: string;
  type: 'POINTS_MULTIPLIER' | 'BONUS_POINTS' | 'SPECIAL_REWARD';
  startDate: string;
  endDate?: string;
  conditions?: {
    rules?: CampaignRule[];
    targetTierIds?: string[];
    [key: string]: any;
  };
  rewards?: {
    pointsMultiplier?: number;
    bonusPoints?: number;
    rewardId?: string;
    [key: string]: any;
  };
  isActive: boolean;
  loyaltyProgramId: string;
  createdAt?: Date;
  updatedAt?: Date;
  participants?: any[];
}

interface CampaignStore {
  selectedCampaign: Campaign | null;
  setSelectedCampaign: (campaign: Campaign | null) => void;
}

export const useCampaignStore = create<CampaignStore>((set) => ({
  selectedCampaign: null,
  setSelectedCampaign: (campaign) => set({ selectedCampaign: campaign }),
}));
