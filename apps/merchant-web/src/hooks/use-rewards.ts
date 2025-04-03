import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import { Reward } from '@/lib/stores/reward-store';
import { useMerchantStore } from '@/lib/stores/merchant-store';
import { useAuthStore } from '@/lib/stores/auth-store';

export function useRewards() {
  const queryClient = useQueryClient();
  const { selectedMerchant } = useMerchantStore();
  const { token } = useAuthStore();

  const { data: rewards = [], isLoading } = useQuery({
    queryKey: ['rewards', selectedMerchant?.id],
    queryFn: async () => {
      if (!selectedMerchant?.id || !token) {
        throw new Error('No merchant selected or not authenticated');
      }
      const response = await apiClient.get('/rewards');
      return response.data;
    },
    enabled: !!selectedMerchant?.id && !!token,
  });

  const createReward = useMutation({
    mutationFn: async (data: Omit<Reward, 'id' | 'createdAt' | 'updatedAt'>) => {
      if (!selectedMerchant?.id || !token) {
        throw new Error('No merchant selected or not authenticated');
      }
      const response = await apiClient.post('/rewards', data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rewards', selectedMerchant?.id] });
    },
  });

  const updateReward = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<Reward> }) => {
      if (!selectedMerchant?.id || !token) {
        throw new Error('No merchant selected or not authenticated');
      }
      const response = await apiClient.patch(`/rewards/${id}`, data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rewards', selectedMerchant?.id] });
    },
  });

  const deleteReward = useMutation({
    mutationFn: async (id: string) => {
      if (!selectedMerchant?.id || !token) {
        throw new Error('No merchant selected or not authenticated');
      }
      await apiClient.delete(`/rewards/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rewards', selectedMerchant?.id] });
    },
  });

  return {
    rewards,
    isLoading,
    createReward,
    updateReward,
    deleteReward,
  };
} 