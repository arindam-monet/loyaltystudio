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

      try {
        console.log(`Updating tier with ID: ${id}`, data);

        // Use fetch API with specific options to avoid Content-Type issues
        const token = useAuthStore.getState().token;

        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/program-tiers/${id}`, {
          method: 'PATCH',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(data)
        });

        console.log('Update response status:', response.status);

        if (response.status >= 200 && response.status < 300) {
          return await response.json();
        } else {
          let errorMessage = 'Failed to update tier';
          try {
            const errorData = await response.json();
            errorMessage = errorData.error || errorData.message || errorMessage;
          } catch (e) {
            // Ignore JSON parse error
          }
          throw new Error(errorMessage);
        }
      } catch (error: any) {
        console.error('Error updating tier:', error);
        throw new Error(error.message || 'Failed to update tier. Please try again later.');
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

      try {
        console.log(`Deleting tier with ID: ${id}`);

        // Use fetch API with specific options to avoid Content-Type issues
        const token = useAuthStore.getState().token;

        // Create headers without Content-Type
        const headers = new Headers();
        headers.append('Authorization', `Bearer ${token}`);

        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/program-tiers/${id}`, {
          method: 'DELETE',
          headers: headers,
          // Don't include a body
        });

        console.log('Delete response status:', response.status);

        if (response.status >= 200 && response.status < 300) {
          return {}; // Return empty object for successful deletion
        } else {
          let errorMessage = 'Failed to delete tier';
          try {
            const errorData = await response.json();
            errorMessage = errorData.error || errorData.message || errorMessage;
          } catch (e) {
            // Ignore JSON parse error
          }
          throw new Error(errorMessage);
        }
      } catch (error: any) {
        console.error('Error deleting tier:', error);
        throw new Error(error.message || 'Failed to delete tier. Please try again later.');
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