'use client';

import { useState, useEffect, useRef } from "react";
import { useToast } from "@loyaltystudio/ui";
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
  Alert,
  AlertDescription,
  AlertTitle,
} from "@loyaltystudio/ui";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
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
  isActive: z.boolean(),
});

// Program schema - simplified to only include basic info
const programSchema = z.object({
  basicInfo: basicInfoSchema,
});

// Form data types
export type BasicInfoData = z.infer<typeof basicInfoSchema>;
export type ProgramFormData = z.infer<typeof programSchema>;

interface ProgramEditDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  program: {
    id: string;
    name?: string;
    description?: string;
    settings?: {
      pointsName?: string;
      currency?: string;
      timezone?: string;
    };
    isActive?: boolean;
  };
  onSuccess?: () => void;
}

export function ProgramEditDialog({
  open,
  onOpenChange,
  program,
  onSuccess
}: ProgramEditDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { updateLoyaltyProgram } = useLoyaltyPrograms();
  const { toast } = useToast();

  const form = useForm({
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
    },
    mode: "onChange",
  });

  // Reset form when program changes - using a ref to prevent infinite loops
  const initializedRef = useRef(false);

  useEffect(() => {
    // Only run this effect once when the component mounts and program is available
    if (program && !initializedRef.current) {
      initializedRef.current = true;

      // Create form values based on current program data - simplified to only include basic info
      const programValues = {
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
      };

      console.log('Setting form values:', programValues);
      form.reset(programValues);
    }
  }, [program, form]);

  const handleSubmit = async (data: ProgramFormData) => {
    console.log('Submitting form with data:', JSON.stringify(data, null, 2));
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
      console.log('Update payload:', JSON.stringify(updateData, null, 2));

      // Make sure we're sending the correct data structure to the API
      const result = await updateLoyaltyProgram.mutateAsync({
        id: program.id,
        data: updateData,
      });

      console.log('Update result:', result);

      if (onSuccess) {
        onSuccess();
      }

      // Show success message and close dialog
      toast({
        title: "Success",
        description: "Loyalty program updated successfully!",
        duration: 3000,
      });
      
      // Close the dialog
      console.log('Closing dialog after successful update');
      onOpenChange(false);
    } catch (err: any) {
      console.error("Failed to update program:", err);
      const errorMessage = err.message || "Failed to update program";
      setError(errorMessage);
      
      // Show error toast
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
        duration: 5000,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(newOpen) => {
        if (!isSubmitting) {
          onOpenChange(newOpen);
        }
      }}
    >
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Basic Program Info</DialogTitle>
          <DialogDescription>
            Update your loyalty program's basic information and settings
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit as any)} className="space-y-6">
            <div className="space-y-4">
              <FormField
                control={form.control}
                name="basicInfo.name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Program Name</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="e.g., Gold Rewards" />
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
                      <Textarea
                        {...field}
                        placeholder="Describe your loyalty program"
                        className="min-h-[100px]"
                      />
                    </FormControl>
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
                        <Input {...field} placeholder="e.g., stars, coins" />
                      </FormControl>
                      <FormDescription>
                        What you'll call your loyalty currency
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
                        value={field.value}
                        onValueChange={field.onChange}
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
                        Primary currency for transactions
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
                        value={field.value}
                        onValueChange={field.onChange}
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
                          <SelectItem value="Asia/Kolkata">India (IST)</SelectItem>
                          <SelectItem value="Asia/Tokyo">Tokyo (JST)</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormDescription>
                        Primary timezone for your program
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
                      <FormLabel>Active</FormLabel>
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
              <Button 
                type="button" 
                disabled={isSubmitting}
                onClick={form.handleSubmit(handleSubmit as any)}
              >
                {isSubmitting ? "Saving..." : "Save Changes"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
