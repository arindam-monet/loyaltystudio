import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import { useAuthStore } from '@/lib/stores/auth-store';

export interface ProgramTier {
  id: string;
  name: string;
  description?: string;
  pointsThreshold: number;
  benefits?: Record<string, any>;
  loyaltyProgramId: string;
  createdAt: string;
  updatedAt: string;
  members?: {
    id: string;
    userId: string;
    pointsBalance: number;
    user: {
      id: string;
      email: string;
      name: string | null;
    };
  }[];
}

export interface CreateTierData {
  name: string;
  description?: string;
  pointsThreshold: number;
  benefits?: Record<string, any>;
  loyaltyProgramId: string;
}

export interface UpdateTierData {
  name?: string;
  description?: string;
  pointsThreshold?: number;
  benefits?: Record<string, any>;
}

export function useProgramTiers(loyaltyProgramId?: string) {
  const queryClient = useQueryClient();
  const { token } = useAuthStore();

  const { data: tiers = [], isLoading } = useQuery({
    queryKey: ['program-tiers', loyaltyProgramId],
    queryFn: async () => {
      if (!loyaltyProgramId || !token) {
        return [];
      }
      const response = await apiClient.get<ProgramTier[]>('/program-tiers', {
        params: { loyaltyProgramId }
      });
      return response.data;
    },
    enabled: !!loyaltyProgramId && !!token,
  });

  const createTier = useMutation({
    mutationFn: async (data: CreateTierData) => {
      const response = await apiClient.post<ProgramTier>('/program-tiers', data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['program-tiers', loyaltyProgramId] });
    },
  });

  const updateTier = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: UpdateTierData }) => {
      const response = await apiClient.patch<ProgramTier>(`/program-tiers/${id}`, data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['program-tiers', loyaltyProgramId] });
    },
  });

  const deleteTier = useMutation({
    mutationFn: async (id: string) => {
      await apiClient.delete(`/program-tiers/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['program-tiers', loyaltyProgramId] });
    },
  });

  const getTierProgress = async (tierId: string, userId: string) => {
    const response = await apiClient.get(`/program-tiers/${tierId}/progress/${userId}`);
    return response.data;
  };

  return {
    tiers,
    isLoading,
    createTier,
    updateTier,
    deleteTier,
    getTierProgress,
  };
}
