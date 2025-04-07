'use client';

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
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
  Alert,
  AlertDescription,
  useToast,
} from '@loyaltystudio/ui';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useTiers } from '@/hooks/use-tiers';
import { Tier } from '@/lib/stores/tier-store';

// Match the schema exactly with the API types
const tierSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  description: z.string().min(1, 'Description is required'),
  pointsThreshold: z.number().min(0, 'Points threshold must be 0 or greater'),
  benefits: z.object({
    pointsMultiplier: z.number().optional(),
    exclusiveRewards: z.array(z.string()),
    specialDiscounts: z.object({
      percentage: z.number(),
      categories: z.array(z.string()),
    }).nullish(),
    prioritySupport: z.boolean(),
  }),
  requirements: z.object({
    minimumSpend: z.number().nullish(),
    minimumOrders: z.number().nullish(),
    timeInProgram: z.number().nullish(),
  }),
  isActive: z.boolean(),
  loyaltyProgramId: z.string().optional(),
});

type TierFormData = z.infer<typeof tierSchema>;

interface CreateTierDialogProps {
  loyaltyProgramId: string;
  trigger?: React.ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  onSuccess?: (tier: Tier) => void;
}

export function CreateTierDialog({
  loyaltyProgramId,
  trigger,
  open: controlledOpen,
  onOpenChange: setControlledOpen,
  onSuccess,
}: CreateTierDialogProps) {
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();
  const { createTier } = useTiers(loyaltyProgramId);

  // Use either controlled or uncontrolled open state
  const isOpen = controlledOpen !== undefined ? controlledOpen : open;
  const setIsOpen = setControlledOpen || setOpen;

  const form = useForm<TierFormData>({
    resolver: zodResolver(tierSchema),
    defaultValues: {
      name: '',
      description: '',
      pointsThreshold: 0,
      benefits: {
        pointsMultiplier: undefined,
        exclusiveRewards: [],
        specialDiscounts: null,
        prioritySupport: false,
      },
      requirements: {
        minimumSpend: null,
        minimumOrders: null,
        timeInProgram: null,
      },
      isActive: true,
      loyaltyProgramId,
    },
  });

  const onSubmit = async (data: TierFormData) => {
    try {
      setError(null);
      
      if (!loyaltyProgramId) {
        setError('Please select a loyalty program first');
        return;
      }
      
      // Transform the data to match the API requirements
      const apiData: any = {
        name: data.name,
        description: data.description,
        pointsThreshold: data.pointsThreshold,
        isActive: data.isActive,
        benefits: {
          ...data.benefits,
          specialDiscounts: data.benefits.specialDiscounts || undefined,
          // Store requirements as part of benefits since the API doesn't have a separate requirements field
          requirements: {
            minimumSpend: data.requirements?.minimumSpend || undefined,
            minimumOrders: data.requirements?.minimumOrders || undefined,
            timeInProgram: data.requirements?.timeInProgram || undefined,
          }
        },
        loyaltyProgramId,
        // Add an empty requirements object to satisfy the type checker
        requirements: {}
      };

      const newTier = await createTier.mutateAsync(apiData);
      
      toast({
        title: "Tier Created",
        description: `The tier "${data.name}" has been successfully created.`,
        duration: 3000,
      });

      setIsOpen(false);
      form.reset();
      
      // Call onSuccess callback with the new tier
      if (onSuccess) {
        onSuccess(newTier);
      }
    } catch (error) {
      console.error('Failed to save tier:', error);
      setError(error instanceof Error ? error.message : 'Failed to save tier');
      
      // Show error toast
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : 'Failed to save tier',
        variant: "destructive",
        duration: 5000,
      });
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      {trigger && <DialogTrigger asChild>{trigger}</DialogTrigger>}
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Create New Tier</DialogTitle>
          <DialogDescription>
            Create a new membership tier for your loyalty program.
          </DialogDescription>
        </DialogHeader>

        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tier Name</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g. Silver, Gold, Platinum" {...field} />
                    </FormControl>
                    <FormDescription>
                      The name of the membership tier
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="pointsThreshold"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Points Threshold</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min={0}
                        {...field}
                        onChange={(e) => field.onChange(Number(e.target.value))}
                      />
                    </FormControl>
                    <FormDescription>
                      Minimum points required to reach this tier
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Describe the benefits and requirements of this tier"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    A brief description of this membership tier
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="benefits.pointsMultiplier"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Points Multiplier</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min={1}
                        step={0.1}
                        placeholder="1.0"
                        {...field}
                        value={field.value || ''}
                        onChange={(e) =>
                          field.onChange(
                            e.target.value ? Number(e.target.value) : undefined
                          )
                        }
                      />
                    </FormControl>
                    <FormDescription>
                      Multiplier for points earned (e.g. 1.5x)
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="benefits.prioritySupport"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                    <div className="space-y-0.5">
                      <FormLabel>Priority Support</FormLabel>
                      <FormDescription>
                        Offer priority customer support
                      </FormDescription>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="isActive"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                  <div className="space-y-0.5">
                    <FormLabel>Active</FormLabel>
                    <FormDescription>
                      Enable or disable this tier
                    </FormDescription>
                  </div>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsOpen(false)}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={createTier.isPending}>
                {createTier.isPending ? "Creating..." : "Create Tier"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
