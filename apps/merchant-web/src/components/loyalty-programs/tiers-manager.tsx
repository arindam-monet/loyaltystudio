import { useState } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
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
  Separator,
} from '@loyaltystudio/ui';
import { useForm, SubmitHandler } from 'react-hook-form';
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
});

type TierFormData = z.infer<typeof tierSchema>;

export function TiersManager() {
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { tiers = [], createTier, updateTier, deleteTier, isLoading } = useTiers();

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
    },
  });

  const onSubmit: SubmitHandler<TierFormData> = async (data) => {
    try {
      setError(null);
      // Transform the data to match the API requirements
      const apiData = {
        ...data,
        benefits: {
          ...data.benefits,
          specialDiscounts: data.benefits.specialDiscounts || undefined,
        },
        requirements: {
          minimumSpend: data.requirements.minimumSpend || undefined,
          minimumOrders: data.requirements.minimumOrders || undefined,
          timeInProgram: data.requirements.timeInProgram || undefined,
        },
      };
      await createTier.mutateAsync(apiData);
      setOpen(false);
      form.reset();
    } catch (error) {
      console.error('Failed to create tier:', error);
      setError(error instanceof Error ? error.message : 'Failed to create tier');
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Tiers</h2>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button>Create Tier</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create Tier</DialogTitle>
              <DialogDescription>
                Add a new tier to your loyalty program.
              </DialogDescription>
            </DialogHeader>

            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Tier Name</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="Enter tier name" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Description</FormLabel>
                      <FormControl>
                        <Textarea {...field} placeholder="Enter tier description" />
                      </FormControl>
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
                          {...field}
                          type="number"
                          onChange={(e) => field.onChange(Number(e.target.value))}
                          placeholder="Enter points threshold"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <Separator />

                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Benefits</h3>
                  <FormField
                    control={form.control}
                    name="benefits.pointsMultiplier"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Points Multiplier</FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            type="number"
                            step="0.1"
                            onChange={(e) => field.onChange(Number(e.target.value))}
                            placeholder="Enter points multiplier"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="benefits.prioritySupport"
                    render={({ field }) => (
                      <FormItem className="flex items-center justify-between rounded-lg border p-4">
                        <div className="space-y-0.5">
                          <FormLabel className="text-base">Priority Support</FormLabel>
                          <FormDescription>
                            Enable priority support for this tier
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

                <Separator />

                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Requirements</h3>
                  <FormField
                    control={form.control}
                    name="requirements.minimumSpend"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Minimum Spend</FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            type="number"
                            onChange={(e) => field.onChange(e.target.value ? Number(e.target.value) : null)}
                            value={field.value ?? ''}
                            placeholder="Enter minimum spend"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="requirements.minimumOrders"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Minimum Orders</FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            type="number"
                            onChange={(e) => field.onChange(e.target.value ? Number(e.target.value) : null)}
                            value={field.value ?? ''}
                            placeholder="Enter minimum orders"
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
                    <FormItem className="flex items-center justify-between rounded-lg border p-4">
                      <div className="space-y-0.5">
                        <FormLabel className="text-base">Active Status</FormLabel>
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
                    </FormItem>
                  )}
                />

                <div className="flex justify-end space-x-2">
                  <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={createTier.isPending}>
                    {createTier.isPending ? 'Creating...' : 'Create Tier'}
                  </Button>
                </div>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="space-y-4">
        {tiers
          .sort((a: Tier, b: Tier) => a.pointsThreshold - b.pointsThreshold)
          .map((tier: Tier) => (
            <Card key={tier.id}>
              <CardHeader>
                <CardTitle>{tier.name}</CardTitle>
                <CardDescription>{tier.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <h4 className="font-medium">Points Threshold</h4>
                      <p className="text-sm text-muted-foreground">{tier.pointsThreshold} points</p>
                    </div>
                    <div>
                      <h4 className="font-medium">Status</h4>
                      <p className="text-sm text-muted-foreground">
                        {tier.isActive ? 'Active' : 'Inactive'}
                      </p>
                    </div>
                  </div>

                  <Separator />

                  <div>
                    <h4 className="font-medium mb-2">Benefits</h4>
                    <ul className="space-y-2 text-sm text-muted-foreground">
                      {tier.benefits.pointsMultiplier && (
                        <li>• {tier.benefits.pointsMultiplier}x Points Multiplier</li>
                      )}
                      {tier.benefits.prioritySupport && (
                        <li>• Priority Support</li>
                      )}
                      {tier.benefits.specialDiscounts && (
                        <li>• {tier.benefits.specialDiscounts.percentage}% Special Discount</li>
                      )}
                    </ul>
                  </div>

                  <Separator />

                  <div>
                    <h4 className="font-medium mb-2">Requirements</h4>
                    <ul className="space-y-2 text-sm text-muted-foreground">
                      {tier.requirements.minimumSpend && (
                        <li>• Minimum Spend: ${tier.requirements.minimumSpend}</li>
                      )}
                      {tier.requirements.minimumOrders && (
                        <li>• Minimum Orders: {tier.requirements.minimumOrders}</li>
                      )}
                      {tier.requirements.timeInProgram && (
                        <li>• Time in Program: {tier.requirements.timeInProgram} months</li>
                      )}
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
      </div>
    </div>
  );
} 