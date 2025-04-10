import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import { toast } from '@loyaltystudio/ui';

export type TeamMember = {
  id: string;
  name: string | null;
  email: string;
  role: string;
  status: 'active' | 'pending';
  isAdmin?: boolean;
  isTenantOwner?: boolean;
};

export type InviteData = {
  email: string;
  role: string;
};

export function useTeam() {
  const queryClient = useQueryClient();

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['team-members'],
    queryFn: async () => {
      try {
        const response = await apiClient.get('/team-members');
        return response.data as TeamMember[];
      } catch (error) {
        console.error('Failed to fetch team members:', error);
        throw new Error('Failed to fetch team members');
      }
    },
  });

  const invite = useMutation({
    mutationFn: async (data: InviteData) => {
      try {
        const response = await apiClient.post('/team-members/invite', data);
        return response.data;
      } catch (error: any) {
        console.error('Failed to send invitation:', error);
        const errorMessage = error.response?.data?.message || 'Failed to send invitation';
        toast({
          title: 'Error',
          description: errorMessage,
          variant: 'destructive',
        });
        throw new Error(errorMessage);
      }
    },
    onSuccess: () => {
      toast({
        title: 'Success',
        description: 'Invitation sent successfully',
        variant: 'success',
      });
      queryClient.invalidateQueries({ queryKey: ['team-members'] });
    },
  });

  const remove = useMutation({
    mutationFn: async (memberId: string) => {
      try {
        const response = await apiClient.delete(`/team-members/${memberId}`);
        return response.data;
      } catch (error: any) {
        console.error('Failed to remove team member:', error);
        const errorMessage = error.response?.data?.message || 'Failed to remove team member';
        toast({
          title: 'Error',
          description: errorMessage,
          variant: 'destructive',
        });
        throw new Error(errorMessage);
      }
    },
    onSuccess: () => {
      toast({
        title: 'Success',
        description: 'Team member removed successfully',
        variant: 'success',
      });
      queryClient.invalidateQueries({ queryKey: ['team-members'] });
    },
  });

  return {
    data,
    isLoading,
    error,
    refetch,
    invite,
    remove,
  };
}