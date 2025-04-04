'use client';

import { useState, useEffect, useRef } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
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
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
  Alert,
  AlertDescription,
  AlertTitle,
} from "@loyaltystudio/ui";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { SimpleRuleBuilder } from "./simple-rule-builder";
import { SimpleTierManager } from "./simple-tier-manager";
import { SimpleRewardManager } from "./simple-reward-manager";
import { useLoyaltyPrograms } from "@/hooks/use-loyalty-programs";
import { AlertCircle } from "lucide-react";

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

interface ProgramEditDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  program: any;
  onSuccess?: () => void;
}

export function ProgramEditDialog({
  open,
  onOpenChange,
  program,
  onSuccess
}: ProgramEditDialogProps) {
  const [activeTab, setActiveTab] = useState("basics");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { updateLoyaltyProgram } = useLoyaltyPrograms();

  const form = useForm<ProgramFormData>({
    resolver: zodResolver(programSchema),
    defaultValues: {
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
    },
    mode: "onChange",
  });

  // Reset form when program changes - using a ref to prevent infinite loops
  const initializedRef = useRef(false);

  useEffect(() => {
    // Only run this effect once when the component mounts and program is available
    if (program && !initializedRef.current) {
      initializedRef.current = true;

      // Create form values based on current program data
      const programValues: ProgramFormData = {
        basicInfo: {
          name: program.name || "",
          description: program.description || "",
          settings: {
            pointsName: program.settings?.pointsName || "points",
            currency: program.settings?.currency || "USD",
            timezone: program.settings?.timezone || "UTC",
          },
          isActive: program.isActive ?? true,
        },
        rules: program.pointsRules || [
          {
            name: "Base Points",
            type: "FIXED",
            points: 1,
            minAmount: 0,
          },
        ],
        tiers: program.tiers || [],
        rewards: program.rewards || [],
      };

      // Reset the form with program values
      form.reset(programValues);
    }
  }, [program]);

  const handleSubmit = async (data: ProgramFormData) => {
    console.log('Submitting form with data:', data);
    setIsSubmitting(true);
    setError(null);

    try {
      // Update basic program info
      console.log('Updating program with ID:', program.id);
      const updateData = {
        name: data.basicInfo.name,
        description: data.basicInfo.description,
        settings: data.basicInfo.settings,
        isActive: data.basicInfo.isActive,
      };
      console.log('Update payload:', updateData);

      // Make sure we're sending the correct data structure to the API
      const result = await updateLoyaltyProgram.mutateAsync({
        id: program.id,
        data: updateData,
      });

      console.log('Update result:', result);

      // Note: Rules, tiers, and rewards are managed by their respective components
      // and are updated separately through their own API calls

      if (onSuccess) {
        onSuccess();
      }

      onOpenChange(false);
    } catch (err: any) {
      console.error("Failed to update program:", err);
      setError(err.message || "Failed to update program");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Reset the initialization flag when the dialog is closed
  useEffect(() => {
    if (!open) {
      initializedRef.current = false;
    }
  }, [open]);

  return (
    <Dialog
      open={open}
      onOpenChange={(newOpen) => {
        // Reset error state when dialog is closed
        if (!newOpen) {
          setError(null);
        }
        onOpenChange(newOpen);
      }}
    >
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Loyalty Program</DialogTitle>
          <DialogDescription>
            Update your loyalty program settings and configuration
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid grid-cols-4 mb-4">
                <TabsTrigger value="basics">Basic Info</TabsTrigger>
                <TabsTrigger value="rules">Point Rules</TabsTrigger>
                <TabsTrigger value="tiers">Tiers</TabsTrigger>
                <TabsTrigger value="rewards">Rewards</TabsTrigger>
              </TabsList>

              {/* Basic Info Tab */}
              <TabsContent value="basics" className="space-y-4">
                <div className="space-y-4">
                  <FormField
                    control={form.control}
                    name="basicInfo.name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Program Name</FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                        <FormDescription>
                          The name of your loyalty program
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
                        <FormLabel>Description</FormLabel>
                        <FormControl>
                          <Textarea {...field} />
                        </FormControl>
                        <FormDescription>
                          A brief description of your loyalty program
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="grid grid-cols-3 gap-4">
                    <FormField
                      control={form.control}
                      name="basicInfo.settings.pointsName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Points Name</FormLabel>
                          <FormControl>
                            <Input {...field} />
                          </FormControl>
                          <FormDescription>
                            What to call your loyalty points
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
                            value={field.value}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select currency" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="USD">USD</SelectItem>
                              <SelectItem value="EUR">EUR</SelectItem>
                              <SelectItem value="GBP">GBP</SelectItem>
                              <SelectItem value="CAD">CAD</SelectItem>
                              <SelectItem value="AUD">AUD</SelectItem>
                              <SelectItem value="INR">INR</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormDescription>
                            The primary currency for your program
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
                          <FormLabel>Timezone</FormLabel>
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
                              <SelectItem value="Asia/Tokyo">Tokyo (JST)</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormDescription>
                            The primary timezone for your program
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
                          <FormLabel className="text-base">Program Status</FormLabel>
                          <FormDescription>
                            Enable or disable this loyalty program
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
              </TabsContent>

              {/* Rules Tab */}
              <TabsContent value="rules" className="space-y-4">
                <SimpleRuleBuilder
                  rules={form.watch("rules")}
                  onRulesChange={(rules: any) => form.setValue("rules", rules)}
                />

                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    These rules determine how members earn points in your program.
                  </AlertDescription>
                </Alert>
              </TabsContent>

              {/* Tiers Tab */}
              <TabsContent value="tiers" className="space-y-4">
                <SimpleTierManager
                  tiers={form.watch("tiers") || []}
                  onTiersChange={(tiers: any) => form.setValue("tiers", tiers)}
                />

                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    Tiers allow you to segment your members based on their loyalty level.
                  </AlertDescription>
                </Alert>
              </TabsContent>

              {/* Rewards Tab */}
              <TabsContent value="rewards" className="space-y-4">
                <SimpleRewardManager
                  rewards={form.watch("rewards") || []}
                  onRewardsChange={(rewards: any) => form.setValue("rewards", rewards)}
                />

                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    Rewards are what members can redeem their points for.
                  </AlertDescription>
                </Alert>
              </TabsContent>
            </Tabs>

            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Error</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Saving..." : "Save Changes"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
