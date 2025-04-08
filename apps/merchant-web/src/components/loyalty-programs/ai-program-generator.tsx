'use client';

import { useState } from 'react';
import {
  Button,
  Skeleton,
  Alert,
  AlertTitle,
  AlertDescription
} from '@loyaltystudio/ui';
import { Sparkles, AlertCircle } from 'lucide-react';
import { useMerchantStore } from '@/lib/stores/merchant-store';
import { useAIProgramGenerator } from '@/hooks/use-ai-program-generator';
import { useRouter } from 'next/navigation';
import { toast } from '@loyaltystudio/ui';
import { apiClient } from '@/lib/api-client';

interface AIProgramGeneratorProps {
  onProgramGenerated?: (program: any) => void;
  onClose?: () => void;
}

export function AIProgramGenerator({ onProgramGenerated, onClose }: AIProgramGeneratorProps) {
  const { selectedMerchant } = useMerchantStore();
  const [isCreating, setIsCreating] = useState(false);
  const { generateProgram, isGenerating } = useAIProgramGenerator();
  const router = useRouter();

  const handleGenerateProgram = async () => {
    if (!selectedMerchant) {
      toast({
        title: 'Error',
        description: 'No merchant selected',
        variant: 'destructive',
      });
      return;
    }

    try {
      // First generate the program with AI
      const generatedProgram = await generateProgram(selectedMerchant.id);

      // Then create the actual program
      setIsCreating(true);

      const response = await apiClient.post('/loyalty-programs', {
        name: generatedProgram.name,
        description: generatedProgram.description,
        merchantId: selectedMerchant.id,
        settings: generatedProgram.settings,
        isActive: true,
        defaultRules: generatedProgram.rules,
        defaultTiers: generatedProgram.tiers,
        defaultRewards: generatedProgram.rewards,
      });

      toast({
        title: 'Success!',
        description: 'Your loyalty program has been created',
      });

      // Call the callback if provided
      if (onProgramGenerated) {
        onProgramGenerated(response.data);
      }

      // Navigate to the program details page
      router.push(`/loyalty-programs/${response.data.id}`);

      // Close the dialog if provided
      if (onClose) {
        onClose();
      }
    } catch (error) {
      console.error('Failed to create program:', error);
      toast({
        title: 'Error',
        description: 'Failed to create loyalty program',
        variant: 'destructive',
      });
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div className="w-full">
      {isGenerating && (
        <div className="space-y-4 mb-6">
          <div className="space-y-2">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
          </div>
          <div className="space-y-2">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
          </div>
          <div className="space-y-2">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-2/3" />
            <Skeleton className="h-4 w-1/2" />
          </div>
          <p className="text-sm text-muted-foreground mt-2">
            AI is analyzing your business and creating a customized loyalty program...
          </p>
        </div>
      )}

      {!isGenerating && !isCreating && (
        <Alert className="mb-6">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>How it works</AlertTitle>
          <AlertDescription>
            Our AI will analyze your business details and create a customized loyalty program with:
            <ul className="list-disc pl-5 mt-2 space-y-1">
              <li>Appropriate point earning rules</li>
              <li>Membership tiers (if applicable)</li>
              <li>Relevant rewards for your customers</li>
              <li>Optimized program settings</li>
            </ul>
          </AlertDescription>
        </Alert>
      )}

      {isCreating && (
        <Alert className="mb-6">
          <Sparkles className="h-4 w-4" />
          <AlertTitle>Creating your program</AlertTitle>
          <AlertDescription>
            Setting up your AI-generated loyalty program. This will only take a moment...
          </AlertDescription>
        </Alert>
      )}

      <div className="flex justify-end">
        <Button
          onClick={handleGenerateProgram}
          disabled={isGenerating || isCreating || !selectedMerchant}
          size="lg"
        >
          <Sparkles className="mr-2 h-4 w-4" />
          {isGenerating
            ? 'Generating Program...'
            : isCreating
              ? 'Creating Program...'
              : 'Generate Program with AI'}
        </Button>
      </div>
    </div>
  );
}
