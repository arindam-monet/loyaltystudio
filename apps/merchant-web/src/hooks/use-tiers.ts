import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import { Tier } from '@/lib/stores/tier-store';
import { useAuthStore } from '@/lib/stores/auth-store';

// Import the store from the relative path
import { useLoyaltyProgramStore } from '../lib/stores/loyalty-program-store';

export function useTiers(programId?: string) {
  const queryClient = useQueryClient();
  const { token } = useAuthStore();
  const { selectedProgram } = useLoyaltyProgramStore();

  // Use provided programId or fall back to selectedProgram.id
  const loyaltyProgramId = programId || selectedProgram?.id;

  const { data: tiers = [], isLoading } = useQuery({
    queryKey: ['program-tiers', loyaltyProgramId],
    queryFn: async () => {
      if (!loyaltyProgramId || !token) {
        return [];
      }
      const response = await apiClient.get('/program-tiers', {
        params: { loyaltyProgramId }
      });
      return response.data;
    },
    enabled: !!loyaltyProgramId && !!token,
  });

  const createTier = useMutation({
    mutationFn: async (data: Omit<Tier, 'id' | 'createdAt' | 'updatedAt'>) => {
      if (!loyaltyProgramId || !token) {
        throw new Error('No loyalty program selected or not authenticated');
      }
      const response = await apiClient.post('/program-tiers', {
        ...data,
        loyaltyProgramId
      });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['program-tiers', loyaltyProgramId] });
    },
  });

  const updateTier = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<Tier> }) => {
      if (!loyaltyProgramId || !token) {
        throw new Error('No loyalty program selected or not authenticated');
      }

      console.log(`Updating tier with ID: ${id}`, data);

      try {
        const response = await apiClient.patch(`/program-tiers/${id}`, data);
        console.log('Update response:', response);
        return response.data;
      } catch (error: any) {
        console.error('Error updating tier:', error);
        throw new Error(error.response?.data?.error || error.message || 'Failed to update tier');
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['program-tiers', loyaltyProgramId] });
    },
  });

  const deleteTier = useMutation({
    mutationFn: async (id: string) => {
      if (!loyaltyProgramId || !token) {
        throw new Error('No loyalty program selected or not authenticated');
      }

      console.log(`Deleting tier with ID: ${id}`);

      try {
        // Use axios with default configuration
        const response = await apiClient.delete(`/program-tiers/${id}`);
        console.log('Delete response:', response);
        return {}; // Return empty object for successful deletion
      } catch (error: any) {
        console.error('Error deleting tier:', error);
        throw new Error(error.response?.data?.error || error.message || 'Failed to delete tier');
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['program-tiers', loyaltyProgramId] });
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