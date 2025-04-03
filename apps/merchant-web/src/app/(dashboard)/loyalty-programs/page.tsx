'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
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
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@loyaltystudio/ui';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { RuleBuilder } from '@/components/loyalty-programs/rule-builder';
import { RewardsManager } from '@/components/loyalty-programs/rewards-manager';
import { TiersManager } from '@/components/loyalty-programs/tiers-manager';
import { useLoyaltyPrograms } from '@/hooks/use-loyalty-programs';
import { useApiAuth } from '@/hooks/use-api-auth';
import { useQueryClient } from '@tanstack/react-query';

const programSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  description: z.string().min(1, 'Description is required'),
  settings: z.object({
    pointsName: z.string().default('Points'),
    currency: z.string().default('USD'),
    timezone: z.string().default('UTC'),
  }),
  isActive: z.boolean().default(true),
});

type ProgramFormData = z.infer<typeof programSchema>;

export default function LoyaltyProgramsPage() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { loyaltyPrograms, isLoading } = useLoyaltyPrograms();
  const { apiClient } = useApiAuth();
  const queryClient = useQueryClient();

  const form = useForm<ProgramFormData>({
    resolver: zodResolver(programSchema),
    defaultValues: {
      name: '',
      description: '',
      settings: {
        pointsName: 'Points',
        currency: 'USD',
        timezone: 'UTC',
      },
      isActive: true,
    },
  });

  const onSubmit = async (data: ProgramFormData) => {
    try {
      setError(null);
      await apiClient.post('/loyalty-programs', data);
      queryClient.invalidateQueries({ queryKey: ['loyalty-programs'] });
      setOpen(false);
      form.reset();
    } catch (error) {
      console.error('Failed to create program:', error);
      setError(error instanceof Error ? error.message : 'Failed to create program');
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Loyalty Programs</h1>
          <p className="text-muted-foreground">
            Manage your loyalty programs, rules, rewards, and tiers
          </p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button>Create Program</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create Loyalty Program</DialogTitle>
              <DialogDescription>
                Set up a new loyalty program for your business.
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

                <Separator />

                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Program Settings</h3>
                  <FormField
                    control={form.control}
                    name="settings.pointsName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Points Name</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="Enter points name" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="settings.currency"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Currency</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="Enter currency code" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="settings.timezone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Timezone</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="Enter timezone" />
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

                <div className="flex justify-end space-x-2">
                  <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={form.formState.isSubmitting}>
                    {form.formState.isSubmitting ? 'Creating...' : 'Create Program'}
                  </Button>
                </div>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      <Tabs defaultValue="programs" className="space-y-4">
        <TabsList>
          <TabsTrigger value="programs">Programs</TabsTrigger>
          <TabsTrigger value="rules">Rules</TabsTrigger>
          <TabsTrigger value="rewards">Rewards</TabsTrigger>
          <TabsTrigger value="tiers">Tiers</TabsTrigger>
        </TabsList>

        <TabsContent value="programs" className="space-y-4">
          {loyaltyPrograms?.map((program) => (
            <Card key={program.id}>
              <CardHeader>
                <CardTitle>{program.name}</CardTitle>
                <CardDescription>{program.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <h4 className="font-medium">Points Name</h4>
                      <p className="text-sm text-muted-foreground">
                        {program.settings?.pointsName || 'Points'}
                      </p>
                    </div>
                    <div>
                      <h4 className="font-medium">Status</h4>
                      <p className="text-sm text-muted-foreground">
                        {program.isActive ? 'Active' : 'Inactive'}
                      </p>
                    </div>
                  </div>

                  <Separator />

                  <div>
                    <h4 className="font-medium mb-2">Program Settings</h4>
                    <ul className="space-y-2 text-sm text-muted-foreground">
                      <li>• Currency: {program.settings?.currency || 'USD'}</li>
                      <li>• Timezone: {program.settings?.timezone || 'UTC'}</li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        <TabsContent value="rules">
          <RuleBuilder />
        </TabsContent>

        <TabsContent value="rewards">
          <RewardsManager />
        </TabsContent>

        <TabsContent value="tiers">
          <TiersManager />
        </TabsContent>
      </Tabs>
    </div>
  );
} 