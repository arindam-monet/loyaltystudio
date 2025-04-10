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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Switch,
  Alert,
  AlertDescription,
  ScrollArea,
} from '@loyaltystudio/ui';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useRewards } from '@/hooks/use-rewards';
import { useProgramRewards } from '@/hooks/use-program-rewards';
import { useRewardStore } from '@/lib/stores/reward-store';
import type { Reward } from '@/lib/stores/reward-store';

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
  isActive: z.boolean(),
});

type RewardFormData = z.infer<typeof rewardSchema>;

interface RewardsManagerProps {
  programId?: string;
}

export function RewardsManager({ programId }: RewardsManagerProps) {
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // Use the correct hook based on whether we're using the program-specific hook or the general hook
  const { rewards, isLoading, createReward } = useRewards(programId);
  const { setSelectedReward } = useRewardStore();

  const form = useForm<RewardFormData>({
    resolver: zodResolver(rewardSchema),
    defaultValues: {
      name: '',
      description: '',
      type: 'DIGITAL',
      pointsCost: 100,
      isActive: true,
    },
  });

  const onSubmit = async (data: RewardFormData) => {
    try {
      setError(null);
      // The loyaltyProgramId is now automatically added in the useRewards hook
      await createReward.mutateAsync(data);
      setOpen(false);
      form.reset();
    } catch (error) {
      console.error('Failed to create reward:', error);
      setError(error instanceof Error ? error.message : 'Failed to create reward');
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Rewards</h2>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button>Create Reward</Button>
          </DialogTrigger>
          <DialogContent className="max-h-[90vh] overflow-hidden flex flex-col max-w-2xl w-full">
            <DialogHeader>
              <DialogTitle>Create Reward</DialogTitle>
              <DialogDescription>
                Add a new reward to your loyalty program.
              </DialogDescription>
            </DialogHeader>

            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col h-full">
                <ScrollArea className="flex-1 pr-4 overflow-auto" style={{ height: 'calc(80vh - 200px)' }}>
                  <div className="space-y-4">
                    <FormField
                      control={form.control}
                      name="name"
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
                      name="description"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Description</FormLabel>
                          <FormControl>
                            <Textarea {...field} placeholder="Enter reward description" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="type"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Reward Type</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select reward type" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="PHYSICAL">Physical</SelectItem>
                              <SelectItem value="DIGITAL">Digital</SelectItem>
                              <SelectItem value="EXPERIENCE">Experience</SelectItem>
                              <SelectItem value="COUPON">Coupon</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="pointsCost"
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

                    <FormField
                      control={form.control}
                      name="isActive"
                      render={({ field }) => (
                        <FormItem className="flex items-center justify-between rounded-lg border p-4">
                          <div className="space-y-0.5">
                            <FormLabel className="text-base">Active Status</FormLabel>
                            <FormDescription>
                              Enable or disable this reward
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
                </ScrollArea>

                <div className="flex justify-end space-x-2 pt-4 mt-4 border-t">
                  <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={createReward.isPending}>
                    {createReward.isPending ? 'Creating...' : 'Create Reward'}
                  </Button>
                </div>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {rewards?.map((reward: Reward) => (
          <Card key={reward.id}>
            <CardHeader>
              <CardTitle>{reward.name}</CardTitle>
              <CardDescription>{reward.description}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Type:</span>
                  <span className="text-sm font-medium">{reward.type}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Points Cost:</span>
                  <span className="text-sm font-medium">{reward.pointsCost}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Status:</span>
                  <span className="text-sm font-medium">
                    {reward.isActive ? 'Active' : 'Inactive'}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}