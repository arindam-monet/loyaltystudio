import { useMutation } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';

type OnboardingData = {
  business: {
    name: string;
    description: string;
    industry: string;
    website: string;
  };
  program: {
    name: string;
    description: string;
    pointsRate: number;
    minimumPoints: number;
    pointsExpiry: number;
  };
  branding: {
    logo?: File;
    primaryColor: string;
    secondaryColor: string;
  };
};

export function useOnboarding() {
  return useMutation({
    mutationFn: async (data: OnboardingData) => {
      // First, create the merchant
      const formData = new FormData();
      
      // Add business data
      formData.append('business', JSON.stringify(data.business));
      
      // Add program data
      formData.append('program', JSON.stringify(data.program));
      
      // Add branding data
      if (data.branding.logo) {
        formData.append('logo', data.branding.logo);
      }
      formData.append('branding', JSON.stringify({
        primaryColor: data.branding.primaryColor,
        secondaryColor: data.branding.secondaryColor,
      }));

      const response = await apiClient.post('/merchants/onboard', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to complete merchant onboarding');
      }

      return response.data;
    },
  });
} 