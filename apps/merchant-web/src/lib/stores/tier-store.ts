import { create } from 'zustand';

export interface Tier {
  id: string;
  name: string;
  description: string;
  pointsThreshold: number;
  benefits: {
    pointsMultiplier?: number;
    exclusiveRewards?: string[];
    specialDiscounts?: {
      percentage: number;
      categories?: string[];
    };
    prioritySupport?: boolean;
  };
  requirements: {
    minimumSpend?: number;
    minimumOrders?: number;
    timeInProgram?: number; // in months
  };
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

interface TierStore {
  selectedTier: Tier | null;
  setSelectedTier: (tier: Tier | null) => void;
}

export const useTierStore = create<TierStore>((set) => ({
  selectedTier: null,
  setSelectedTier: (tier) => set({ selectedTier: tier }),
})); 