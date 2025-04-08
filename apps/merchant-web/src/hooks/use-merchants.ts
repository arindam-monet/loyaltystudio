import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import { useAuthStore } from '@/lib/stores/auth-store';

export interface Merchant {
  id: string;
  name: string;
  description?: string;
  industry?: string;
  website?: string;
  contactEmail?: string;
  contactPhone?: string;
  subdomain?: string;
  isDefault: boolean;
  address?: {
    street?: string;
    city?: string;
    state?: string;
    postalCode?: string;
    country?: string;
  };
  branding?: {
    logoUrl?: string;
    primaryColor?: string;
    primaryTextColor?: string;
    secondaryColor?: string;
    secondaryTextColor?: string;
    accentColor?: string;
    accentTextColor?: string;
  };
  createdAt: string;
  updatedAt: string;
}

export function useMerchants() {
  const { token } = useAuthStore();
  const queryClient = useQueryClient();

  const { data, isLoading, error } = useQuery({
    queryKey: ['merchants'],
    queryFn: async () => {
      if (!token) {
        throw new Error('Not authenticated');
      }
      const response = await apiClient.get<Merchant[]>('/merchants');
      return response.data;
    },
    enabled: !!token, // Only fetch if we have a token
    retry: false, // Don't retry on error
  });

  const createMerchant = useMutation({
    mutationFn: async (merchantData: Partial<Merchant>) => {
      if (!token) {
        throw new Error('Not authenticated');
      }
      const response = await apiClient.post<Merchant>('/merchants', merchantData);
      return response.data;
    },
    onSuccess: () => {
      // Invalidate the merchants query to refetch the data
      queryClient.invalidateQueries({ queryKey: ['merchants'] });
    },
  });

  // Get a single merchant by ID
  const getMerchant = (id: string) => {
    return useQuery({
      queryKey: ['merchant', id],
      queryFn: async () => {
        if (!token) {
          throw new Error('Not authenticated');
        }
        console.log(`Fetching merchant with ID ${id}`);
        const response = await apiClient.get<Merchant>(`/merchants/${id}`);
        console.log('Merchant data:', response.data);
        return response.data;
      },
      enabled: !!token && !!id,
      retry: false,
    });
  };

  const updateMerchant = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<Merchant> }) => {
      if (!token) {
        throw new Error('Not authenticated');
      }
      console.log(`Updating merchant with ID ${id}:`, data);

      try {
        // Use PATCH to update the merchant
        const response = await apiClient.patch<Merchant>(`/merchants/${id}`, data);
        console.log('Update response:', response.data);
        return response.data;
      } catch (error) {
        console.error('Failed to update merchant:', error);
        throw error;
      }
    },
    onSuccess: (updatedMerchant) => {
      // Invalidate the merchants query to refetch the data
      queryClient.invalidateQueries({ queryKey: ['merchants'] });

      // Also update the individual merchant in the cache
      queryClient.setQueryData(['merchant', updatedMerchant.id], updatedMerchant);
    },
  });

  const deleteMerchant = useMutation({
    mutationFn: async (id: string) => {
      if (!token) {
        throw new Error('Not authenticated');
      }
      await apiClient.delete(`/merchants/${id}`);
      return id;
    },
    onSuccess: (deletedId) => {
      // Invalidate the merchants query to refetch the data
      queryClient.invalidateQueries({ queryKey: ['merchants'] });

      // Remove the deleted merchant from the cache
      queryClient.removeQueries({ queryKey: ['merchant', deletedId] });
    },
  });

  return {
    data,
    isLoading,
    error,
    getMerchant,
    createMerchant,
    updateMerchant,
    deleteMerchant,
  };
}