import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';

type TeamMember = {
  id: string;
  name: string | null;
  email: string;
  role: string;
  status: 'active' | 'pending';
};

type InviteData = {
  email: string;
  role: string;
};

export function useTeam() {
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['team-members'],
    queryFn: async () => {
      const response = await apiClient.get('/team-members');
      if (!response.ok) {
        throw new Error('Failed to fetch team members');
      }
      return response.data as TeamMember[];
    },
  });

  const invite = useMutation({
    mutationFn: async (data: InviteData) => {
      const response = await apiClient.post('/team-members/invite', data);
      if (!response.ok) {
        throw new Error('Failed to send invitation');
      }
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['team-members'] });
    },
  });

  const remove = useMutation({
    mutationFn: async (memberId: string) => {
      const response = await apiClient.delete(`/team-members/${memberId}`);
      if (!response.ok) {
        throw new Error('Failed to remove team member');
      }
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['team-members'] });
    },
  });

  return {
    data,
    isLoading,
    invite,
    remove,
  };
} 