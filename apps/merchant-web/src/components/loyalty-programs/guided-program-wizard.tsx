import { useState, useEffect } from "react";
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
} from "@loyaltystudio/ui";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { SimpleRuleBuilder } from "./simple-rule-builder";
import { TierManagerWrapper } from "./tier-manager-wrapper";
import { SimpleRewardManager } from "./simple-reward-manager";
import { useMerchantStore } from "@/lib/stores/merchant-store";

import {
  CheckCircle2,
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

// Rule schema
const ruleSchema = z.object({
  name: z.string().min(1, "Rule name is required"),
  type: z.enum(["FIXED", "PERCENTAGE"]),
  points: z.number().min(1, "Points must be at least 1"),
  minAmount: z.number().optional(),
});

// Tier schema
const tierSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(1, "Tier name is required"),
  description: z.string().optional(),
  pointsThreshold: z.number().min(0, "Points threshold must be at least 0"),
  benefits: z.array(z.string()).default([]),
});

// Reward schema
const rewardSchema = z.object({
  name: z.string().min(1, "Reward name is required"),
  description: z.string().min(1, "Description is required"),
  type: z.enum(["PHYSICAL", "DIGITAL", "EXPERIENCE", "COUPON"]),
  pointsCost: z.number().min(1, "Points cost must be at least 1"),
  stock: z.number().optional(),
  validityPeriod: z.number().optional(),
  redemptionLimit: z.number().optional(),
});

// Program schema
const programSchema = z.object({
  basicInfo: basicInfoSchema,
  rules: z.array(ruleSchema).min(1, "At least one rule is required"),
  tiers: z.array(tierSchema),
  rewards: z.array(rewardSchema),
});

export type ProgramFormData = z.infer<typeof programSchema>;

interface GuidedProgramWizardProps {
  onSubmit: (data: ProgramFormData) => Promise<void>;
  onCancel?: () => void;
  isSubmitting?: boolean;
  error?: string | null;
}

export function GuidedProgramWizard({ onSubmit, onCancel, isSubmitting, error }: GuidedProgramWizardProps) {
  const [step, setStep] = useState(0);
  const { selectedMerchant } = useMerchantStore();

  const steps = [
    { id: "basics", title: "Basic Information", isRequired: true },
    { id: "rules", title: "Point Earning Rules", isRequired: true },
    { id: "rewards", title: "Rewards", isRequired: false },
    { id: "tiers", title: "Membership Tiers", isRequired: false },
    { id: "review", title: "Review & Launch", isRequired: true },
  ];

  // Get merchant currency and timezone if available
  const merchantCurrency = typeof selectedMerchant === 'object' && selectedMerchant ?
    (selectedMerchant as any).currency || 'USD' : 'USD';
  const merchantTimezone = typeof selectedMerchant === 'object' && selectedMerchant ?
    (selectedMerchant as any).timezone || 'UTC' : 'UTC';

  const defaultValues: ProgramFormData = {
    basicInfo: {
      name: "",
      description: "",
      settings: {
        pointsName: "points",
        currency: merchantCurrency,
        timezone: merchantTimezone,
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
    tiers: [
      // Initialize with a default tier to avoid type errors
      {
        id: 'default-tier',
        name: 'Bronze',
        description: 'Starting tier',
        pointsThreshold: 0,
        benefits: [] // Empty array, not undefined
      }
    ],
    rewards: [],
  };

  const form = useForm({
    resolver: zodResolver(programSchema),
    defaultValues,
    mode: "onChange",
  });

  // Update currency and timezone when merchant changes
  useEffect(() => {
    if (selectedMerchant && typeof selectedMerchant === 'object') {
      const merchant = selectedMerchant as any;
      if (merchant.currency) {
        form.setValue('basicInfo.settings.currency', merchant.currency);
      }
      if (merchant.timezone) {
        form.setValue('basicInfo.settings.timezone', merchant.timezone);
      }
    }

    // Initialize form with empty tiers array but ensure each tier has a benefits array
    form.setValue('tiers', []);
  }, [selectedMerchant, form]);

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
    if (watchRewards.length > 0) {
      completed += 1;
    }
    total += 1;

    // Tiers (optional)
    if (watchTiers.length > 0) {
      completed += 1;
    }
    total += 1;

    return Math.round((completed / total) * 100);
  };

  const completion = calculateCompletion();

  const nextStep = () => {
    if (step < steps.length - 1) {
      setStep(step + 1);
    }
  };

  const prevStep = () => {
    if (step > 0) {
      setStep(step - 1);
    }
  };

  const handleSubmit = async (data: ProgramFormData) => {
    try {
      await onSubmit(data);
    } catch (error) {
      console.error("Error submitting form:", error);
    }
  };

  const renderStep = () => {
    switch (step) {
      case 0: // Basic Information
        return (
          <div className="space-y-6">
            <FormField
              control={form.control}
              name="basicInfo.name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Program Name *</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g. VIP Rewards Club" {...field} />
                  </FormControl>
                  <FormDescription>
                    Choose a name that reflects your brand and is easy for customers to remember.
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
                  <FormLabel>Program Description *</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Describe your loyalty program..."
                      className="min-h-[100px]"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    Explain the benefits of your program to customers.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="basicInfo.settings.pointsName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Points Name *</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g. Points, Stars, Coins" {...field} />
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
                    <FormLabel>Currency *</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                      value={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select currency" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="USD">USD - US Dollar</SelectItem>
                        <SelectItem value="EUR">EUR - Euro</SelectItem>
                        <SelectItem value="GBP">GBP - British Pound</SelectItem>
                        <SelectItem value="JPY">JPY - Japanese Yen</SelectItem>
                        <SelectItem value="AUD">AUD - Australian Dollar</SelectItem>
                        <SelectItem value="CAD">CAD - Canadian Dollar</SelectItem>
                        <SelectItem value="CHF">CHF - Swiss Franc</SelectItem>
                        <SelectItem value="CNY">CNY - Chinese Yuan</SelectItem>
                        <SelectItem value="INR">INR - Indian Rupee</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormDescription>
                      The currency used for transactions.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="basicInfo.settings.timezone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Timezone *</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                      value={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select timezone" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="UTC">UTC</SelectItem>
                        <SelectItem value="America/New_York">Eastern Time (ET)</SelectItem>
                        <SelectItem value="America/Chicago">Central Time (CT)</SelectItem>
                        <SelectItem value="America/Denver">Mountain Time (MT)</SelectItem>
                        <SelectItem value="America/Los_Angeles">Pacific Time (PT)</SelectItem>
                        <SelectItem value="Europe/London">London (GMT)</SelectItem>
                        <SelectItem value="Europe/Paris">Central European Time (CET)</SelectItem>
                        <SelectItem value="Asia/Kolkata">India (IST)</SelectItem>
                        <SelectItem value="Asia/Tokyo">Japan Time (JST)</SelectItem>
                        <SelectItem value="Asia/Shanghai">China Time (CST)</SelectItem>
                        <SelectItem value="Australia/Sydney">Australian Eastern Time (AET)</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormDescription>
                      The timezone for your program's operations.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="basicInfo.isActive"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <FormLabel className="text-base">Active Status</FormLabel>
                      <FormDescription>
                        Is this program active and visible to customers?
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
          </div>
        );

      case 1: // Rules
        return (
          <SimpleRuleBuilder
            rules={watchRules}
            onRulesChange={(rules) => form.setValue("rules", rules)}
          />
        );

      case 2: // Rewards
        return (
          <SimpleRewardManager
            rewards={watchRewards}
            onRewardsChange={(rewards) => form.setValue("rewards", rewards)}
          />
        );

      case 3: // Tiers
        return (
          <TierManagerWrapper
            tiers={watchTiers}
            onTiersChange={(tiers) => form.setValue("tiers", tiers)}
          />
        );

      case 4: // Review
        return (
          <div className="space-y-6">
            <div className="rounded-lg border p-4">
              <h3 className="text-lg font-medium mb-2">Basic Information</h3>
              <div className="space-y-2">
                <p><strong>Name:</strong> {watchBasicInfo.name}</p>
                <p><strong>Description:</strong> {watchBasicInfo.description}</p>
                <p><strong>Points Name:</strong> {watchBasicInfo.settings.pointsName}</p>
                <p><strong>Currency:</strong> {watchBasicInfo.settings.currency}</p>
                <p><strong>Timezone:</strong> {watchBasicInfo.settings.timezone}</p>
                <p><strong>Status:</strong> {watchBasicInfo.isActive ? "Active" : "Inactive"}</p>
              </div>
            </div>

            <div className="rounded-lg border p-4">
              <h3 className="text-lg font-medium mb-2">Rules ({watchRules.length})</h3>
              {watchRules.length > 0 ? (
                <ul className="list-disc pl-5 space-y-1">
                  {watchRules.map((rule, index) => (
                    <li key={index}>
                      <strong>{rule.name}:</strong> {rule.type === "FIXED" ? `${rule.points} points` : `${rule.points}% of purchase`}
                      {rule.minAmount !== undefined && rule.minAmount > 0 && ` (min: ${watchBasicInfo.settings.currency} ${rule.minAmount})`}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-muted-foreground">No rules defined</p>
              )}
            </div>

            <div className="rounded-lg border p-4">
              <h3 className="text-lg font-medium mb-2">Rewards ({watchRewards.length})</h3>
              {watchRewards.length > 0 ? (
                <ul className="list-disc pl-5 space-y-1">
                  {watchRewards.map((reward, index) => (
                    <li key={index}>
                      <strong>{reward.name}:</strong> {reward.pointsCost} {watchBasicInfo.settings.pointsName}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-muted-foreground">No rewards defined</p>
              )}
            </div>

            <div className="rounded-lg border p-4">
              <h3 className="text-lg font-medium mb-2">Tiers ({watchTiers.length})</h3>
              {watchTiers.length > 0 ? (
                <ul className="list-disc pl-5 space-y-1">
                  {watchTiers.map((tier, index) => (
                    <li key={index}>
                      <strong>{tier.name}:</strong> {tier.pointsThreshold} {watchBasicInfo.settings.pointsName}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-muted-foreground">No tiers defined</p>
              )}
            </div>

            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Error</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)}>
        <Card>
          <CardHeader>
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <CardTitle className="text-xl">{steps[step].title}</CardTitle>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">
                  Step {step + 1} of {steps.length}
                </span>
                <Progress value={completion} className="w-[100px]" />
                <span className="text-sm text-muted-foreground">{completion}%</span>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {renderStep()}

            <div className="flex justify-between mt-6">
              {step === 0 && onCancel ? (
                <Button
                  type="button"
                  variant="outline"
                  onClick={onCancel}
                  disabled={isSubmitting}
                >
                  Cancel
                </Button>
              ) : (
                <Button
                  type="button"
                  variant="outline"
                  onClick={prevStep}
                  disabled={step === 0 || isSubmitting}
                >
                  Previous
                </Button>
              )}

              {step < steps.length - 1 ? (
                <Button
                  type="button"
                  onClick={nextStep}
                  disabled={isSubmitting}
                >
                  Next
                  <ChevronRight className="ml-2 h-4 w-4" />
                </Button>
              ) : (
                <Button
                  type="submit"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? "Creating..." : "Create Program"}
                  <CheckCircle2 className="ml-2 h-4 w-4" />
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </form>
    </Form>
  );
}
