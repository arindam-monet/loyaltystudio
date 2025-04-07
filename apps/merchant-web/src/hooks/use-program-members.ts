import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import { useMerchantStore } from '@/lib/stores/merchant-store';
import { useAuthStore } from '@/lib/stores/auth-store';

export interface ProgramMember {
  id: string;
  email: string;
  name?: string;
  phoneNumber?: string;
  externalId?: string;
  tierId: string;
  pointsBalance: number;
  joinedAt: string;
  lastActivity?: string;
  metadata?: Record<string, any>;
  createdAt: string;
  updatedAt: string;
  tier: {
    id: string;
    name: string;
    description?: string;
    pointsThreshold: number;
    benefits?: Record<string, any>;
  };
}

export interface CreateMemberData {
  email: string;
  name?: string;
  phoneNumber?: string;
  externalId?: string;
  tierId: string;
  loyaltyProgramId: string;
  pointsBalance?: number;
  metadata?: Record<string, any>;
}

export interface UpdateMemberData {
  name?: string;
  phoneNumber?: string;
  externalId?: string;
  tierId?: string;
  pointsBalance?: number;
  metadata?: Record<string, any>;
}

export function useProgramMembers(loyaltyProgramId?: string) {
  const queryClient = useQueryClient();
  const { selectedMerchant } = useMerchantStore();
  const { token } = useAuthStore();

  const { data: members = [], isLoading } = useQuery({
    queryKey: ['program-members', loyaltyProgramId],
    queryFn: async () => {
      if (!loyaltyProgramId || !token) {
        return [];
      }
      const response = await apiClient.get<ProgramMember[]>('/program-members', {
        params: { loyaltyProgramId }
      });
      return response.data;
    },
    enabled: !!loyaltyProgramId && !!token,
  });

  const createMember = useMutation({
    mutationFn: async (data: CreateMemberData) => {
      const response = await apiClient.post<ProgramMember>('/program-members', data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['program-members', loyaltyProgramId] });
    },
  });

  const updateMember = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: UpdateMemberData }) => {
      const response = await apiClient.patch<ProgramMember>(`/program-members/${id}`, data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['program-members', loyaltyProgramId] });
    },
  });

  const deleteMember = useMutation({
    mutationFn: async (id: string) => {
      await apiClient.delete(`/program-members/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['program-members', loyaltyProgramId] });
    },
  });

  const addPoints = useMutation({
    mutationFn: async ({ id, points, reason }: { id: string; points: number; reason?: string }) => {
      const response = await apiClient.post<ProgramMember>(`/program-members/${id}/points`, {
        points,
        reason: reason || 'Points added manually',
      });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['program-members', loyaltyProgramId] });
    },
  });

  const deductPoints = useMutation({
    mutationFn: async ({ id, points, reason }: { id: string; points: number; reason?: string }) => {
      const response = await apiClient.post<ProgramMember>(`/program-members/${id}/deduct-points`, {
        points,
        reason: reason || 'Points deducted manually',
      });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['program-members', loyaltyProgramId] });
    },
  });

  const getPointsHistory = async (memberId: string) => {
    const response = await apiClient.get(`/program-members/${memberId}/points-history`);
    return response.data;
  };

  return {
    members,
    isLoading,
    createMember,
    updateMember,
    deleteMember,
    addPoints,
    deductPoints,
    getPointsHistory,
  };
}
