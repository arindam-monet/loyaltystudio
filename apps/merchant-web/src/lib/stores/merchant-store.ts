import { create } from 'zustand';

export interface Merchant {
  id: string;
  name: string;
  description?: string;
  industry?: string;
  website?: string;
  subdomain?: string;
  isDefault?: boolean;
  branding?: {
    logo?: string;
    primaryColor?: string;
    secondaryColor?: string;
  };
  createdAt: string | Date;
  updatedAt: string | Date;
}

interface MerchantStore {
  selectedMerchant: Merchant | null;
  setSelectedMerchant: (merchant: Merchant | null) => void;
}

export const useMerchantStore = create<MerchantStore>((set) => ({
  selectedMerchant: null,
  setSelectedMerchant: (merchant) => set({ selectedMerchant: merchant }),
}));