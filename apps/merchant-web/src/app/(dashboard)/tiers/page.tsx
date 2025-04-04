'use client';

import { useState } from "react";
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  Badge,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@loyaltystudio/ui';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useTiers } from '@/hooks/use-tiers';
import { Tier } from '@/lib/stores/tier-store';
import { MoreHorizontal, Pencil, Plus, Trash2 } from "lucide-react";
import { useAuthGuard } from "@/hooks/use-auth-guard";

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

export default function TiersPage() {
  const { isLoading: isAuthLoading } = useAuthGuard();
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [editingTier, setEditingTier] = useState<Tier | null>(null);
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

  const onSubmit = async (data: TierFormData) => {
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

      if (editingTier) {
        await updateTier.mutateAsync({ id: editingTier.id, data: apiData });
      } else {
        await createTier.mutateAsync(apiData);
      }
      
      setOpen(false);
      form.reset();
      setEditingTier(null);
    } catch (error) {
      console.error('Failed to save tier:', error);
      setError(error instanceof Error ? error.message : 'Failed to save tier');
    }
  };

  const handleEdit = (tier: Tier) => {
    setEditingTier(tier);
    form.reset({
      ...tier,
      benefits: {
        pointsMultiplier: tier.benefits.pointsMultiplier,
        exclusiveRewards: tier.benefits.exclusiveRewards || [],
        specialDiscounts: tier.benefits.specialDiscounts || null,
        prioritySupport: tier.benefits.prioritySupport || false,
      },
      requirements: {
        minimumSpend: tier.requirements.minimumSpend || null,
        minimumOrders: tier.requirements.minimumOrders || null,
        timeInProgram: tier.requirements.timeInProgram || null,
      },
    });
    setOpen(true);
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteTier.mutateAsync(id);
    } catch (error) {
      console.error('Failed to delete tier:', error);
      setError(error instanceof Error ? error.message : 'Failed to delete tier');
    }
  };

  if (isAuthLoading || isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="container py-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Membership Tiers</h1>
          <p className="text-muted-foreground">
            Create and manage membership tiers for your loyalty programs
          </p>
        </div>
        <Dialog open={open} onOpenChange={(newOpen) => {
          setOpen(newOpen);
          if (!newOpen) {
            setEditingTier(null);
            form.reset();
          }
        }}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Create Tier
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>{editingTier ? 'Edit Tier' : 'Create Tier'}</DialogTitle>
              <DialogDescription>
                {editingTier 
                  ? 'Update the details of this membership tier' 
                  : 'Add a new membership tier to your loyalty program'}
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
                        <Input {...field} placeholder="e.g., Silver, Gold, Platinum" />
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
                        <Textarea {...field} placeholder="Describe the benefits of this tier" />
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
                          placeholder="Points required to reach this tier"
                        />
                      </FormControl>
                      <FormDescription>
                        The minimum number of points a member needs to reach this tier
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <Separator />

                <h3 className="text-lg font-medium">Benefits</h3>

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
                          onChange={(e) => field.onChange(e.target.value ? Number(e.target.value) : undefined)}
                          placeholder="e.g., 1.5 for 50% more points"
                        />
                      </FormControl>
                      <FormDescription>
                        Multiplier for points earned (e.g., 1.5 means 50% more points)
                      </FormDescription>
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
                          Members of this tier receive priority customer support
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

                <div className="flex justify-end space-x-2 pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setOpen(false);
                      setEditingTier(null);
                      form.reset();
                    }}
                  >
                    Cancel
                  </Button>
                  <Button type="submit">
                    {editingTier ? 'Update Tier' : 'Create Tier'}
                  </Button>
                </div>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="space-y-4">
        {tiers.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center p-6">
              <div className="text-center space-y-2">
                <h3 className="text-lg font-medium">No tiers created yet</h3>
                <p className="text-sm text-muted-foreground">
                  Create your first membership tier to start segmenting your customers
                </p>
                <Button 
                  className="mt-4" 
                  onClick={() => setOpen(true)}
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Create Tier
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardHeader>
              <CardTitle>Membership Tiers</CardTitle>
              <CardDescription>
                Manage your membership tiers and their benefits
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Tier Name</TableHead>
                    <TableHead>Points Threshold</TableHead>
                    <TableHead>Benefits</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {tiers
                    .sort((a: Tier, b: Tier) => a.pointsThreshold - b.pointsThreshold)
                    .map((tier: Tier) => (
                      <TableRow key={tier.id}>
                        <TableCell className="font-medium">
                          <div>
                            <div>{tier.name}</div>
                            <div className="text-sm text-muted-foreground">
                              {tier.description}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>{tier.pointsThreshold} points</TableCell>
                        <TableCell>
                          <div className="text-sm space-y-1">
                            {tier.benefits.pointsMultiplier && (
                              <div>
                                {tier.benefits.pointsMultiplier}x points multiplier
                              </div>
                            )}
                            {tier.benefits.prioritySupport && (
                              <div>Priority support</div>
                            )}
                            {tier.benefits.specialDiscounts && (
                              <div>
                                {tier.benefits.specialDiscounts.percentage}% discount
                              </div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={tier.isActive ? "default" : "secondary"}
                          >
                            {tier.isActive ? "Active" : "Inactive"}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" className="h-8 w-8 p-0">
                                <span className="sr-only">Open menu</span>
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuLabel>Actions</DropdownMenuLabel>
                              <DropdownMenuItem onClick={() => handleEdit(tier)}>
                                <Pencil className="mr-2 h-4 w-4" />
                                Edit
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                className="text-destructive"
                                onClick={() => handleDelete(tier.id)}
                              >
                                <Trash2 className="mr-2 h-4 w-4" />
                                Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
