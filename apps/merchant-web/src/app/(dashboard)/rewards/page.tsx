'use client';

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
import { useRewards } from '@/hooks/use-rewards';
import { useRewardStore } from '@/lib/stores/reward-store';
import type { Reward } from '@/lib/stores/reward-store';
import { MoreHorizontal, Pencil, Plus, Trash2, Gift, Tag, Award, Ticket } from "lucide-react";
import { useAuthGuard } from "@/hooks/use-auth-guard";

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

export default function RewardsPage() {
  const { isLoading: isAuthLoading } = useAuthGuard();
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [editingReward, setEditingReward] = useState<Reward | null>(null);
  const { rewards = [], isLoading, createReward, updateReward, deleteReward } = useRewards();
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
      
      if (editingReward) {
        await updateReward.mutateAsync({ id: editingReward.id, data });
      } else {
        await createReward.mutateAsync(data);
      }
      
      setOpen(false);
      form.reset();
      setEditingReward(null);
    } catch (error) {
      console.error('Failed to save reward:', error);
      setError(error instanceof Error ? error.message : 'Failed to save reward');
    }
  };

  const handleEdit = (reward: Reward) => {
    setEditingReward(reward);
    form.reset(reward);
    setOpen(true);
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteReward.mutateAsync(id);
    } catch (error) {
      console.error('Failed to delete reward:', error);
      setError(error instanceof Error ? error.message : 'Failed to delete reward');
    }
  };

  const getRewardIcon = (type: string) => {
    switch (type) {
      case 'PHYSICAL':
        return <Gift className="h-5 w-5" />;
      case 'DIGITAL':
        return <Tag className="h-5 w-5" />;
      case 'EXPERIENCE':
        return <Award className="h-5 w-5" />;
      case 'COUPON':
        return <Ticket className="h-5 w-5" />;
      default:
        return <Gift className="h-5 w-5" />;
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
          <h1 className="text-3xl font-bold">Rewards</h1>
          <p className="text-muted-foreground">
            Create and manage rewards for your loyalty programs
          </p>
        </div>
        <Dialog open={open} onOpenChange={(newOpen) => {
          setOpen(newOpen);
          if (!newOpen) {
            setEditingReward(null);
            form.reset();
          }
        }}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Create Reward
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>{editingReward ? 'Edit Reward' : 'Create Reward'}</DialogTitle>
              <DialogDescription>
                {editingReward 
                  ? 'Update the details of this reward' 
                  : 'Add a new reward to your loyalty program'}
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

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="type"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Reward Type</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select reward type" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="PHYSICAL">Physical Product</SelectItem>
                            <SelectItem value="DIGITAL">Digital Item</SelectItem>
                            <SelectItem value="EXPERIENCE">Experience</SelectItem>
                            <SelectItem value="COUPON">Coupon/Discount</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormDescription>
                          The type of reward being offered
                        </FormDescription>
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
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="stock"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Stock (Optional)</FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            type="number"
                            onChange={(e) => field.onChange(e.target.value ? Number(e.target.value) : undefined)}
                            placeholder="Available quantity"
                          />
                        </FormControl>
                        <FormDescription>
                          Leave empty for unlimited stock
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="redemptionLimit"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Redemption Limit (Optional)</FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            type="number"
                            onChange={(e) => field.onChange(e.target.value ? Number(e.target.value) : undefined)}
                            placeholder="Max per customer"
                          />
                        </FormControl>
                        <FormDescription>
                          Maximum times a customer can redeem this reward
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="validityPeriod"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Validity Period (Optional)</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          type="number"
                          onChange={(e) => field.onChange(e.target.value ? Number(e.target.value) : undefined)}
                          placeholder="Days valid after redemption"
                        />
                      </FormControl>
                      <FormDescription>
                        Number of days the reward is valid after redemption
                      </FormDescription>
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

                <div className="flex justify-end space-x-2 pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setOpen(false);
                      setEditingReward(null);
                      form.reset();
                    }}
                  >
                    Cancel
                  </Button>
                  <Button type="submit">
                    {editingReward ? 'Update Reward' : 'Create Reward'}
                  </Button>
                </div>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      {rewards.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center p-6">
            <div className="text-center space-y-2">
              <h3 className="text-lg font-medium">No rewards created yet</h3>
              <p className="text-sm text-muted-foreground">
                Create your first reward to start engaging your customers
              </p>
              <Button 
                className="mt-4" 
                onClick={() => setOpen(true)}
              >
                <Plus className="mr-2 h-4 w-4" />
                Create Reward
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Available Rewards</CardTitle>
            <CardDescription>
              Manage your rewards and their redemption options
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Reward</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Points Cost</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rewards.map((reward: Reward) => (
                  <TableRow key={reward.id}>
                    <TableCell className="font-medium">
                      <div className="flex items-start gap-3">
                        <div className="flex h-9 w-9 items-center justify-center rounded-md border bg-muted">
                          {getRewardIcon(reward.type)}
                        </div>
                        <div>
                          <div>{reward.name}</div>
                          <div className="text-sm text-muted-foreground">
                            {reward.description}
                          </div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {reward.type === "PHYSICAL"
                          ? "Physical Product"
                          : reward.type === "DIGITAL"
                          ? "Digital Item"
                          : reward.type === "EXPERIENCE"
                          ? "Experience"
                          : "Coupon/Discount"}
                      </Badge>
                    </TableCell>
                    <TableCell>{reward.pointsCost} points</TableCell>
                    <TableCell>
                      <Badge
                        variant={reward.isActive ? "default" : "secondary"}
                      >
                        {reward.isActive ? "Active" : "Inactive"}
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
                          <DropdownMenuItem onClick={() => handleEdit(reward)}>
                            <Pencil className="mr-2 h-4 w-4" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            className="text-destructive"
                            onClick={() => handleDelete(reward.id)}
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
  );
}
