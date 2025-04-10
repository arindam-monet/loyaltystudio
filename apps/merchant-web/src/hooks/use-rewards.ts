import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import { Reward } from '@/lib/stores/reward-store';
import { useMerchantStore } from '@/lib/stores/merchant-store';
import { useAuthStore } from '@/lib/stores/auth-store';

export function useRewards(loyaltyProgramId?: string) {
  const queryClient = useQueryClient();
  const { selectedMerchant } = useMerchantStore();
  const { token } = useAuthStore();

  const { data: rewards = [], isLoading } = useQuery({
    queryKey: ['rewards', selectedMerchant?.id, loyaltyProgramId],
    queryFn: async () => {
      if (!selectedMerchant?.id || !token || !loyaltyProgramId) {
        throw new Error('No merchant selected, not authenticated, or no loyalty program ID provided');
      }
      const response = await apiClient.get('/rewards', {
        params: { loyaltyProgramId }
      });
      return response.data;
    },
    enabled: !!selectedMerchant?.id && !!token && !!loyaltyProgramId,
  });

  const createReward = useMutation({
    mutationFn: async (data: Omit<Reward, 'id' | 'createdAt' | 'updatedAt'>) => {
      if (!selectedMerchant?.id || !token || !loyaltyProgramId) {
        throw new Error('No merchant selected, not authenticated, or no loyalty program ID provided');
      }
      // Ensure loyaltyProgramId is included in the request
      const rewardData = {
        ...data,
        loyaltyProgramId
      };
      const response = await apiClient.post('/rewards', rewardData);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rewards', selectedMerchant?.id, loyaltyProgramId] });
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
      queryClient.invalidateQueries({ queryKey: ['rewards', selectedMerchant?.id, loyaltyProgramId] });
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
      queryClient.invalidateQueries({ queryKey: ['rewards', selectedMerchant?.id, loyaltyProgramId] });
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