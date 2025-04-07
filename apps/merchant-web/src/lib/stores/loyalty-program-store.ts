import { create } from 'zustand';

export interface LoyaltyProgram {
  id: string;
  name: string;
  description: string;
  settings: {
    pointsName: string;
    currency: string;
    timezone: string;
  };
  isActive: boolean;
  merchantId: string;
  tiers?: Array<{
    id: string;
    name: string;
    description?: string;
    pointsThreshold: number;
    benefits?: Record<string, any>;
  }>;
  rewards?: Array<{
    id: string;
    name: string;
    description: string;
    type: "PHYSICAL" | "DIGITAL" | "EXPERIENCE" | "COUPON";
    pointsCost: number;
    stock?: number;
    validityPeriod?: number;
    redemptionLimit?: number;
    conditions?: Record<string, any>;
  }>;
  rules?: any[];
}

interface LoyaltyProgramStore {
  selectedProgram: LoyaltyProgram | null;
  setSelectedProgram: (program: LoyaltyProgram | null) => void;
}

export const useLoyaltyProgramStore = create<LoyaltyProgramStore>((set) => ({
  selectedProgram: null,
  setSelectedProgram: (program) => set({ selectedProgram: program }),
}));
