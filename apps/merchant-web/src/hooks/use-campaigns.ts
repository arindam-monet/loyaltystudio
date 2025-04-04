import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";
import { useAuthStore } from "@/lib/stores/auth-store";

export function useCampaigns(programId: string) {
  const queryClient = useQueryClient();
  const { token } = useAuthStore();

  const {
    data: campaigns,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["campaigns", programId],
    queryFn: async () => {
      const response = await apiClient.get(`/loyalty-programs/${programId}/campaigns`);
      return response.data;
    },
    enabled: !!programId && !!token,
  });

  const createCampaign = useMutation({
    mutationFn: async (data: any) => {
      const response = await apiClient.post(`/loyalty-programs/${programId}/campaigns`, data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["campaigns", programId] });
    },
  });

  const updateCampaign = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      const response = await apiClient.patch(`/loyalty-programs/${programId}/campaigns/${id}`, data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["campaigns", programId] });
    },
  });

  const deleteCampaign = useMutation({
    mutationFn: async (id: string) => {
      await apiClient.delete(`/loyalty-programs/${programId}/campaigns/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["campaigns", programId] });
    },
  });

  return {
    campaigns,
    isLoading,
    error: error instanceof Error ? error.message : null,
    createCampaign,
    updateCampaign,
    deleteCampaign,
  };
}