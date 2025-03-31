'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button, Input, Label } from '@loyaltystudio/ui';
import apiClient from '@/lib/api-client';

const steps = [
  {
    id: 'program',
    title: 'Loyalty Program Setup',
    description: 'Configure your loyalty program settings',
  },
  {
    id: 'integration',
    title: 'Integration Setup',
    description: 'Set up your e-commerce platform integration',
  },
  {
    id: 'branding',
    title: 'Branding',
    description: 'Customize your program appearance',
  },
  {
    id: 'review',
    title: 'Review & Launch',
    description: 'Review your settings and launch your program',
  },
];

export default function OnboardingPage() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(0);
  const [formData, setFormData] = useState({
    programName: '',
    programDescription: '',
    defaultPoints: 0,
    platform: '',
    apiKey: '',
    webhookUrl: '',
    logo: '',
    primaryColor: '#000000',
    secondaryColor: '#ffffff',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleNext = async () => {
    setError('');
    setLoading(true);

    try {
      switch (currentStep) {
        case 0: // Program Setup
          await apiClient.post('/loyalty-programs', {
            name: formData.programName,
            description: formData.programDescription,
            defaultRules: [
              {
                name: 'Default Points',
                description: 'Default points awarded for actions',
                conditions: [],
                points: formData.defaultPoints,
              },
            ],
          });
          break;
        case 1: // Integration Setup
          // Generate API key
          const apiKeyResponse = await apiClient.post('/api-keys', {
            name: 'Default Integration Key',
          });
          setFormData({
            ...formData,
            apiKey: apiKeyResponse.data.data.key,
          });
          break;
        case 2: // Branding
          // Update merchant branding
          await apiClient.patch('/merchants/current', {
            branding: {
              logo: formData.logo,
              primaryColor: formData.primaryColor,
              secondaryColor: formData.secondaryColor,
            },
          });
          break;
        case 3: // Review & Launch
          // Launch the program
          await apiClient.post('/loyalty-programs/launch', {
            programId: 'current',
          });
          break;
      }

      if (currentStep < steps.length - 1) {
        setCurrentStep(currentStep + 1);
      } else {
        router.push('/merchant/dashboard');
      }
    } catch (err: any) {
      setError(err.response?.data?.error || 'Setup failed');
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 0:
        return (
          <div className="space-y-4">
            <div>
              <Label htmlFor="programName">Program Name</Label>
              <Input
                id="programName"
                name="programName"
                type="text"
                required
                value={formData.programName}
                onChange={handleChange}
              />
            </div>
            <div>
              <Label htmlFor="programDescription">Program Description</Label>
              <Input
                id="programDescription"
                name="programDescription"
                type="text"
                required
                value={formData.programDescription}
                onChange={handleChange}
              />
            </div>
            <div>
              <Label htmlFor="defaultPoints">Default Points</Label>
              <Input
                id="defaultPoints"
                name="defaultPoints"
                type="number"
                required
                value={formData.defaultPoints}
                onChange={handleChange}
              />
            </div>
          </div>
        );
      case 1:
        return (
          <div className="space-y-4">
            <div>
              <Label htmlFor="platform">E-commerce Platform</Label>
              <Input
                id="platform"
                name="platform"
                type="text"
                required
                value={formData.platform}
                onChange={handleChange}
              />
            </div>
            {formData.apiKey && (
              <div>
                <Label>API Key</Label>
                <div className="mt-1 p-2 bg-gray-100 rounded">
                  <code>{formData.apiKey}</code>
                </div>
              </div>
            )}
            <div>
              <Label htmlFor="webhookUrl">Webhook URL</Label>
              <Input
                id="webhookUrl"
                name="webhookUrl"
                type="text"
                value={formData.webhookUrl}
                onChange={handleChange}
              />
            </div>
          </div>
        );
      case 2:
        return (
          <div className="space-y-4">
            <div>
              <Label htmlFor="logo">Logo URL</Label>
              <Input
                id="logo"
                name="logo"
                type="text"
                value={formData.logo}
                onChange={handleChange}
              />
            </div>
            <div>
              <Label htmlFor="primaryColor">Primary Color</Label>
              <Input
                id="primaryColor"
                name="primaryColor"
                type="color"
                value={formData.primaryColor}
                onChange={handleChange}
              />
            </div>
            <div>
              <Label htmlFor="secondaryColor">Secondary Color</Label>
              <Input
                id="secondaryColor"
                name="secondaryColor"
                type="color"
                value={formData.secondaryColor}
                onChange={handleChange}
              />
            </div>
          </div>
        );
      case 3:
        return (
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Review Your Setup</h3>
            <div className="bg-gray-50 p-4 rounded">
              <h4 className="font-medium">Program Details</h4>
              <p>Name: {formData.programName}</p>
              <p>Description: {formData.programDescription}</p>
              <p>Default Points: {formData.defaultPoints}</p>
            </div>
            <div className="bg-gray-50 p-4 rounded">
              <h4 className="font-medium">Integration</h4>
              <p>Platform: {formData.platform}</p>
              <p>Webhook URL: {formData.webhookUrl}</p>
            </div>
            <div className="bg-gray-50 p-4 rounded">
              <h4 className="font-medium">Branding</h4>
              <p>Logo: {formData.logo}</p>
              <p>Primary Color: {formData.primaryColor}</p>
              <p>Secondary Color: {formData.secondaryColor}</p>
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        <div className="mb-8">
          <div className="flex items-center justify-between">
            {steps.map((step, index) => (
              <div
                key={step.id}
                className={`flex items-center ${
                  index < steps.length - 1 ? 'flex-1' : ''
                }`}
              >
                <div
                  className={`flex items-center justify-center w-8 h-8 rounded-full ${
                    index <= currentStep
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-200 text-gray-600'
                  }`}
                >
                  {index + 1}
                </div>
                {index < steps.length - 1 && (
                  <div
                    className={`flex-1 h-1 mx-4 ${
                      index < currentStep ? 'bg-blue-600' : 'bg-gray-200'
                    }`}
                  />
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white shadow rounded-lg p-6">
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-gray-900">
              {steps[currentStep]?.title}
            </h2>
            <p className="mt-1 text-sm text-gray-500">
              {steps[currentStep]?.description}
            </p>
          </div>
          </div>

          {error && (
            <div className="mb-4 rounded-md bg-red-50 p-4">
              <div className="text-sm text-red-700">{error}</div>
            </div>
          )}

          {renderStepContent()}

          <div className="mt-6 flex justify-between">
            <Button
              onClick={handleBack}
              disabled={currentStep === 0}
              variant="outline"
            >
              Back
            </Button>
            <Button
              onClick={handleNext}
              disabled={loading}
            >
              {loading
                ? 'Processing...'
                : currentStep === steps.length - 1
                ? 'Launch Program'
                : 'Next'}
            </Button>
          </div>
        </div>
      </div>
  );
} 