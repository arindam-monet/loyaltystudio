import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import { useAuthStore } from '@/lib/stores/auth-store';

export interface ApiKey {
  id: string;
  key: string;
  name: string;
  isActive: boolean;
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
      const response = await apiClient.get<{ data: ApiKey[] }>('/api-keys');
      return response.data.data || [];
    },
    enabled: !!token,
  });

  // Get API key usage statistics
  const getApiKeyStats = useQuery({
    queryKey: ['api-key-stats'],
    queryFn: async () => {
      if (!token) {
        throw new Error('Not authenticated');
      }
      const response = await apiClient.get<{ data: ApiKeyUsageStats }>('/api-keys/stats', {
        params: { timeWindow: '30d' },
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
      const response = await apiClient.post<CreateApiKeyResponse>('/api-keys', data);
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
      await apiClient.delete(`/api-keys/${keyId}`);
    },
    onSuccess: () => {
      // Invalidate the API keys query to refetch the data
      queryClient.invalidateQueries({ queryKey: ['api-keys'] });
    },
  });

  return {
    apiKeys: getApiKeys.data || [],
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
