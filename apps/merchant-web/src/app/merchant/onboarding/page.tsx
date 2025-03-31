import { OnboardingWizard } from '@/components/merchant/onboarding/OnboardingWizard';

export default function OnboardingPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
        <OnboardingWizard />
      </div>
    </div>
  );
} 