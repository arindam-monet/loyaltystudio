'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button, Card, CardContent, CardDescription, CardHeader, CardTitle, Input, Label, Textarea, Alert, AlertDescription } from '@loyaltystudio/ui';
import { Loader2, Building2, Settings, Palette, CheckCircle2 } from 'lucide-react';
import { useOnboarding } from '@/hooks/use-onboarding';
import React from 'react';

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

const INITIAL_DATA: OnboardingData = {
  business: {
    name: '',
    description: '',
    industry: '',
    website: '',
  },
  program: {
    name: '',
    description: '',
    pointsRate: 1,
    minimumPoints: 100,
    pointsExpiry: 365,
  },
  branding: {
    primaryColor: '#4F46E5',
    secondaryColor: '#818CF8',
  },
};

const steps = [
  {
    id: 'business',
    title: 'Business Information',
    description: 'Tell us about your business',
    icon: Building2,
  },
  {
    id: 'program',
    title: 'Loyalty Program',
    description: 'Set up your loyalty program',
    icon: Settings,
  },
  {
    id: 'branding',
    title: 'Branding',
    description: 'Customize your brand',
    icon: Palette,
  },
  {
    id: 'review',
    title: 'Review',
    description: 'Review and launch',
    icon: CheckCircle2,
  },
];

export default function OnboardingPage() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(0);
  const [data, setData] = useState<OnboardingData>(INITIAL_DATA);
  const [error, setError] = useState<string | null>(null);

  const onboarding = useOnboarding();

  const updateFields = (fields: Partial<OnboardingData>) => {
    setData(prev => ({ ...prev, ...fields }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
      return;
    }

    try {
      await onboarding.mutateAsync(data);
      router.push('/dashboard');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    }
  };

  const renderStep = () => {
    switch (currentStep) {
      case 0:
        return (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="businessName">Business Name</Label>
              <Input
                id="businessName"
                value={data.business.name}
                onChange={(e) => updateFields({ business: { ...data.business, name: e.target.value } })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="businessDescription">Business Description</Label>
              <Textarea
                id="businessDescription"
                value={data.business.description}
                onChange={(e) => updateFields({ business: { ...data.business, description: e.target.value } })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="industry">Industry</Label>
              <Input
                id="industry"
                value={data.business.industry}
                onChange={(e) => updateFields({ business: { ...data.business, industry: e.target.value } })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="website">Website</Label>
              <Input
                id="website"
                type="url"
                value={data.business.website}
                onChange={(e) => updateFields({ business: { ...data.business, website: e.target.value } })}
                required
              />
            </div>
          </div>
        );

      case 1:
        return (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="programName">Program Name</Label>
              <Input
                id="programName"
                value={data.program.name}
                onChange={(e) => updateFields({ program: { ...data.program, name: e.target.value } })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="programDescription">Program Description</Label>
              <Textarea
                id="programDescription"
                value={data.program.description}
                onChange={(e) => updateFields({ program: { ...data.program, description: e.target.value } })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="pointsRate">Points Rate (per $1)</Label>
              <Input
                id="pointsRate"
                type="number"
                min="0"
                step="0.1"
                value={data.program.pointsRate}
                onChange={(e) => updateFields({ program: { ...data.program, pointsRate: parseFloat(e.target.value) } })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="minimumPoints">Minimum Points for Redemption</Label>
              <Input
                id="minimumPoints"
                type="number"
                min="0"
                value={data.program.minimumPoints}
                onChange={(e) => updateFields({ program: { ...data.program, minimumPoints: parseInt(e.target.value) } })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="pointsExpiry">Points Expiry (days)</Label>
              <Input
                id="pointsExpiry"
                type="number"
                min="0"
                value={data.program.pointsExpiry}
                onChange={(e) => updateFields({ program: { ...data.program, pointsExpiry: parseInt(e.target.value) } })}
                required
              />
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="logo">Logo</Label>
              <Input
                id="logo"
                type="file"
                accept="image/*"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    updateFields({ branding: { ...data.branding, logo: file } });
                  }
                }}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="primaryColor">Primary Color</Label>
              <Input
                id="primaryColor"
                type="color"
                value={data.branding.primaryColor}
                onChange={(e) => updateFields({ branding: { ...data.branding, primaryColor: e.target.value } })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="secondaryColor">Secondary Color</Label>
              <Input
                id="secondaryColor"
                type="color"
                value={data.branding.secondaryColor}
                onChange={(e) => updateFields({ branding: { ...data.branding, secondaryColor: e.target.value } })}
                required
              />
            </div>
          </div>
        );

      case 3:
        return (
          <div className="space-y-6">
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Business Information</h3>
              <div className="space-y-2">
                <p><span className="font-medium">Name:</span> {data.business.name}</p>
                <p><span className="font-medium">Description:</span> {data.business.description}</p>
                <p><span className="font-medium">Industry:</span> {data.business.industry}</p>
                <p><span className="font-medium">Website:</span> {data.business.website}</p>
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="text-lg font-medium">Loyalty Program</h3>
              <div className="space-y-2">
                <p><span className="font-medium">Name:</span> {data.program.name}</p>
                <p><span className="font-medium">Description:</span> {data.program.description}</p>
                <p><span className="font-medium">Points Rate:</span> {data.program.pointsRate} points per $1</p>
                <p><span className="font-medium">Minimum Points:</span> {data.program.minimumPoints}</p>
                <p><span className="font-medium">Points Expiry:</span> {data.program.pointsExpiry} days</p>
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="text-lg font-medium">Branding</h3>
              <div className="space-y-2">
                <p><span className="font-medium">Logo:</span> {data.branding.logo?.name}</p>
                <p><span className="font-medium">Primary Color:</span> {data.branding.primaryColor}</p>
                <p><span className="font-medium">Secondary Color:</span> {data.branding.secondaryColor}</p>
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="container flex items-center justify-center min-h-screen py-12">
      <Card className="w-full max-w-2xl">
        <CardHeader>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-2">
              {steps[currentStep].icon && React.createElement(steps[currentStep].icon, { className: "h-6 w-6 text-primary" })}
              <CardTitle className="text-2xl">{steps[currentStep].title}</CardTitle>
            </div>
            <div className="text-sm text-muted-foreground">
              Step {currentStep + 1} of {steps.length}
            </div>
          </div>
          <CardDescription className="text-base">
            {steps[currentStep].description}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <Alert variant="destructive">
                <AlertDescription>
                  {error}
                </AlertDescription>
              </Alert>
            )}

            {renderStep()}

            <div className="flex justify-between pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setCurrentStep(currentStep - 1)}
                disabled={currentStep === 0 || onboarding.isPending}
              >
                Previous
              </Button>
              <Button
                type="submit"
                disabled={onboarding.isPending}
              >
                {onboarding.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {currentStep === steps.length - 1 ? 'Launching...' : 'Next'}
                  </>
                ) : (
                  currentStep === steps.length - 1 ? 'Launch Program' : 'Next'
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
} 