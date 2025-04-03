import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import { Tier } from '@/lib/stores/tier-store';
import { useMerchantStore } from '@/lib/stores/merchant-store';
import { useAuthStore } from '@/lib/stores/auth-store';

export function useTiers() {
  const queryClient = useQueryClient();
  const { selectedMerchant } = useMerchantStore();
  const { token } = useAuthStore();

  const { data: tiers = [], isLoading } = useQuery({
    queryKey: ['tiers', selectedMerchant?.id],
    queryFn: async () => {
      if (!selectedMerchant?.id || !token) {
        throw new Error('No merchant selected or not authenticated');
      }
      const response = await apiClient.get('/tiers');
      return response.data;
    },
    enabled: !!selectedMerchant?.id && !!token,
  });

  const createTier = useMutation({
    mutationFn: async (data: Omit<Tier, 'id' | 'createdAt' | 'updatedAt'>) => {
      if (!selectedMerchant?.id || !token) {
        throw new Error('No merchant selected or not authenticated');
      }
      const response = await apiClient.post('/tiers', data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tiers', selectedMerchant?.id] });
    },
  });

  const updateTier = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<Tier> }) => {
      if (!selectedMerchant?.id || !token) {
        throw new Error('No merchant selected or not authenticated');
      }
      const response = await apiClient.patch(`/tiers/${id}`, data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tiers', selectedMerchant?.id] });
    },
  });

  const deleteTier = useMutation({
    mutationFn: async (id: string) => {
      if (!selectedMerchant?.id || !token) {
        throw new Error('No merchant selected or not authenticated');
      }
      await apiClient.delete(`/tiers/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tiers', selectedMerchant?.id] });
    },
  });

  return {
    tiers,
    isLoading,
    createTier,
    updateTier,
    deleteTier,
  };
} 