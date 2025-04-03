import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
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
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Alert,
  AlertDescription,
} from '@loyaltystudio/ui';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useLoyaltyPrograms } from '@/hooks/use-loyalty-programs';
import { useMerchantStore } from '@/lib/stores/merchant-store';

const pointsRuleSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  description: z.string().optional(),
  type: z.enum(['FIXED', 'PERCENTAGE', 'DYNAMIC']),
  conditions: z.record(z.any()),
  points: z.number().min(1, 'Points must be greater than 0'),
  maxPoints: z.number().optional(),
  minAmount: z.number().optional(),
  categoryRules: z.record(z.any()).optional(),
  timeRules: z.record(z.any()).optional(),
  metadata: z.record(z.any()).optional(),
  isActive: z.boolean().default(true),
});

const rewardSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  description: z.string().min(1, 'Description is required'),
  type: z.enum(['PHYSICAL', 'DIGITAL', 'EXPERIENCE', 'COUPON']),
  pointsCost: z.number().min(1, 'Points cost must be greater than 0'),
  stock: z.number().optional(),
  validityPeriod: z.number().optional(),
  redemptionLimit: z.number().optional(),
  conditions: z.record(z.any()).optional(),
  metadata: z.record(z.any()).optional(),
  isActive: z.boolean().default(true),
});

const tierSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  description: z.string().optional(),
  pointsThreshold: z.number().min(0, 'Points threshold must be greater than or equal to 0'),
  benefits: z.record(z.any()).optional(),
});

const loyaltyProgramSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  description: z.string().optional(),
  settings: z.record(z.any()).optional(),
  metadata: z.record(z.any()).optional(),
  isActive: z.boolean().default(true),
  defaultRules: z.array(pointsRuleSchema).optional(),
  defaultRewards: z.array(rewardSchema).optional(),
  defaultTiers: z.array(tierSchema).optional(),
});

type LoyaltyProgramFormData = z.infer<typeof loyaltyProgramSchema>;

interface LoyaltyProgramDialogProps {
  onSuccess?: () => void;
}

export function LoyaltyProgramDialog({ onSuccess }: LoyaltyProgramDialogProps) {
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { selectedMerchant } = useMerchantStore();
  const { createLoyaltyProgram } = useLoyaltyPrograms();

  const form = useForm<LoyaltyProgramFormData>({
    resolver: zodResolver(loyaltyProgramSchema) as any,
    defaultValues: {
      name: '',
      description: '',
      isActive: true,
      defaultRules: [
        {
          name: 'Base Points Rule',
          description: 'Default points earning rule',
          type: 'FIXED',
          conditions: {},
          points: 1,
          isActive: true,
        },
      ],
      defaultRewards: [
        {
          name: 'Welcome Reward',
          description: 'Welcome reward for new members',
          type: 'DIGITAL',
          pointsCost: 100,
          isActive: true,
        },
      ],
      defaultTiers: [
        {
          name: 'Bronze',
          description: 'Starting tier',
          pointsThreshold: 0,
          benefits: {},
        },
        {
          name: 'Silver',
          description: 'Mid tier',
          pointsThreshold: 1000,
          benefits: {},
        },
        {
          name: 'Gold',
          description: 'Top tier',
          pointsThreshold: 5000,
          benefits: {},
        },
      ],
    },
  });

  const onSubmit = async (data: LoyaltyProgramFormData) => {
    try {
      setError(null);
      if (!selectedMerchant) {
        throw new Error('No merchant selected');
      }

      await createLoyaltyProgram.mutateAsync(data);
      setOpen(false);
      onSuccess?.();
    } catch (error) {
      console.error('Failed to create loyalty program:', error);
      setError(error instanceof Error ? error.message : 'Failed to create loyalty program');
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>Create Loyalty Program</Button>
      </DialogTrigger>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create Loyalty Program</DialogTitle>
          <DialogDescription>
            Set up your loyalty program with points rules, rewards, and tiers.
          </DialogDescription>
        </DialogHeader>

        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <Tabs defaultValue="basic" className="w-full">
              <TabsList>
                <TabsTrigger value="basic">Basic Info</TabsTrigger>
                <TabsTrigger value="rules">Points Rules</TabsTrigger>
                <TabsTrigger value="rewards">Rewards</TabsTrigger>
                <TabsTrigger value="tiers">Tiers</TabsTrigger>
              </TabsList>

              <TabsContent value="basic" className="space-y-4">
                <FormField
                  control={form.control}
                  name="name"
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
                  name="description"
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
                  name="isActive"
                  render={({ field }) => (
                    <FormItem className="flex items-center justify-between rounded-lg border p-4">
                      <div className="space-y-0.5">
                        <FormLabel className="text-base">Active Status</FormLabel>
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
              </TabsContent>

              <TabsContent value="rules" className="space-y-4">
                {form.watch('defaultRules')?.map((_, index) => (
                  <Card key={index}>
                    <CardHeader>
                      <CardTitle>Rule {index + 1}</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <FormField
                        control={form.control}
                        name={`defaultRules.${index}.name`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Rule Name</FormLabel>
                            <FormControl>
                              <Input {...field} placeholder="Enter rule name" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name={`defaultRules.${index}.points`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Points</FormLabel>
                            <FormControl>
                              <Input
                                {...field}
                                type="number"
                                onChange={(e) => field.onChange(Number(e.target.value))}
                                placeholder="Enter points value"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </CardContent>
                  </Card>
                ))}
              </TabsContent>

              <TabsContent value="rewards" className="space-y-4">
                {form.watch('defaultRewards')?.map((_, index) => (
                  <Card key={index}>
                    <CardHeader>
                      <CardTitle>Reward {index + 1}</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <FormField
                        control={form.control}
                        name={`defaultRewards.${index}.name`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Reward Name</FormLabel>
                            <FormControl>
                              <Input {...field} placeholder="Enter reward name" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name={`defaultRewards.${index}.pointsCost`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Points Cost</FormLabel>
                            <FormControl>
                              <Input
                                {...field}
                                type="number"
                                onChange={(e) => field.onChange(Number(e.target.value))}
                                placeholder="Enter points cost"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </CardContent>
                  </Card>
                ))}
              </TabsContent>

              <TabsContent value="tiers" className="space-y-4">
                {form.watch('defaultTiers')?.map((_, index) => (
                  <Card key={index}>
                    <CardHeader>
                      <CardTitle>Tier {index + 1}</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <FormField
                        control={form.control}
                        name={`defaultTiers.${index}.name`}
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
                        name={`defaultTiers.${index}.pointsThreshold`}
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
                    </CardContent>
                  </Card>
                ))}
              </TabsContent>
            </Tabs>

            <div className="flex justify-end space-x-2">
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={createLoyaltyProgram.isPending}>
                {createLoyaltyProgram.isPending ? 'Creating...' : 'Create Program'}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
} 