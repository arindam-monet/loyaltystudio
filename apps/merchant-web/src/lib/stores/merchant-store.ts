import { create } from 'zustand';

export interface Merchant {
  id: string;
  name: string;
  domain: string;
  createdAt: Date;
  updatedAt: Date;
}

interface MerchantStore {
  selectedMerchant: Merchant | null;
  setSelectedMerchant: (merchant: Merchant | null) => void;
}

export const useMerchantStore = create<MerchantStore>((set) => ({
  selectedMerchant: null,
  setSelectedMerchant: (merchant) => set({ selectedMerchant: merchant }),
})); 