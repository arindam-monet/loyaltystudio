import { useMutation } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import { useAuthStore } from '@/lib/stores/auth-store';

type OnboardingData = {
  business: {
    name: string;
    description: string;
    industry: string;
    website: string;
  };
  branding: {
    logo?: File;
    primaryColor: string;
    secondaryColor: string;
  };
};

export function useOnboarding() {
  const { user } = useAuthStore();

  return useMutation({
    mutationFn: async (data: OnboardingData) => {
      if (!user) {
        // Instead of throwing, return a rejected promise with a specific error
        return Promise.reject(new Error('Please sign in to create a merchant'));
      }

      try {
        // Create merchant with data from auth context
        const merchantData = {
          name: data.business.name,
          email: user.email,
          tenantId: user.user_metadata?.tenant_id,
          // Let the server handle subdomain generation
        };

        // Create merchant
        const { data: merchant } = await apiClient.post('/merchants', merchantData);

        // Update merchant branding
        await apiClient.patch(`/merchants/current`, {
          logo: data.branding.logo ? await convertFileToUrl(data.branding.logo) : undefined,
          primaryColor: data.branding.primaryColor,
          secondaryColor: data.branding.secondaryColor,
        });

        return merchant;
      } catch (error) {
        if (error instanceof Error) {
          throw error;
        }
        throw new Error('Failed to complete merchant onboarding');
      }
    },
  });
}

// Helper function to convert File to URL (you'll need to implement file upload)
async function convertFileToUrl(file: File): Promise<string> {
  // TODO: Implement file upload to get URL
  return 'placeholder-url';
} 