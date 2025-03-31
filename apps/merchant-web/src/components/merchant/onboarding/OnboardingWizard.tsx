"use client";

import { useState } from "react";
import { Button } from "@loyaltystudio/ui";
import { ArrowLeft, ArrowRight, CheckCircle2 } from "lucide-react";
import { BusinessInfoForm } from "./steps/BusinessInfoForm";
import { ProgramSetupForm } from "./steps/ProgramSetupForm";
import { TeamSetupForm } from "./steps/TeamSetupForm";
import { IntegrationSetupForm } from "./steps/IntegrationSetupForm";
import { BrandingSetupForm } from "./steps/BrandingSetupForm";
import { ReviewForm } from "./steps/ReviewForm";
import { useRouter } from "next/navigation";

const steps = [
  { id: "business", title: "Business Info" },
  { id: "program", title: "Program Setup" },
  { id: "team", title: "Team Setup" },
  { id: "integration", title: "Integration" },
  { id: "branding", title: "Branding" },
  { id: "review", title: "Review" },
];

interface FormData {
  businessInfo: {
    name?: string;
    email?: string;
    phone?: string;
    industry?: string;
    size?: string;
    address?: string;
    city?: string;
    state?: string;
    country?: string;
    postalCode?: string;
  };
  programSetup: {
    name?: string;
    type?: string;
    pointsRate?: string;
    minimumPoints?: string;
    maximumPoints?: string;
    pointsExpiration?: string;
    tieredProgram?: boolean;
    tiers?: Array<{
      name: string;
      pointsRequired: string;
      benefits: string;
    }>;
    description?: string;
  };
  teamSetup: {
    teamMembers?: Array<{
      name: string;
      email: string;
      role: string;
    }>;
  };
  integration: {
    platform?: string;
    apiKey?: string;
    webhookUrl?: string;
    webhookSecret?: string;
    testMode?: boolean;
    autoSync?: boolean;
  };
  branding: {
    logo?: string;
    primaryColor?: string;
    secondaryColor?: string;
    accentColor?: string;
    emailTemplate?: {
      header?: string;
      footer?: string;
      backgroundColor?: string;
      textColor?: string;
    };
    customCss?: string;
  };
}

export function OnboardingWizard() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(0);
  const [formData, setFormData] = useState<FormData>({
    businessInfo: {},
    programSetup: {},
    teamSetup: {},
    integration: {},
    branding: {},
  });

  const validateStep = (step: number): boolean => {
    switch (step) {
      case 0: // Business Info
        return !!(
          formData.businessInfo.name &&
          formData.businessInfo.email &&
          formData.businessInfo.phone &&
          formData.businessInfo.industry &&
          formData.businessInfo.size
        );
      case 1: // Program Setup
        return !!(
          formData.programSetup.name &&
          formData.programSetup.type &&
          formData.programSetup.pointsRate &&
          formData.programSetup.minimumPoints &&
          formData.programSetup.maximumPoints
        );
      case 2: // Team Setup
        return !!(
          formData.teamSetup.teamMembers &&
          formData.teamSetup.teamMembers.length > 0 &&
          formData.teamSetup.teamMembers.every(
            (member) => member.name && member.email && member.role
          )
        );
      case 3: // Integration
        return !!(
          formData.integration.platform &&
          formData.integration.apiKey &&
          formData.integration.webhookUrl
        );
      case 4: // Branding
        return !!(
          formData.branding.primaryColor &&
          formData.branding.secondaryColor &&
          formData.branding.accentColor
        );
      default:
        return true;
    }
  };

  const handleNext = () => {
    if (currentStep < steps.length - 1 && validateStep(currentStep)) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleEdit = (step: number) => {
    setCurrentStep(step);
  };

  const handleSubmit = async () => {
    try {
      // TODO: Implement API call to save the data
      console.log("Form submitted:", formData);

      // Redirect to the merchant dashboard
      router.push("/merchant/dashboard");
    } catch (error) {
      console.error("Error submitting form:", error);
      // TODO: Show error toast
    }
  };

  const renderStep = () => {
    switch (currentStep) {
      case 0:
        return (
          <BusinessInfoForm
            data={formData.businessInfo}
            onChange={(data) =>
              setFormData({ ...formData, businessInfo: data })
            }
          />
        );
      case 1:
        return (
          <ProgramSetupForm
            data={formData.programSetup}
            onChange={(data) =>
              setFormData({ ...formData, programSetup: data })
            }
          />
        );
      case 2:
        return (
          <TeamSetupForm
            data={formData.teamSetup}
            onChange={(data) => setFormData({ ...formData, teamSetup: data })}
          />
        );
      case 3:
        return (
          <IntegrationSetupForm
            data={formData.integration}
            onChange={(data) => setFormData({ ...formData, integration: data })}
          />
        );
      case 4:
        return (
          <BrandingSetupForm
            data={formData.branding}
            onChange={(data) => setFormData({ ...formData, branding: data })}
          />
        );
      case 5:
        return <ReviewForm data={formData} onEdit={handleEdit} />;
      default:
        return null;
    }
  };

  return (
    <div className="mx-auto max-w-4xl">
      {/* Progress Bar */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          {steps.map((step, index) => (
            <div key={step.id} className="flex items-center">
              <div
                className={`flex h-8 w-8 items-center justify-center rounded-full border ${
                  index <= currentStep
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-muted-foreground text-muted-foreground"
                }`}
              >
                {index < currentStep ? (
                  <CheckCircle2 className="h-4 w-4" />
                ) : (
                  <span>{index + 1}</span>
                )}
              </div>
              {index < steps.length - 1 && (
                <div
                  className={`h-0.5 w-16 ${
                    index < currentStep ? "bg-primary" : "bg-muted-foreground"
                  }`}
                />
              )}
            </div>
          ))}
        </div>
        <div className="mt-4 flex justify-between">
          {steps.map((step) => (
            <span
              key={step.id}
              className={`text-sm ${
                steps[currentStep].id === step.id
                  ? "font-semibold text-primary"
                  : "text-muted-foreground"
              }`}
            >
              {step.title}
            </span>
          ))}
        </div>
      </div>

      {/* Form Content */}
      <div className="rounded-lg border bg-card p-6">{renderStep()}</div>

      {/* Navigation Buttons */}
      <div className="mt-8 flex justify-between">
        <Button
          variant="outline"
          onClick={handleBack}
          disabled={currentStep === 0}
          className="gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Back
        </Button>
        {currentStep === steps.length - 1 ? (
          <Button onClick={handleSubmit} className="gap-2">
            Complete Setup
          </Button>
        ) : (
          <Button
            onClick={handleNext}
            disabled={!validateStep(currentStep)}
            className="gap-2"
          >
            Next
            <ArrowRight className="h-4 w-4" />
          </Button>
        )}
      </div>
    </div>
  );
}
