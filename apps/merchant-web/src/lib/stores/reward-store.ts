import { create } from 'zustand';

export interface Reward {
  id: string;
  name: string;
  description: string;
  type: 'PHYSICAL' | 'DIGITAL' | 'EXPERIENCE' | 'COUPON';
  pointsCost: number;
  stock?: number;
  validityPeriod?: number;
  redemptionLimit?: number;
  conditions?: Record<string, any>;
  metadata?: Record<string, any>;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

interface RewardStore {
  selectedReward: Reward | null;
  setSelectedReward: (reward: Reward | null) => void;
}

export const useRewardStore = create<RewardStore>((set) => ({
  selectedReward: null,
  setSelectedReward: (reward) => set({ selectedReward: reward }),
})); 