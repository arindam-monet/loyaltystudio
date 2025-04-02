import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';

export interface Merchant {
  id: string;
  name: string;
  description?: string;
  industry?: string;
  website?: string;
  isDefault: boolean;
  createdAt: string;
  updatedAt: string;
}

export function useMerchants() {
  return useQuery({
    queryKey: ['merchants'],
    queryFn: async () => {
      const response = await apiClient.get<Merchant[]>('/merchants');
      return response.data;
    },
  });
} 