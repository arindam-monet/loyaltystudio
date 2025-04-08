import { useMutation } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import { toast } from '@loyaltystudio/ui';

interface GeneratedLoyaltyProgram {
  name: string;
  description: string;
  settings: {
    pointsName: string;
    currency: string;
    timezone: string;
  };
  rules: Array<{
    name: string;
    description: string;
    type: string;
    points: number;
    conditions: Record<string, any>;
    minAmount?: number;
    maxPoints?: number;
  }>;
  tiers?: Array<{
    name: string;
    description: string;
    pointsThreshold: number;
    benefits: Record<string, any>;
  }>;
  rewards?: Array<{
    name: string;
    description: string;
    type: string;
    pointsCost: number;
    validityPeriod?: number;
    redemptionLimit?: number;
  }>;
}

interface GenerateProgramResponse {
  program: GeneratedLoyaltyProgram;
}

export function useAIProgramGenerator() {
  const generateProgramMutation = useMutation({
    mutationFn: async (merchantId: string): Promise<GeneratedLoyaltyProgram> => {
      try {
        const response = await apiClient.post<GenerateProgramResponse>(
          '/ai/generate-loyalty-program',
          { merchantId }
        );
        return response.data.program;
      } catch (error) {
        console.error('Error generating program:', error);
        throw new Error('Failed to generate loyalty program');
      }
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to generate loyalty program',
        variant: 'destructive',
      });
    },
  });

  return {
    generateProgram: generateProgramMutation.mutateAsync,
    isGenerating: generateProgramMutation.isPending,
    error: generateProgramMutation.error,
  };
}
