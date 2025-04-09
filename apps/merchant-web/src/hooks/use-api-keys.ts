import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useMemo } from 'react';
import { apiClient } from '@/lib/api-client';
import { useAuthStore } from '@/lib/stores/auth-store';

export interface ApiKey {
  id: string;
  key: string;
  name: string;
  isActive: boolean;
  environment: 'test' | 'production';
  createdAt: string;
  lastUsedAt: string | null;
  expiresAt: string | null;
}

export interface ApiKeyUsageStats {
  totalRequests: number;
  successRate: number;
  averageDuration: number;
  endpoints: Record<string, number>;
}

export interface CreateApiKeyRequest {
  name: string;
  environment: 'test' | 'production';
  merchantId: string; // Add merchantId to the request
  expiresIn?: number; // in days, null for never
}

export interface CreateApiKeyResponse {
  data: {
    key: string;
    name: string;
  };
}

export function useApiKeys() {
  const { token } = useAuthStore();
  const queryClient = useQueryClient();

  // Get all API keys
  const getApiKeys = useQuery({
    queryKey: ['api-keys'],
    queryFn: async () => {
      if (!token) {
        throw new Error('Not authenticated');
      }

      // Get the selected merchant ID from the store
      const merchantStore = await import('@/lib/stores/merchant-store');
      const selectedMerchant = merchantStore.useMerchantStore.getState().selectedMerchant;

      if (!selectedMerchant) {
        console.warn('No merchant selected, cannot fetch API keys');
        return [];
      }

      const response = await apiClient.get<{ data: ApiKey[] }>('/api/api-keys', {
        params: { merchantId: selectedMerchant.id }
      });
      return response.data.data || [];
    },
    enabled: !!token,
  });

  // Filter API keys by environment
  const testApiKeys = useMemo(() => {
    return (getApiKeys.data || []).filter(key => key.environment === 'test');
  }, [getApiKeys.data]);

  const productionApiKeys = useMemo(() => {
    return (getApiKeys.data || []).filter(key => key.environment === 'production');
  }, [getApiKeys.data]);

  // Get API key usage statistics
  const getApiKeyStats = useQuery({
    queryKey: ['api-key-stats'],
    queryFn: async () => {
      if (!token) {
        throw new Error('Not authenticated');
      }

      // Get the selected merchant ID from the store
      const merchantStore = await import('@/lib/stores/merchant-store');
      const selectedMerchant = merchantStore.useMerchantStore.getState().selectedMerchant;

      if (!selectedMerchant) {
        console.warn('No merchant selected, cannot fetch API key stats');
        throw new Error('No merchant selected');
      }

      const response = await apiClient.get<{ data: ApiKeyUsageStats }>('/api/api-keys/stats', {
        params: {
          timeWindow: '30d',
          merchantId: selectedMerchant.id
        },
      });
      return response.data.data;
    },
    enabled: !!token,
  });

  // Create a new API key
  const createApiKey = useMutation({
    mutationFn: async (data: CreateApiKeyRequest) => {
      if (!token) {
        throw new Error('Not authenticated');
      }
      const response = await apiClient.post<CreateApiKeyResponse>('/api/api-keys', data);
      return response.data.data;
    },
    onSuccess: () => {
      // Invalidate the API keys query to refetch the data
      queryClient.invalidateQueries({ queryKey: ['api-keys'] });
    },
  });

  // Revoke an API key
  const revokeApiKey = useMutation({
    mutationFn: async (keyId: string) => {
      if (!token) {
        throw new Error('Not authenticated');
      }

      // Get the selected merchant ID from the store
      const merchantStore = await import('@/lib/stores/merchant-store');
      const selectedMerchant = merchantStore.useMerchantStore.getState().selectedMerchant;

      if (!selectedMerchant) {
        throw new Error('No merchant selected');
      }

      await apiClient.delete(`/api/api-keys/${keyId}`, {
        params: { merchantId: selectedMerchant.id }
      });
    },
    onSuccess: () => {
      // Invalidate the API keys query to refetch the data
      queryClient.invalidateQueries({ queryKey: ['api-keys'] });
    },
  });

  return {
    apiKeys: getApiKeys.data || [],
    testApiKeys,
    productionApiKeys,
    isLoadingApiKeys: getApiKeys.isLoading,
    apiKeysError: getApiKeys.error,
    refetchApiKeys: getApiKeys.refetch,

    apiKeyStats: getApiKeyStats.data,
    isLoadingApiKeyStats: getApiKeyStats.isLoading,
    apiKeyStatsError: getApiKeyStats.error,
    refetchApiKeyStats: getApiKeyStats.refetch,

    createApiKey,
    revokeApiKey,
  };
}
