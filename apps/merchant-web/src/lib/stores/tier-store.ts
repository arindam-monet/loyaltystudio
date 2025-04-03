import { create } from 'zustand';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useApiAuth } from '@/hooks/use-api-auth';

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
  tiers: Tier[];
  selectedTier: Tier | null;
  setSelectedTier: (tier: Tier | null) => void;
  createTier: ReturnType<typeof useMutation>;
  updateTier: ReturnType<typeof useMutation>;
  deleteTier: ReturnType<typeof useMutation>;
}

export const useTierStore = create<TierStore>((set, get) => {
  const { apiClient } = useApiAuth();
  const queryClient = useQueryClient();

  const { data: tiers = [] } = useQuery({
    queryKey: ['tiers'],
    queryFn: async () => {
      const response = await apiClient.get('/tiers');
      return response.data;
    },
  });

  const createTier = useMutation({
    mutationFn: async (data: Omit<Tier, 'id' | 'createdAt' | 'updatedAt'>) => {
      const response = await apiClient.post('/tiers', data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tiers'] });
    },
  });

  const updateTier = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<Tier> }) => {
      const response = await apiClient.patch(`/tiers/${id}`, data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tiers'] });
    },
  });

  const deleteTier = useMutation({
    mutationFn: async (id: string) => {
      await apiClient.delete(`/tiers/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tiers'] });
    },
  });

  return {
    tiers,
    selectedTier: null,
    setSelectedTier: (tier) => set({ selectedTier: tier }),
    createTier,
    updateTier,
    deleteTier,
  };
}); 