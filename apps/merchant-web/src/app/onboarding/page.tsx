'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button, Card, CardContent, CardDescription, CardHeader, CardTitle, Input, Label, Textarea, Alert, AlertDescription } from '@loyaltystudio/ui';
import { Loader2, Building2, Palette, CheckCircle2 } from 'lucide-react';
import { useOnboarding } from '@/hooks/use-onboarding';
import { AppSidebar } from '@/components/app-sidebar';
import { SidebarInset, SidebarProvider, SidebarTrigger, Separator, Breadcrumb, BreadcrumbItem, BreadcrumbList, BreadcrumbPage } from '@loyaltystudio/ui';
import React from 'react';
import { useAuthGuard } from '@/hooks/use-auth-guard';

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

const INITIAL_DATA: OnboardingData = {
  business: {
    name: '',
    description: '',
    industry: '',
    website: '',
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
    id: 'branding',
    title: 'Branding',
    description: 'Customize your brand',
    icon: Palette,
  },
  {
    id: 'review',
    title: 'Review',
    description: 'Review your business details',
    icon: CheckCircle2,
  },
];

export default function OnboardingPage() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(0);
  const [data, setData] = useState<OnboardingData>(INITIAL_DATA);
  const [error, setError] = useState<string | null>(null);
  const { isLoading } = useAuthGuard();

  const onboarding = useOnboarding();

  // Show loading state while verifying authentication
  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading onboarding...</p>
        </div>
      </div>
    );
  }

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
              <Label htmlFor="businessName">Business Name *</Label>
              <Input
                id="businessName"
                value={data.business.name}
                onChange={(e) => updateFields({ business: { ...data.business, name: e.target.value } })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="businessDescription">Business Description *</Label>
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
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="website">Website</Label>
              <Input
                id="website"
                type="url"
                value={data.business.website}
                onChange={(e) => updateFields({ business: { ...data.business, website: e.target.value } })}
              />
            </div>
          </div>
        );

      case 1:
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
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="primaryColor">Primary Color *</Label>
              <Input
                id="primaryColor"
                type="color"
                value={data.branding.primaryColor}
                onChange={(e) => updateFields({ branding: { ...data.branding, primaryColor: e.target.value } })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="secondaryColor">Secondary Color *</Label>
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

      case 2:
        return (
          <div className="space-y-6">
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Business Information</h3>
              <div className="space-y-2">
                <p><span className="font-medium">Name:</span> {data.business.name}</p>
                <p><span className="font-medium">Description:</span> {data.business.description}</p>
                {data.business.industry && (
                  <p><span className="font-medium">Industry:</span> {data.business.industry}</p>
                )}
                {data.business.website && (
                  <p><span className="font-medium">Website:</span> {data.business.website}</p>
                )}
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="text-lg font-medium">Branding</h3>
              <div className="space-y-2">
                {data.branding.logo && (
                  <p><span className="font-medium">Logo:</span> {data.branding.logo.name}</p>
                )}
                <div className="flex items-center gap-4">
                  <span className="font-medium">Colors:</span>
                  <div className="flex gap-2">
                    <div 
                      className="w-8 h-8 rounded-full border" 
                      style={{ backgroundColor: data.branding.primaryColor }}
                      title={`Primary: ${data.branding.primaryColor}`}
                    />
                    <div 
                      className="w-8 h-8 rounded-full border" 
                      style={{ backgroundColor: data.branding.secondaryColor }}
                      title={`Secondary: ${data.branding.secondaryColor}`}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <SidebarProvider defaultOpen>
      <div className="flex min-h-screen w-full">
        <AppSidebar />
        <SidebarInset>
          <header className="flex h-16 shrink-0 items-center gap-2 border-b">
            <div className="flex items-center gap-2 px-4">
              <SidebarTrigger className="-ml-1" />
              <Separator orientation="vertical" className="mr-2 h-4" />
              <Breadcrumb>
                <BreadcrumbList>
                  <BreadcrumbItem>
                    <BreadcrumbPage>Create Business</BreadcrumbPage>
                  </BreadcrumbItem>
                </BreadcrumbList>
              </Breadcrumb>
            </div>
          </header>
          <div className="flex p-4 mx-auto w-full md:w-2/3">
            <Card className="w-full">
              <CardHeader>
                <div className="flex flex-col-reverse lg:flex-row lg:items-center justify-between mb-4">
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
              <CardContent className="max-w-2xl">
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
                          Creating...
                        </>
                      ) : (
                        currentStep === steps.length - 1 ? 'Create Business' : 'Next'
                      )}
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </div>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
} 