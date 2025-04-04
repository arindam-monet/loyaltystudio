import { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
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
  Stepper,
  StepperContent,
  StepperDescription,
  StepperFooter,
  StepperHeader,
  StepperNext,
  StepperPrevious,
  StepperTitle,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@loyaltystudio/ui";
import { useForm, SubmitHandler } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { ReactFlowProvider } from "reactflow";
import { RuleBuilder } from "./rule-builder";
import { TierManager } from "./tier-manager";
import { RewardManager } from "./reward-manager";

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

// Tier schema
const tierSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(1, "Name is required"),
  description: z.string().min(1, "Description is required"),
  pointsThreshold: z.number().min(0, "Points threshold must be positive"),
  benefits: z.array(z.string()).default([]),
});

// Reward schema with updated type enum to match the page component
const rewardSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(1, "Name is required"),
  description: z.string().min(1, "Description is required"),
  type: z.enum(["PHYSICAL", "DIGITAL", "EXPERIENCE", "COUPON"]),
  pointsCost: z.number().min(0, "Points cost must be positive"),
  stock: z.number().optional(),
  validityPeriod: z.number().optional(),
  redemptionLimit: z.number().optional(),
  conditions: z.record(z.any()).optional(),
});

// Program schema
const programSchema = z.object({
  basicInfo: basicInfoSchema,
  tiers: z.array(tierSchema).default([]),
  rewards: z.array(rewardSchema).default([]),
  rules: z.array(z.any()).default([]),
});

// Form data types
export type BasicInfoData = z.infer<typeof basicInfoSchema>;
export type TierData = z.infer<typeof tierSchema>;
export type RewardData = z.infer<typeof rewardSchema>;
export type ProgramFormData = z.infer<typeof programSchema>;

interface CreateProgramWizardProps {
  onSubmit: (data: ProgramFormData) => Promise<void>;
  onCancel: () => void;
}

// Update the interfaces to match component props
interface Tier {
  id: string;
  name: string;
  description: string;
  pointsThreshold: number;
  benefits: string[];
}

interface Reward {
  id: string;
  name: string;
  description: string;
  type: "PHYSICAL" | "DIGITAL" | "EXPERIENCE" | "COUPON";
  pointsCost: number;
  stock?: number;
  validityPeriod?: number;
  redemptionLimit?: number;
  conditions?: Record<string, any>;
}

interface Step {
  title: string;
  description: string;
  content: React.ReactNode;
}

interface TierInput {
  name: string;
  pointsThreshold: number;
  description?: string;
  benefits?: string[];
}

interface RewardInput {
  name: string;
  description: string;
  type: "PHYSICAL" | "DIGITAL" | "EXPERIENCE" | "COUPON";
  pointsCost: number;
  stock?: number;
  validityPeriod?: number;
  redemptionLimit?: number;
  conditions?: Record<string, any>;
}

interface TierManagerProps {
  tiers: Tier[];
  onAddTier: (tier: { name: string; pointsThreshold: number; description?: string; benefits?: Record<string, any> }) => void;
  onUpdateTier: (id: string, tier: { name: string; pointsThreshold: number; description?: string; benefits?: Record<string, any> }) => void;
  onDeleteTier: (id: string) => void;
}

interface RewardManagerProps {
  rewards: Reward[];
  onAddReward: (reward: RewardInput) => void;
  onUpdateReward: (id: string, reward: RewardInput) => void;
  onDeleteReward: (id: string) => void;
}

export function CreateProgramWizard({ onSubmit, onCancel }: CreateProgramWizardProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [isLoading, setIsLoading] = useState(false);

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
    tiers: [],
    rewards: [],
    rules: [],
  };

  const form = useForm<ProgramFormData>({
    resolver: zodResolver(programSchema),
    defaultValues,
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

  const onFormSubmit = form.handleSubmit((data) => {
    const formData = data as unknown as ProgramFormData;
    return handleSubmit(formData);
  });

  const steps: Step[] = [
    {
      title: "Basic Information",
      description: "Enter program details",
      content: (
        <div className="space-y-4">
          <Form {...form}>
            <form onSubmit={onFormSubmit} className="space-y-4">
              <FormField
                control={form.control}
                name="basicInfo.name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Program Name</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="Enter program name" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="basicInfo.description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Textarea {...field} placeholder="Enter program description" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="basicInfo.settings.pointsName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Points Name</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="e.g., Points, Stars, Coins" />
                    </FormControl>
                    <FormDescription>
                      What would you like to call your loyalty points?
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="basicInfo.settings.currency"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Currency</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select currency" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="USD">USD</SelectItem>
                          <SelectItem value="EUR">EUR</SelectItem>
                          <SelectItem value="GBP">GBP</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="basicInfo.settings.timezone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Timezone</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select timezone" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="UTC">UTC</SelectItem>
                          <SelectItem value="America/New_York">EST</SelectItem>
                          <SelectItem value="America/Los_Angeles">PST</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="basicInfo.isActive"
                render={({ field }) => (
                  <FormItem className="flex items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <FormLabel className="text-base">Active Status</FormLabel>
                      <FormDescription>
                        Enable or disable this program
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
            </form>
          </Form>
        </div>
      ),
    },
    {
      title: "Program Rules",
      description: "Define how members earn points",
      content: (
        <div className="space-y-4">
          <ReactFlowProvider>
            <RuleBuilder
              nodes={form.watch("rules")}
              edges={[]}
              onNodesChange={(changes) => {
                form.setValue("rules", changes);
              }}
              onEdgesChange={() => {}}
              onConnect={() => {}}
              onNodeDataChange={() => {}}
            />
          </ReactFlowProvider>
        </div>
      ),
    },
    {
      title: "Tiers (Optional)",
      description: "Set up membership tiers",
      content: (
        <div className="space-y-4">
          <TierManager
            tiers={form.watch("tiers") as Tier[]}
            onAddTier={(tier) => {
              const currentTiers = form.watch("tiers");
              form.setValue("tiers", [
                ...currentTiers,
                { 
                  ...tier, 
                  id: crypto.randomUUID(),
                  description: tier.description || "",
                  benefits: Array.isArray(tier.benefits) ? tier.benefits : []
                } as Tier
              ]);
            }}
            onUpdateTier={(id, tier) => {
              const currentTiers = form.watch("tiers");
              form.setValue(
                "tiers",
                currentTiers.map((t) => (t.id === id ? { 
                  ...t, 
                  ...tier,
                  benefits: Array.isArray(tier.benefits) ? tier.benefits : t.benefits
                } : t))
              );
            }}
            onDeleteTier={(id) => {
              const currentTiers = form.watch("tiers");
              form.setValue(
                "tiers",
                currentTiers.filter((t) => t.id !== id)
              );
            }}
          />
        </div>
      ),
    },
    {
      title: "Rewards (Optional)",
      description: "Create rewards for redemption",
      content: (
        <div className="space-y-4">
          <RewardManager
            rewards={form.watch("rewards") as Reward[]}
            onAddReward={(reward) => {
              const currentRewards = form.watch("rewards");
              form.setValue("rewards", [
                ...currentRewards,
                { ...reward, id: crypto.randomUUID() } as Reward
              ]);
            }}
            onUpdateReward={(id, reward) => {
              const currentRewards = form.watch("rewards");
              form.setValue(
                "rewards",
                currentRewards.map((r) => (r.id === id ? { ...r, ...reward } : r))
              );
            }}
            onDeleteReward={(id) => {
              const currentRewards = form.watch("rewards");
              form.setValue(
                "rewards",
                currentRewards.filter((r) => r.id !== id)
              );
            }}
          />
        </div>
      ),
    },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Create Loyalty Program</CardTitle>
        <CardDescription>
          Set up your loyalty program in a few simple steps
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-8">
          <div className="flex flex-col gap-4">
            {steps.map((step, index) => (
              <div
                key={step.title}
                className={`p-4 border rounded-lg ${
                  index === currentStep ? "border-primary" : "border-gray-200"
                }`}
                onClick={() => setCurrentStep(index)}
                role="button"
                tabIndex={0}
              >
                <h3 className="font-medium">{step.title}</h3>
                <p className="text-sm text-gray-500">{step.description}</p>
              </div>
            ))}
          </div>

          <div className="mt-8">{steps[currentStep].content}</div>

          <div className="flex justify-between pt-8">
            <Button
              variant="outline"
              onClick={() => {
                if (currentStep === 0) {
                  onCancel();
                } else {
                  setCurrentStep(currentStep - 1);
                }
              }}
            >
              {currentStep === 0 ? "Cancel" : "Back"}
            </Button>
            <Button
              onClick={() => {
                if (currentStep === steps.length - 1) {
                  void onFormSubmit();
                } else {
                  setCurrentStep(currentStep + 1);
                }
              }}
              disabled={isLoading}
            >
              {currentStep === steps.length - 1 ? "Create Program" : "Next"}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
} 