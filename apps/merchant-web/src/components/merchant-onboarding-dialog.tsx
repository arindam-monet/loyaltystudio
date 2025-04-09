'use client';

import React, { useState } from 'react';
import { Button, Input, Label, Textarea, Alert, AlertDescription, Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@loyaltystudio/ui';
import { Loader2, Building2, Palette, CheckCircle2 } from 'lucide-react';
import { useOnboarding } from '@/hooks/use-onboarding';

type OnboardingData = {
  business: {
    name: string;
    description: string;
    industry: string;
    website: string;
    currency: string;
    timezone: string;
  };
  branding: {
    logo?: File;
    primaryColor: string;
    secondaryColor: string;
    accentColor?: string;
    primaryTextColor?: string;
    secondaryTextColor?: string;
    accentTextColor?: string;
  };
};

const INITIAL_DATA: OnboardingData = {
  business: {
    name: '',
    description: '',
    industry: '',
    website: '',
    currency: 'USD',
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
  },
  branding: {
    primaryColor: '#4F46E5',
    secondaryColor: '#818CF8',
    accentColor: '#f59e0b',
    primaryTextColor: '#ffffff',
    secondaryTextColor: '#ffffff',
    accentTextColor: '#ffffff',
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

// Function to get contrast color (black or white) based on background color
const getContrastColor = (hexColor: string) => {
  // Remove the # if it exists
  hexColor = hexColor.replace('#', '');

  // Convert to RGB
  const r = parseInt(hexColor.substring(0, 2), 16);
  const g = parseInt(hexColor.substring(2, 2), 16);
  const b = parseInt(hexColor.substring(4, 2), 16);

  // Calculate luminance
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;

  // Return black for bright colors, white for dark colors
  return luminance > 0.5 ? '#000000' : '#ffffff';
};

interface MerchantOnboardingDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export function MerchantOnboardingDialog({ open, onOpenChange, onSuccess }: MerchantOnboardingDialogProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [data, setData] = useState<OnboardingData>(INITIAL_DATA);
  const [error, setError] = useState<string | null>(null);
  const onboarding = useOnboarding();

  // Log when the dialog opens or closes
  React.useEffect(() => {
    console.log('MerchantOnboardingDialog open state changed:', open);
  }, [open]);

  // We don't apply theme colors during onboarding
  // Theme will be applied after merchant creation

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
      console.log('Submitting merchant data...');
      const result = await onboarding.mutateAsync(data);
      console.log('Merchant created successfully:', result);

      // Reset form state
      setData(INITIAL_DATA);
      setCurrentStep(0);

      // Close the dialog first
      onOpenChange(false);

      // Then call onSuccess callback after a short delay
      setTimeout(() => {
        console.log('Calling onSuccess callback...');
        onSuccess?.();
      }, 100);
    } catch (err) {
      console.error('Error creating merchant:', err);
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
              <Label htmlFor="industry">Industry *</Label>
              <select
                id="industry"
                className="w-full rounded-md border border-input bg-background px-3 py-2"
                value={data.business.industry}
                onChange={(e) => updateFields({ business: { ...data.business, industry: e.target.value } })}
                required
              >
                <option value="">Select an industry</option>
                <option value="retail">Retail</option>
                <option value="food_beverage">Food & Beverage</option>
                <option value="hospitality">Hospitality</option>
                <option value="travel">Travel & Tourism</option>
                <option value="health_wellness">Health & Wellness</option>
                <option value="beauty">Beauty & Cosmetics</option>
                <option value="fashion">Fashion & Apparel</option>
                <option value="electronics">Electronics</option>
                <option value="home_goods">Home Goods</option>
                <option value="entertainment">Entertainment</option>
                <option value="education">Education</option>
                <option value="financial">Financial Services</option>
                <option value="professional">Professional Services</option>
                <option value="automotive">Automotive</option>
                <option value="other">Other</option>
              </select>
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
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="currency">Currency *</Label>
                <select
                  id="currency"
                  className="w-full rounded-md border border-input bg-background px-3 py-2"
                  value={data.business.currency}
                  onChange={(e) => updateFields({ business: { ...data.business, currency: e.target.value } })}
                  required
                >
                  <option value="USD">USD - US Dollar</option>
                  <option value="EUR">EUR - Euro</option>
                  <option value="GBP">GBP - British Pound</option>
                  <option value="JPY">JPY - Japanese Yen</option>
                  <option value="AUD">AUD - Australian Dollar</option>
                  <option value="CAD">CAD - Canadian Dollar</option>
                  <option value="CHF">CHF - Swiss Franc</option>
                  <option value="CNY">CNY - Chinese Yuan</option>
                  <option value="INR">INR - Indian Rupee</option>
                </select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="timezone">Timezone *</Label>
                <select
                  id="timezone"
                  className="w-full rounded-md border border-input bg-background px-3 py-2"
                  value={data.business.timezone}
                  onChange={(e) => updateFields({ business: { ...data.business, timezone: e.target.value } })}
                  required
                >
                  <option value="UTC">UTC</option>
                  <option value="America/New_York">Eastern Time (ET)</option>
                  <option value="America/Chicago">Central Time (CT)</option>
                  <option value="America/Denver">Mountain Time (MT)</option>
                  <option value="America/Los_Angeles">Pacific Time (PT)</option>
                  <option value="Europe/London">London (GMT)</option>
                  <option value="Europe/Paris">Central European Time (CET)</option>
                  <option value="Asia/Kolkata">India (IST)</option>
                  <option value="Asia/Tokyo">Japan Time (JST)</option>
                  <option value="Asia/Shanghai">China Time (CST)</option>
                  <option value="Australia/Sydney">Australian Eastern Time (AET)</option>
                </select>
              </div>
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

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="primaryColor">Primary Color *</Label>
                <div className="flex gap-2">
                  <Input
                    id="primaryColor"
                    type="color"
                    className="w-12 h-10 p-1"
                    value={data.branding.primaryColor}
                    onChange={(e) => {
                      const color = e.target.value;
                      const textColor = getContrastColor(color);
                      updateFields({
                        branding: {
                          ...data.branding,
                          primaryColor: color,
                          primaryTextColor: textColor
                        }
                      });
                    }}
                    required
                  />
                  <Input
                    value={data.branding.primaryColor}
                    onChange={(e) => {
                      const color = e.target.value;
                      const textColor = getContrastColor(color);
                      updateFields({
                        branding: {
                          ...data.branding,
                          primaryColor: color,
                          primaryTextColor: textColor
                        }
                      });
                    }}
                    className="flex-1"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="secondaryColor">Secondary Color *</Label>
                <div className="flex gap-2">
                  <Input
                    id="secondaryColor"
                    type="color"
                    className="w-12 h-10 p-1"
                    value={data.branding.secondaryColor}
                    onChange={(e) => {
                      const color = e.target.value;
                      const textColor = getContrastColor(color);
                      updateFields({
                        branding: {
                          ...data.branding,
                          secondaryColor: color,
                          secondaryTextColor: textColor
                        }
                      });
                    }}
                    required
                  />
                  <Input
                    value={data.branding.secondaryColor}
                    onChange={(e) => {
                      const color = e.target.value;
                      const textColor = getContrastColor(color);
                      updateFields({
                        branding: {
                          ...data.branding,
                          secondaryColor: color,
                          secondaryTextColor: textColor
                        }
                      });
                    }}
                    className="flex-1"
                  />
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="accentColor">Accent Color</Label>
              <div className="flex gap-2">
                <Input
                  id="accentColor"
                  type="color"
                  className="w-12 h-10 p-1"
                  value={data.branding.accentColor || '#f59e0b'}
                  onChange={(e) => {
                    const color = e.target.value;
                    const textColor = getContrastColor(color);
                    updateFields({
                      branding: {
                        ...data.branding,
                        accentColor: color,
                        accentTextColor: textColor
                      }
                    });
                  }}
                />
                <Input
                  value={data.branding.accentColor || '#f59e0b'}
                  onChange={(e) => {
                    const color = e.target.value;
                    const textColor = getContrastColor(color);
                    updateFields({
                      branding: {
                        ...data.branding,
                        accentColor: color,
                        accentTextColor: textColor
                      }
                    });
                  }}
                  className="flex-1"
                />
              </div>
              <p className="text-xs text-muted-foreground">Used for highlights and call-to-action elements</p>
            </div>

            <div className="p-4 border rounded-md mt-4">
              <h3 className="font-medium mb-2">Preview</h3>
              <div className="flex gap-2">
                <div className="w-16 h-8 rounded flex items-center justify-center" style={{ backgroundColor: data.branding.primaryColor, color: data.branding.primaryTextColor || getContrastColor(data.branding.primaryColor) }}>Primary</div>
                <div className="w-16 h-8 rounded flex items-center justify-center" style={{ backgroundColor: data.branding.secondaryColor, color: data.branding.secondaryTextColor || getContrastColor(data.branding.secondaryColor) }}>Secondary</div>
                <div className="w-16 h-8 rounded flex items-center justify-center" style={{ backgroundColor: data.branding.accentColor || '#f59e0b', color: data.branding.accentTextColor || getContrastColor(data.branding.accentColor || '#f59e0b') }}>Accent</div>
              </div>
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
                <p><span className="font-medium">Currency:</span> {data.business.currency}</p>
                <p><span className="font-medium">Timezone:</span> {data.business.timezone}</p>
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
                      className="w-8 h-8 rounded-full border flex items-center justify-center text-xs"
                      style={{ backgroundColor: data.branding.primaryColor, color: data.branding.primaryTextColor || getContrastColor(data.branding.primaryColor) }}
                      title={`Primary: ${data.branding.primaryColor}`}
                    >P</div>
                    <div
                      className="w-8 h-8 rounded-full border flex items-center justify-center text-xs"
                      style={{ backgroundColor: data.branding.secondaryColor, color: data.branding.secondaryTextColor || getContrastColor(data.branding.secondaryColor) }}
                      title={`Secondary: ${data.branding.secondaryColor}`}
                    >S</div>
                    {data.branding.accentColor && (
                      <div
                        className="w-8 h-8 rounded-full border flex items-center justify-center text-xs"
                        style={{ backgroundColor: data.branding.accentColor, color: data.branding.accentTextColor || getContrastColor(data.branding.accentColor) }}
                        title={`Accent: ${data.branding.accentColor}`}
                      >A</div>
                    )}
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

  // Force re-render when open changes
  React.useEffect(() => {
    if (open) {
      console.log('Dialog is now open, resetting form state');
      setCurrentStep(0);
      setData(INITIAL_DATA);
      setError(null);
    }
  }, [open]);

  return (
    <Dialog
      open={open}
      onOpenChange={(newOpen) => {
        console.log(`Dialog onOpenChange called with: ${newOpen}`);
        onOpenChange(newOpen);
      }}
    >
      <DialogContent className="max-w-2xl backdrop-blur">
        <DialogHeader>
          <div className="flex flex-col-reverse lg:flex-row lg:items-center justify-between mb-4">
            <div className="flex items-center space-x-2">
              {steps[currentStep].icon && React.createElement(steps[currentStep].icon, { className: "h-6 w-6 text-primary" })}
              <DialogTitle className="text-2xl">{steps[currentStep].title}</DialogTitle>
            </div>
            <div className="text-sm text-muted-foreground">
              Step {currentStep + 1} of {steps.length}
            </div>
          </div>
          <DialogDescription className="text-base">
            {steps[currentStep].description}
          </DialogDescription>
        </DialogHeader>
        <div className="mt-4">
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
        </div>
      </DialogContent>
    </Dialog>
  );
}