import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";
import { useAuthStore } from "@/lib/stores/auth-store";

export function useLoyaltyProgram(id: string) {
  const { token } = useAuthStore();
  const {
    data: program,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["loyalty-program", id],
    queryFn: async () => {
      const response = await apiClient.get(`/loyalty-programs/${id}`);
      return response.data;
    },
    enabled: !!id && !!token,
  });

  return {
    program,
    isLoading,
    error: error instanceof Error ? error.message : null,
  };
}