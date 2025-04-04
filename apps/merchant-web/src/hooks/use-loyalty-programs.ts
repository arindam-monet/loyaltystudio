import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import { useMerchantStore } from '@/lib/stores/merchant-store';
import { useAuthStore } from '@/lib/stores/auth-store';

interface LoyaltyProgram {
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
}

export function useLoyaltyPrograms() {
  const queryClient = useQueryClient();
  const { selectedMerchant } = useMerchantStore();
  const { token } = useAuthStore();

  const { data: loyaltyPrograms, isLoading } = useQuery({
    queryKey: ['loyalty-programs', selectedMerchant?.id],
    queryFn: async () => {
      if (!selectedMerchant) return [];
      const response = await apiClient.get<LoyaltyProgram[]>('/loyalty-programs');
      if (response.status !== 200) {
        throw new Error('Failed to fetch loyalty programs');
      }
      return response.data;
    },
    enabled: !!selectedMerchant && !!token,
  });

  const createLoyaltyProgram = useMutation({
    mutationFn: async (data: any) => {
      if (!selectedMerchant) {
        console.error('No merchant selected');
        throw new Error('No merchant selected. Please select a merchant first.');
      }

      if (!data.merchantId && !selectedMerchant.id) {
        console.error('Missing merchantId', { data, selectedMerchant });
        throw new Error('Missing merchant ID. Please try again or contact support.');
      }

      // Ensure merchantId is set and is a valid string
      const programData = {
        ...data,
        merchantId: data.merchantId || selectedMerchant.id,
      };

      console.log('Creating loyalty program with data:', programData);

      try {
        const response = await apiClient.post<LoyaltyProgram>('/loyalty-programs', programData);

        if (response.status !== 201) {
          throw new Error('Failed to create loyalty program');
        }
        return response.data;
      } catch (error: any) {
        console.error('API error creating loyalty program:', error.response?.data || error.message);
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['loyalty-programs'] });
    },
  });

  const updateLoyaltyProgram = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<LoyaltyProgram> }) => {
      const response = await apiClient.patch<LoyaltyProgram>(`/loyalty-programs/${id}`, data);
      if (response.status !== 200) {
        throw new Error('Failed to update loyalty program');
      }
      return response.data;
    },
    onSuccess: (data, variables) => {
      console.log('Update successful:', data);
      // Invalidate both the list and the individual program queries
      queryClient.invalidateQueries({ queryKey: ['loyalty-programs'] });
      queryClient.invalidateQueries({ queryKey: ['loyalty-program', variables.id] });
    },
  });

  const deleteLoyaltyProgram = useMutation({
    mutationFn: async (id: string) => {
      const response = await apiClient.delete(`/loyalty-programs/${id}`);
      if (response.status !== 200 && response.status !== 204) {
        throw new Error('Failed to delete loyalty program');
      }
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