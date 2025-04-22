import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";
import { useAuthStore } from "@/lib/stores/auth-store";
import { useMerchantStore } from "@/lib/stores/merchant-store";
import { Campaign } from "@/lib/stores/campaign-store";

export function useCampaigns(loyaltyProgramId?: string) {
  const queryClient = useQueryClient();
  const { token } = useAuthStore();
  const { selectedMerchant } = useMerchantStore();

  const {
    data: campaigns = [],
    isLoading,
    error,
  } = useQuery({
    queryKey: ["campaigns", selectedMerchant?.id, loyaltyProgramId],
    queryFn: async () => {
      if (!selectedMerchant?.id || !token || !loyaltyProgramId) {
        throw new Error('No merchant selected, not authenticated, or no loyalty program ID provided');
      }
      const response = await apiClient.get('/campaigns', {
        params: { loyaltyProgramId }
      });
      return response.data;
    },
    enabled: !!selectedMerchant?.id && !!token && !!loyaltyProgramId,
  });

  const createCampaign = useMutation({
    mutationFn: async (data: Omit<Campaign, 'id' | 'createdAt' | 'updatedAt'>) => {
      if (!selectedMerchant?.id || !token || !loyaltyProgramId) {
        throw new Error('No merchant selected, not authenticated, or no loyalty program ID provided');
      }

      // Ensure loyaltyProgramId is included in the request
      const campaignData = {
        ...data,
        loyaltyProgramId,
        // Ensure conditions and rewards are properly formatted
        conditions: data.conditions || { rules: [], targetTierIds: [] },
        rewards: data.rewards || { pointsMultiplier: 1, bonusPoints: 0, rewardId: '' }
      };

      console.log('Creating campaign with data:', campaignData);
      const response = await apiClient.post('/campaigns', campaignData);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["campaigns", selectedMerchant?.id, loyaltyProgramId] });
    },
  });

  const updateCampaign = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<Campaign> }) => {
      if (!selectedMerchant?.id || !token) {
        throw new Error('No merchant selected or not authenticated');
      }

      // Ensure conditions and rewards are properly formatted if they exist
      const campaignData = {
        ...data,
        conditions: data.conditions || undefined,
        rewards: data.rewards || undefined
      };

      console.log('Updating campaign with data:', campaignData);
      const response = await apiClient.patch(`/campaigns/${id}`, campaignData);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["campaigns", selectedMerchant?.id, loyaltyProgramId] });
    },
  });

  const deleteCampaign = useMutation({
    mutationFn: async (id: string) => {
      if (!selectedMerchant?.id || !token) {
        throw new Error('No merchant selected or not authenticated');
      }
      await apiClient.delete(`/campaigns/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["campaigns", selectedMerchant?.id, loyaltyProgramId] });
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