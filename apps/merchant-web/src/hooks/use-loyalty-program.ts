import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";

export function useLoyaltyProgram(id: string) {
  const {
    data: program,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["loyalty-program", id],
    queryFn: async () => {
      const response = await api.get(`/loyalty-programs/${id}`);
      return response.data;
    },
    enabled: !!id,
  });

  return {
    program,
    isLoading,
    error: error instanceof Error ? error.message : null,
  };
} 