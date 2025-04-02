import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import { useAuthStore } from '@/lib/stores/auth-store';

export interface Merchant {
  id: string;
  name: string;
  description?: string;
  industry?: string;
  website?: string;
  subdomain?: string;
  isDefault: boolean;
  branding?: {
    logo?: string;
    primaryColor?: string;
    secondaryColor?: string;
  };
  createdAt: string;
  updatedAt: string;
}

export function useMerchants() {
  const token = useAuthStore((state) => state.token);

  return useQuery({
    queryKey: ['merchants'],
    queryFn: async () => {
      const response = await apiClient.get<Merchant[]>('/merchants');
      return response.data;
    },
    enabled: !!token, // Only fetch if we have a token
    retry: false, // Don't retry on error
  });
} 