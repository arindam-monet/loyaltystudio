import { useState } from "react";
import {
  Card,
  CardContent,

  CardHeader,
  CardTitle,
  Button,
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  Input,
  Textarea,
  Switch,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Progress,

  Alert,
  AlertDescription,
  AlertTitle,
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@loyaltystudio/ui";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { SimpleRuleBuilder } from "./simple-rule-builder";
import { SimpleTierManager } from "./simple-tier-manager";
import { SimpleRewardManager } from "./simple-reward-manager";

import {
  CheckCircle2,
  HelpCircle,
  AlertCircle,
  ChevronRight
} from 'lucide-react';

// Basic info schema
const basicInfoSchema = z.object({
  name: z.string().min(1, "Name is required"),
  description: z.string().min(1, "Description is required"),
  settings: z.object({
    pointsName: z.string().min(1, "Points name is required"),
    currency: z.string().min(1, "Currency is required"),
    timezone: z.string().min(1, "Timezone is required"),
  }),
  isActive: z.boolean().default(true),
});

// Simple rule schema for initial setup
const simpleRuleSchema = z.object({
  name: z.string().min(1, "Name is required"),
  type: z.enum(["FIXED", "PERCENTAGE"]),
  points: z.number().min(1, "Points must be at least 1"),
  minAmount: z.number().optional(),
});

// Program schema
const programSchema = z.object({
  basicInfo: basicInfoSchema,
  rules: z.array(simpleRuleSchema).min(1, "At least one rule is required"),
  tiers: z.array(z.any()).default([]),
  rewards: z.array(z.any()).default([]),
});

// Form data types
export type BasicInfoData = z.infer<typeof basicInfoSchema>;
export type SimpleRuleData = z.infer<typeof simpleRuleSchema>;
export type ProgramFormData = z.infer<typeof programSchema>;

interface GuidedProgramWizardProps {
  onSubmit: (data: ProgramFormData) => Promise<void>;
  onCancel: () => void;
}

export function GuidedProgramWizard({ onSubmit, onCancel }: GuidedProgramWizardProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [completionPercentage, setCompletionPercentage] = useState(0);

  const steps = [
    { id: "basics", title: "Basic Information", isRequired: true },
    { id: "rules", title: "Point Earning Rules", isRequired: true },
    { id: "rewards", title: "Rewards", isRequired: false },
    { id: "tiers", title: "Membership Tiers", isRequired: false },
    { id: "review", title: "Review & Launch", isRequired: true },
  ];

  const defaultValues: ProgramFormData = {
    basicInfo: {
      name: "",
      description: "",
      settings: {
        pointsName: "points",
        currency: "USD",
        timezone: "UTC",
      },
      isActive: true,
    },
    rules: [
      {
        name: "Base Points",
        type: "FIXED",
        points: 1,
        minAmount: 0,
      },
    ],
    tiers: [],
    rewards: [],
  };

  const form = useForm({
    resolver: zodResolver(programSchema),
    defaultValues,
    mode: "onChange",
  });

  const watchBasicInfo = form.watch("basicInfo");
  const watchRules = form.watch("rules");
  const watchTiers = form.watch("tiers");
  const watchRewards = form.watch("rewards");

  // Calculate completion percentage
  const calculateCompletion = () => {
    let completed = 0;
    let total = 0;

    // Basic info (required)
    if (watchBasicInfo.name && watchBasicInfo.description) {
      completed += 1;
    }
    total += 1;

    // Rules (required)
    if (watchRules.length > 0) {
      completed += 1;
    }
    total += 1;

    // Rewards (optional)
    if (watchRewards && watchRewards.length > 0) {
      completed += 1;
    }
    total += 1;

    // Tiers (optional)
    if (watchTiers && watchTiers.length > 0) {
      completed += 1;
    }
    total += 1;

    const percentage = Math.round((completed / total) * 100);
    setCompletionPercentage(percentage);
    return percentage;
  };

  // Update completion percentage when form values change
  useState(() => {
    calculateCompletion();
  });

  const handleSubmit = async (data: ProgramFormData) => {
    try {
      setIsLoading(true);
      await onSubmit(data);
    } catch (error) {
      console.error("Failed to create program:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const onFormSubmit = form.handleSubmit((data) => handleSubmit(data as ProgramFormData));

  const nextStep = () => {
    calculateCompletion();
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    } else {
      onCancel();
    }
  };

  const isStepComplete = (stepIndex: number) => {
    switch (stepIndex) {
      case 0: // Basic Info
        return !!watchBasicInfo.name && !!watchBasicInfo.description;
      case 1: // Rules
        return watchRules.length > 0;
      case 2: // Rewards
        return true; // Optional
      case 3: // Tiers
        return true; // Optional
      case 4: // Review
        return true;
      default:
        return false;
    }
  };

  const canProceed = isStepComplete(currentStep);

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <div className="flex justify-end items-center">
          {/* <h2 className="text-xl font-semibold">Create Loyalty Program</h2> */}
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">
              {completionPercentage}% Complete
            </span>
            <Progress value={completionPercentage} className="w-24" />
          </div>
        </div>
      </div>

      <div className="flex gap-6">
        {/* Step Navigation */}
        <div className="w-64 space-y-2">
          <div className="font-medium mb-4">Program Setup</div>
          {steps.map((step, index) => (
            <div
              key={step.id}
              className={`flex items-center gap-2 p-2 rounded-md cursor-pointer ${currentStep === index
                ? "bg-primary/10 text-primary"
                : "hover:bg-muted"
                }`}
              onClick={() => {
                // Only allow navigation to completed steps or the current step + 1
                if (
                  index <= currentStep + 1 &&
                  (index === 0 || isStepComplete(index - 1))
                ) {
                  setCurrentStep(index);
                }
              }}
            >
              <div
                className={`w-6 h-6 rounded-full flex items-center justify-center text-xs ${isStepComplete(index)
                  ? "bg-primary text-primary-foreground"
                  : currentStep === index
                    ? "border-2 border-primary text-primary"
                    : "bg-muted text-muted-foreground"
                  }`}
              >
                {isStepComplete(index) ? (
                  <CheckCircle2 className="w-4 h-4" />
                ) : (
                  index + 1
                )}
              </div>
              <span
                className={`text-sm ${currentStep === index ? "font-medium" : ""
                  }`}
              >
                {step.title}
              </span>
              {step.isRequired && (
                <span className="text-xs text-red-500">*</span>
              )}
            </div>
          ))}

          <div className="pt-6">
            <Alert className="bg-muted/50">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Quick Start</AlertTitle>
              <AlertDescription className="text-xs">
                Complete the required steps to launch your program. You can
                enhance it with additional features later.
              </AlertDescription>
            </Alert>
          </div>
        </div>

        {/* Step Content */}
        <div className="flex-1">
          <Form {...form}>
            <form onSubmit={onFormSubmit} className="space-y-6">
              {/* Step 1: Basic Information */}
              {currentStep === 0 && (
                <div className="space-y-4">
                  <div className="border-b pb-2">
                    <h3 className="text-lg font-medium">Basic Information</h3>
                    <p className="text-sm text-muted-foreground">
                      Set up the core details of your loyalty program.
                    </p>
                  </div>

                  <FormField
                    control={form.control}
                    name="basicInfo.name"
                    render={({ field }) => (
                      <FormItem>
                        <div className="flex justify-between">
                          <FormLabel>Program Name</FormLabel>
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <HelpCircle className="h-4 w-4 text-muted-foreground" />
                              </TooltipTrigger>
                              <TooltipContent>
                                <p className="w-80">
                                  Choose a memorable name that reflects your brand and the value of your program.
                                  Examples: "Star Rewards", "VIP Club", "Loyalty Points"
                                </p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        </div>
                        <FormControl>
                          <Input {...field} placeholder="Enter program name" />
                        </FormControl>
                        <FormDescription>
                          This is how your program will appear to customers.
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="basicInfo.description"
                    render={({ field }) => (
                      <FormItem>
                        <div className="flex justify-between">
                          <FormLabel>Description</FormLabel>
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <HelpCircle className="h-4 w-4 text-muted-foreground" />
                              </TooltipTrigger>
                              <TooltipContent>
                                <p className="w-80">
                                  Briefly explain how your program works and its benefits.
                                  Keep it concise and highlight the main value proposition.
                                </p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        </div>
                        <FormControl>
                          <Textarea
                            {...field}
                            placeholder="Enter program description"
                          />
                        </FormControl>
                        <FormDescription>
                          Explain how your program works and its benefits.
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="basicInfo.settings.pointsName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Points Name</FormLabel>
                          <FormControl>
                            <Input
                              {...field}
                              placeholder="points, stars, coins, etc."
                            />
                          </FormControl>
                          <FormDescription>
                            What you'll call your loyalty currency.
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="basicInfo.settings.currency"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Currency</FormLabel>
                          <Select
                            onValueChange={field.onChange}
                            defaultValue={field.value}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select currency" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="USD">USD ($)</SelectItem>
                              <SelectItem value="EUR">EUR (€)</SelectItem>
                              <SelectItem value="GBP">GBP (£)</SelectItem>
                              <SelectItem value="INR">INR (₹)</SelectItem>
                              <SelectItem value="JPY">JPY (¥)</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormDescription>
                            Primary currency for transactions.
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="basicInfo.isActive"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                        <div className="space-y-0.5">
                          <FormLabel className="text-base">
                            Activate Program
                          </FormLabel>
                          <FormDescription>
                            Make this program available immediately after creation.
                          </FormDescription>
                        </div>
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                </div>
              )}

              {/* Step 2: Point Earning Rules */}
              {currentStep === 1 && (
                <div className="space-y-4">
                  <div className="border-b pb-2">
                    <h3 className="text-lg font-medium">Point Earning Rules</h3>
                    <p className="text-sm text-muted-foreground">
                      Define how customers earn points in your program.
                    </p>
                  </div>

                  <SimpleRuleBuilder
                    rules={form.watch("rules")}
                    onRulesChange={(rules: any) => form.setValue("rules", rules)}
                  />

                  <Alert>
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                      You can add more complex rules after creating your program.
                    </AlertDescription>
                  </Alert>
                </div>
              )}

              {/* Step 3: Rewards (Optional) */}
              {currentStep === 2 && (
                <div className="space-y-4">
                  <div className="border-b pb-2">
                    <div className="flex justify-between">
                      <div>
                        <h3 className="text-lg font-medium">Rewards (Optional)</h3>
                        <p className="text-sm text-muted-foreground">
                          Create rewards that customers can redeem with their points.
                        </p>
                      </div>
                      <div className="px-2 py-1 bg-muted text-xs rounded-md">
                        Optional
                      </div>
                    </div>
                  </div>

                  <SimpleRewardManager
                    rewards={form.watch("rewards")}
                    onRewardsChange={(rewards: any) => form.setValue("rewards", rewards)}
                  />

                  <Alert>
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                      You can add more rewards after creating your program.
                    </AlertDescription>
                  </Alert>
                </div>
              )}

              {/* Step 4: Membership Tiers (Optional) */}
              {currentStep === 3 && (
                <div className="space-y-4">
                  <div className="border-b pb-2">
                    <div className="flex justify-between">
                      <div>
                        <h3 className="text-lg font-medium">Membership Tiers (Optional)</h3>
                        <p className="text-sm text-muted-foreground">
                          Create tiers to reward your most loyal customers.
                        </p>
                      </div>
                      <div className="px-2 py-1 bg-muted text-xs rounded-md">
                        Optional
                      </div>
                    </div>
                  </div>

                  <SimpleTierManager
                    tiers={form.watch("tiers")}
                    onTiersChange={(tiers: any) => form.setValue("tiers", tiers)}
                  />

                  <Alert>
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                      You can add more tiers after creating your program.
                    </AlertDescription>
                  </Alert>
                </div>
              )}

              {/* Step 5: Review & Launch */}
              {currentStep === 4 && (
                <div className="space-y-6">
                  <div className="border-b pb-2">
                    <h3 className="text-lg font-medium">Review & Launch</h3>
                    <p className="text-sm text-muted-foreground">
                      Review your program details before launching.
                    </p>
                  </div>

                  <div className="space-y-4">
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-base">Basic Information</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <dl className="grid grid-cols-2 gap-4 text-sm">
                          <div>
                            <dt className="font-medium">Program Name</dt>
                            <dd>{watchBasicInfo.name}</dd>
                          </div>
                          <div>
                            <dt className="font-medium">Points Name</dt>
                            <dd>{watchBasicInfo.settings.pointsName}</dd>
                          </div>
                          <div className="col-span-2">
                            <dt className="font-medium">Description</dt>
                            <dd>{watchBasicInfo.description}</dd>
                          </div>
                          <div>
                            <dt className="font-medium">Status</dt>
                            <dd>
                              {watchBasicInfo.isActive ? (
                                <span className="text-green-600 font-medium">Active</span>
                              ) : (
                                <span className="text-amber-600 font-medium">Inactive</span>
                              )}
                            </dd>
                          </div>
                          <div>
                            <dt className="font-medium">Currency</dt>
                            <dd>{watchBasicInfo.settings.currency}</dd>
                          </div>
                        </dl>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-base">Point Earning Rules</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <ul className="space-y-2">
                          {watchRules.map((rule, index) => (
                            <li key={index} className="text-sm">
                              <span className="font-medium">{rule.name}:</span>{" "}
                              {rule.type === "FIXED"
                                ? `${rule.points} ${watchBasicInfo.settings.pointsName} per purchase`
                                : `${rule.points}% of purchase value in ${watchBasicInfo.settings.pointsName}`}
                              {rule.minAmount && rule.minAmount > 0
                                ? ` (minimum purchase: ${watchBasicInfo.settings.currency} ${rule.minAmount})`
                                : ""}
                            </li>
                          ))}
                        </ul>
                      </CardContent>
                    </Card>

                    {watchRewards && watchRewards.length > 0 && (
                      <Card>
                        <CardHeader className="pb-2">
                          <CardTitle className="text-base">Rewards</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <ul className="space-y-2">
                            {watchRewards && watchRewards.map((reward, index) => (
                              <li key={index} className="text-sm">
                                <span className="font-medium">{reward.name}:</span>{" "}
                                {reward.pointsCost} {watchBasicInfo.settings.pointsName}
                              </li>
                            ))}
                          </ul>
                        </CardContent>
                      </Card>
                    )}

                    {watchTiers && watchTiers.length > 0 && (
                      <Card>
                        <CardHeader className="pb-2">
                          <CardTitle className="text-base">Membership Tiers</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <ul className="space-y-2">
                            {watchTiers && watchTiers.map((tier, index) => (
                              <li key={index} className="text-sm">
                                <span className="font-medium">{tier.name}:</span>{" "}
                                {tier.pointsThreshold} {watchBasicInfo.settings.pointsName} required
                              </li>
                            ))}
                          </ul>
                        </CardContent>
                      </Card>
                    )}

                    <Alert className="bg-muted/50">
                      <AlertCircle className="h-4 w-4" />
                      <AlertTitle>Next Steps</AlertTitle>
                      <AlertDescription>
                        After creating your program, you can:
                        <ul className="list-disc pl-5 mt-2 space-y-1 text-sm">
                          <li>Add more complex rules using the rule builder</li>
                          <li>Create additional rewards and tiers</li>
                          <li>Set up campaigns and promotions</li>
                          <li>Customize customer communications</li>
                        </ul>
                      </AlertDescription>
                    </Alert>
                  </div>
                </div>
              )}

              <div className="flex justify-between pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={prevStep}
                >
                  {currentStep === 0 ? "Cancel" : "Back"}
                </Button>

                {currentStep === steps.length - 1 ? (
                  <Button type="submit" disabled={isLoading || !canProceed}>
                    {isLoading ? "Creating..." : "Create Program"}
                  </Button>
                ) : (
                  <Button
                    type="button"
                    onClick={nextStep}
                    disabled={!canProceed}
                  >
                    Next <ChevronRight className="ml-2 h-4 w-4" />
                  </Button>
                )}
              </div>
            </form>
          </Form>
        </div>
      </div>
    </div>
  );
}
