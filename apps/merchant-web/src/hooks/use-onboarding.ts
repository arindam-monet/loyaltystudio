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
        return Promise.reject(new Error('Please sign in to create a merchant'));
      }

      if (!user.tenantId) {
        return Promise.reject(new Error('No tenant ID found. Please contact support.'));
      }

      if (!user.email) {
        return Promise.reject(new Error('No email found. Please contact support.'));
      }

      try {
        console.log('Starting merchant creation with user:', {
          email: user.email,
          tenantId: user.tenantId
        });

        // Create merchant with data from auth context
        const merchantData = {
          name: data.business.name,
          description: data.business.description,
          industry: data.business.industry,
          website: data.business.website,
          email: user.email,
          tenantId: user.tenantId,
          branding: {
            primaryColor: data.branding.primaryColor,
            secondaryColor: data.branding.secondaryColor,
          }
        };

        console.log('Sending merchant creation request with data:', merchantData);

        // Create merchant
        const { data: merchant } = await apiClient.post('/merchants', merchantData);

        // Update merchant branding if logo is provided
        if (data.branding.logo) {
          const logoUrl = await convertFileToUrl(data.branding.logo);
          await apiClient.patch(`/merchants/${merchant.id}`, {
            branding: {
              ...merchantData.branding,
              logo: logoUrl
            }
          });
        }

        return merchant;
      } catch (error) {
        console.error('Error during merchant creation:', error);

        // Check for specific API error responses
        if (error && typeof error === 'object' && 'response' in error) {
          const apiError = error as { response?: { data?: { error?: string, message?: string } } };
          const errorMessage = apiError.response?.data?.message || apiError.response?.data?.error;

          if (errorMessage) {
            console.error('API error message:', errorMessage);
            throw new Error(errorMessage);
          }
        }

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