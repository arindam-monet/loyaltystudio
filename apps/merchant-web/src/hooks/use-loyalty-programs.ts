import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useApiAuth } from './use-api-auth';
import { useMerchantStore } from '@/lib/stores/merchant-store';

export function useLoyaltyPrograms() {
  const { apiClient } = useApiAuth();
  const queryClient = useQueryClient();
  const { selectedMerchant } = useMerchantStore();

  const { data: loyaltyPrograms, isLoading } = useQuery({
    queryKey: ['loyalty-programs', selectedMerchant?.id],
    queryFn: async () => {
      if (!selectedMerchant) return [];
      const response = await apiClient.get('/loyalty-programs');
      return response.data;
    },
    enabled: !!selectedMerchant,
  });

  const createLoyaltyProgram = useMutation({
    mutationFn: async (data: any) => {
      if (!selectedMerchant) throw new Error('No merchant selected');
      const response = await apiClient.post('/loyalty-programs', {
        ...data,
        merchantId: selectedMerchant.id,
      });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['loyalty-programs'] });
    },
  });

  const updateLoyaltyProgram = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      const response = await apiClient.patch(`/loyalty-programs/${id}`, data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['loyalty-programs'] });
    },
  });

  const deleteLoyaltyProgram = useMutation({
    mutationFn: async (id: string) => {
      await apiClient.delete(`/loyalty-programs/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['loyalty-programs'] });
    },
  });

  return {
    loyaltyPrograms,
    isLoading,
    createLoyaltyProgram,
    updateLoyaltyProgram,
    deleteLoyaltyProgram,
  };
} 