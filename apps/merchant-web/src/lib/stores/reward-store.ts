import { create } from 'zustand';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useApiAuth } from '@/hooks/use-api-auth';

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
  rewards: Reward[];
  selectedReward: Reward | null;
  setSelectedReward: (reward: Reward | null) => void;
  createReward: ReturnType<typeof useMutation>;
  updateReward: ReturnType<typeof useMutation>;
  deleteReward: ReturnType<typeof useMutation>;
}

export const useRewardStore = create<RewardStore>((set, get) => {
  const { apiClient } = useApiAuth();
  const queryClient = useQueryClient();

  const { data: rewards = [] } = useQuery({
    queryKey: ['rewards'],
    queryFn: async () => {
      const response = await apiClient.get('/rewards');
      return response.data;
    },
  });

  const createReward = useMutation({
    mutationFn: async (data: Omit<Reward, 'id' | 'createdAt' | 'updatedAt'>) => {
      const response = await apiClient.post('/rewards', data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rewards'] });
    },
  });

  const updateReward = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<Reward> }) => {
      const response = await apiClient.patch(`/rewards/${id}`, data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rewards'] });
    },
  });

  const deleteReward = useMutation({
    mutationFn: async (id: string) => {
      await apiClient.delete(`/rewards/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rewards'] });
    },
  });

  return {
    rewards,
    selectedReward: null,
    setSelectedReward: (reward) => set({ selectedReward: reward }),
    createReward,
    updateReward,
    deleteReward,
  };
}); 