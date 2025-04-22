import { create } from 'zustand';

export interface Campaign {
  id: string;
  name: string;
  description: string;
  type: 'POINTS_MULTIPLIER' | 'BONUS_POINTS' | 'SPECIAL_REWARD';
  startDate: string;
  endDate?: string;
  conditions?: Record<string, any>;
  rewards?: Record<string, any>;
  isActive: boolean;
  loyaltyProgramId: string;
  createdAt?: Date;
  updatedAt?: Date;
}

interface CampaignStore {
  selectedCampaign: Campaign | null;
  setSelectedCampaign: (campaign: Campaign | null) => void;
}

export const useCampaignStore = create<CampaignStore>((set) => ({
  selectedCampaign: null,
  setSelectedCampaign: (campaign) => set({ selectedCampaign: campaign }),
}));
