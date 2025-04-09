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
      try {
        console.log(`Updating loyalty program ${id} with data:`, data);
        const response = await apiClient.patch<LoyaltyProgram>(`/loyalty-programs/${id}`, data);
        console.log('Update response:', response);
        return response.data;
      } catch (error) {
        console.error('Error updating loyalty program:', error);
        throw error;
      }
    },
    onSuccess: (data, variables) => {
      console.log('Update successful:', data);
      // Invalidate both the list and the individual program queries
      queryClient.invalidateQueries({ queryKey: ['loyalty-programs'] });
      queryClient.invalidateQueries({ queryKey: ['loyalty-program', variables.id] });
    },
    onError: (error) => {
      console.error('Mutation error:', error);
    }
  });

  const deleteLoyaltyProgram = useMutation({
    mutationFn: async (id: string) => {
      try {
        console.log(`Deleting loyalty program with ID: ${id}`);

        // Use fetch API with specific options to avoid Content-Type issues
        const token = useAuthStore.getState().token;
        const selectedMerchant = useMerchantStore.getState().selectedMerchant;

        // Create headers without Content-Type
        const headers = new Headers();
        headers.append('Authorization', `Bearer ${token}`);

        // Add merchant ID to headers if available
        if (selectedMerchant?.id) {
          headers.append('X-Merchant-ID', selectedMerchant.id);
        }

        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/loyalty-programs/${id}`, {
          method: 'DELETE',
          headers: headers,
          // Don't include a body
        });

        console.log('Delete response status:', response.status);

        if (response.status >= 200 && response.status < 300) {
          return {}; // Return empty object for successful deletion
        } else {
          let errorMessage = 'Failed to delete loyalty program';
          try {
            const errorData = await response.json();
            errorMessage = errorData.error || errorData.message || errorMessage;
          } catch (e) {
            // Ignore JSON parse error
          }
          throw new Error(errorMessage);
        }
      } catch (error: any) {
        console.error('Error deleting loyalty program:', error);

        // Provide more specific error messages based on the error
        if (error.message && error.message.includes('foreign key constraint')) {
          throw new Error('Cannot delete this loyalty program because it has related data. Please delete all associated members, rewards, and tiers first.');
        } else if (error.message && error.message.includes('not found')) {
          throw new Error('The loyalty program could not be found. It may have been already deleted.');
        } else if (error.message && error.message.includes('permission')) {
          throw new Error('You do not have permission to delete this loyalty program.');
        } else {
          throw new Error(error.message || 'Failed to delete loyalty program. Please try again later.');
        }
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