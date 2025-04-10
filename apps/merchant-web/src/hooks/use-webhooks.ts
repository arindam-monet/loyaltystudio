import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import { useAuthStore } from '@/lib/stores/auth-store';
import { useMerchantStore } from '@/lib/stores/merchant-store';

export interface Webhook {
  id: string;
  url: string;
  events: string[];
  description?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface WebhookDeliveryLog {
  id: string;
  webhookId: string;
  eventType: string;
  statusCode: number | null;
  successful: boolean;
  responseTime: number;
  createdAt: string;
  error?: string;
}

export interface CreateWebhookRequest {
  url: string;
  events: string[];
  description?: string;
}

export interface UpdateWebhookRequest {
  url?: string;
  events?: string[];
  description?: string;
  isActive?: boolean;
}

export interface TestWebhookRequest {
  eventType: string;
  payload?: Record<string, any>;
}

export interface TestWebhookResponse {
  success: boolean;
  statusCode: number;
  message: string;
}

export function useWebhooks() {
  const { token } = useAuthStore();
  const { selectedMerchant } = useMerchantStore();
  const queryClient = useQueryClient();

  // Get all webhooks
  const getWebhooks = useQuery({
    queryKey: ['webhooks'],
    queryFn: async () => {
      if (!token) {
        throw new Error('Not authenticated');
      }

      if (!selectedMerchant) {
        console.warn('No merchant selected, cannot fetch webhooks');
        return [];
      }

      const response = await apiClient.get<Webhook[]>('/webhooks');
      return response.data;
    },
    enabled: !!token && !!selectedMerchant,
  });

  // Get a specific webhook
  const getWebhook = (id: string) => {
    return useQuery({
      queryKey: ['webhook', id],
      queryFn: async () => {
        if (!token || !id) {
          throw new Error('Not authenticated or missing webhook ID');
        }

        const response = await apiClient.get<Webhook>(`/webhooks/${id}`);
        return response.data;
      },
      enabled: !!token && !!id,
    });
  };

  // Create a new webhook
  const createWebhook = useMutation({
    mutationFn: async (data: CreateWebhookRequest) => {
      if (!token) {
        throw new Error('Not authenticated');
      }

      const response = await apiClient.post<Webhook>('/webhooks', data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['webhooks'] });
    },
  });

  // Update a webhook
  const updateWebhook = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: UpdateWebhookRequest }) => {
      if (!token) {
        throw new Error('Not authenticated');
      }

      const response = await apiClient.patch<Webhook>(`/webhooks/${id}`, data);
      return response.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['webhooks'] });
      queryClient.invalidateQueries({ queryKey: ['webhook', data.id] });
    },
  });

  // Delete a webhook
  const deleteWebhook = useMutation({
    mutationFn: async (id: string) => {
      if (!token) {
        throw new Error('Not authenticated');
      }

      await apiClient.delete(`/webhooks/${id}`);
      return id;
    },
    onSuccess: (id) => {
      queryClient.invalidateQueries({ queryKey: ['webhooks'] });
      queryClient.removeQueries({ queryKey: ['webhook', id] });
    },
  });

  // Test a webhook
  const testWebhook = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: TestWebhookRequest }) => {
      if (!token) {
        throw new Error('Not authenticated');
      }

      const response = await apiClient.post<TestWebhookResponse>(`/webhooks/${id}/test`, data);
      return response.data;
    },
  });

  // Regenerate webhook secret
  const regenerateSecret = useMutation({
    mutationFn: async (id: string) => {
      if (!token) {
        throw new Error('Not authenticated');
      }

      const response = await apiClient.post<{ id: string; secret: string }>(`/webhooks/${id}/regenerate-secret`);
      return response.data;
    },
  });

  // Get webhook delivery logs
  const getWebhookLogs = (webhookId: string, options?: { limit?: number; offset?: number; successful?: boolean }) => {
    return useQuery({
      queryKey: ['webhook-logs', webhookId, options],
      queryFn: async () => {
        if (!token) {
          throw new Error('Not authenticated');
        }

        const params = {
          limit: options?.limit || 10,
          offset: options?.offset || 0,
          ...(options?.successful !== undefined ? { successful: options.successful } : {}),
        };

        const response = await apiClient.get<{ total: number; logs: WebhookDeliveryLog[] }>(`/webhooks/${webhookId}/logs`, { params });
        return response.data;
      },
      enabled: !!token && !!webhookId,
    });
  };

  return {
    webhooks: getWebhooks.data || [],
    isLoading: getWebhooks.isLoading,
    error: getWebhooks.error,
    getWebhook,
    createWebhook,
    updateWebhook,
    deleteWebhook,
    testWebhook,
    regenerateSecret,
    getWebhookLogs,
    refetch: getWebhooks.refetch,
  };
}
