import { create } from 'zustand';

export interface Merchant {
  id: string;
  name: string;
  description?: string;
  industry?: string;
  website?: string;
  contactEmail?: string;
  contactPhone?: string;
  subdomain?: string;
  isDefault?: boolean;
  address?: {
    street?: string;
    city?: string;
    state?: string;
    postalCode?: string;
    country?: string;
  };
  branding?: {
    logoUrl?: string;
    logo?: string; // For backward compatibility
    primaryColor?: string;
    primaryTextColor?: string;
    secondaryColor?: string;
    secondaryTextColor?: string;
    accentColor?: string;
    accentTextColor?: string;
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