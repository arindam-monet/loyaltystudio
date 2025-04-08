import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import { useAuthStore } from '@/lib/stores/auth-store';

export interface ProgramReward {
  id: string;
  name: string;
  description: string;
  pointsCost: number;
  type: 'PHYSICAL' | 'DIGITAL' | 'EXPERIENCE' | 'COUPON';
  stock?: number;
  validityPeriod?: number;
  redemptionLimit?: number;
  conditions?: Record<string, any>;
  metadata?: Record<string, any>;
  isActive: boolean;
  loyaltyProgramId: string;
  createdAt: string;
  updatedAt: string;
}

export function useProgramRewards(loyaltyProgramId?: string) {
  const queryClient = useQueryClient();
  const { token } = useAuthStore();

  const { data: rewards = [], isLoading } = useQuery({
    queryKey: ['program-rewards', loyaltyProgramId],
    queryFn: async () => {
      if (!loyaltyProgramId || !token) {
        return [];
      }
      const response = await apiClient.get<ProgramReward[]>('/rewards', {
        params: { loyaltyProgramId }
      });
      return response.data;
    },
    enabled: !!loyaltyProgramId && !!token,
  });

  return {
    rewards,
    isLoading
  };
}
