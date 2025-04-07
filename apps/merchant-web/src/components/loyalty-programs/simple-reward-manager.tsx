import React, { useState } from "react";
import {
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
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
  ScrollArea,
} from "@loyaltystudio/ui";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { MoreHorizontal, Pencil, Plus, Trash2 } from "lucide-react";

const rewardSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(1, "Name is required"),
  description: z.string().min(1, "Description is required"),
  type: z.enum(["PHYSICAL", "DIGITAL", "EXPERIENCE", "COUPON"]),
  pointsCost: z.number().min(1, "Points cost must be positive"),
  stock: z.number().optional(),
  validityPeriod: z.number().optional(),
  redemptionLimit: z.number().optional(),
});

type RewardFormData = z.infer<typeof rewardSchema>;

interface SimpleRewardManagerProps {
  rewards: RewardFormData[];
  onRewardsChange: (rewards: RewardFormData[]) => void;
}

export function SimpleRewardManager({
  rewards,
  onRewardsChange,
}: SimpleRewardManagerProps) {
  const [open, setOpen] = useState(false);
  // Initialize with empty array if rewards is undefined
  const safeRewards = Array.isArray(rewards) ? rewards : [];
  const [editingReward, setEditingReward] = useState<RewardFormData | null>(
    null
  );
  const [editingIndex, setEditingIndex] = useState<number | null>(null);

  const form = useForm({
    resolver: zodResolver(rewardSchema),
    defaultValues: {
      name: "",
      description: "",
      type: "DIGITAL",
      pointsCost: 100,
      stock: undefined,
      validityPeriod: undefined,
      redemptionLimit: undefined,
    },
  });

  const onSubmit = (data: any) => {
    if (editingIndex !== null) {
      // Update existing reward
      const updatedRewards = [...safeRewards];
      updatedRewards[editingIndex] = data;
      onRewardsChange(updatedRewards);
    } else {
      // Add new reward
      onRewardsChange([...safeRewards, { ...data, id: `reward-${Date.now()}` }]);
    }
    setOpen(false);
    form.reset();
    setEditingReward(null);
    setEditingIndex(null);
  };

  const handleEdit = (reward: RewardFormData, index: number) => {
    setEditingReward(reward);
    setEditingIndex(index);
    form.reset(reward);
    setOpen(true);
  };

  const handleDelete = (index: number) => {
    const updatedRewards = [...safeRewards];
    updatedRewards.splice(index, 1);
    onRewardsChange(updatedRewards);
  };

  // Sort rewards by points cost
  const sortedRewards = [...safeRewards].sort(
    (a, b) => a.pointsCost - b.pointsCost
  );

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-medium">
            Program Rewards{" "}
            <span className="px-2 py-1 bg-muted text-xs rounded-md">
              Optional
            </span>
          </h3>
          <p className="text-sm text-muted-foreground">
            Create rewards that customers can redeem with their points
          </p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button size="sm" type="button">
              <Plus className="mr-2 h-4 w-4" />
              Add Reward
            </Button>
          </DialogTrigger>
          <DialogContent className="max-h-[90vh] overflow-hidden flex flex-col max-w-2xl w-full">
            <DialogHeader>
              <DialogTitle>
                {editingReward ? "Edit Reward" : "Create Reward"}
              </DialogTitle>
              <DialogDescription>
                Set up a new reward for your loyalty program
              </DialogDescription>
            </DialogHeader>

            <Form {...form}>
              <form
                onSubmit={(e) => {
                  e.preventDefault(); // Prevent form submission from bubbling up
                  e.stopPropagation(); // Stop propagation to parent forms
                  form.handleSubmit((data) => onSubmit(data as RewardFormData))(e);
                }}
                className="flex flex-col h-full"
              >
                <ScrollArea className="flex-1 pr-4 overflow-auto" style={{ height: 'calc(80vh - 200px)' }}>
                  <div className="space-y-4">
                    <FormField
                      control={form.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Reward Name</FormLabel>
                          <FormControl>
                            <Input
                              {...field}
                              placeholder="e.g., Free Coffee, $10 Discount"
                            />
                          </FormControl>
                          <FormDescription>A name for this reward</FormDescription>
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
                            <Textarea
                              {...field}
                              placeholder="Describe the reward in detail"
                            />
                          </FormControl>
                          <FormDescription>
                            Explain what the customer gets with this reward
                          </FormDescription>
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
                                <SelectItem value="PHYSICAL">
                                  Physical Product
                                </SelectItem>
                                <SelectItem value="DIGITAL">
                                  Digital Item
                                </SelectItem>
                                <SelectItem value="EXPERIENCE">
                                  Experience
                                </SelectItem>
                                <SelectItem value="COUPON">
                                  Discount Coupon
                                </SelectItem>
                              </SelectContent>
                            </Select>
                            <FormDescription>The type of reward</FormDescription>
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
                                onChange={(e) =>
                                  field.onChange(Number(e.target.value))
                                }
                                placeholder="e.g., 500"
                              />
                            </FormControl>
                            <FormDescription>
                              Points required to redeem this reward
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    {form.watch("type") === "PHYSICAL" && (
                      <FormField
                        control={form.control}
                        name="stock"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Stock Available (Optional)</FormLabel>
                            <FormControl>
                              <Input
                                {...field}
                                type="number"
                                onChange={(e) =>
                                  field.onChange(
                                    e.target.value
                                      ? Number(e.target.value)
                                      : undefined
                                  )
                                }
                                placeholder="e.g., 100"
                              />
                            </FormControl>
                            <FormDescription>
                              Number of items available (leave empty for unlimited)
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    )}

                  </div>
                </ScrollArea>

                <div className="flex justify-end space-x-2 pt-4 mt-4 border-t">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={(e) => {
                      e.stopPropagation(); // Stop propagation to parent forms
                      setOpen(false);
                      form.reset();
                      setEditingReward(null);
                      setEditingIndex(null);
                    }}
                  >
                    Cancel
                  </Button>
                  <Button type="submit" onClick={(e) => e.stopPropagation()}>
                    {editingReward ? "Update Reward" : "Create Reward"}
                  </Button>
                </div>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      {safeRewards.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="pt-6 text-center">
            <p className="text-muted-foreground">
              No rewards defined yet. Add rewards that customers can redeem with
              their points.
            </p>
            <Button
              variant="outline"
              className="mt-4"
              type="button"
              onClick={() => setOpen(true)}
            >
              <Plus className="mr-2 h-4 w-4" />
              Add First Reward
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Available Rewards</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Reward Name</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Points Cost</TableHead>
                  <TableHead>Stock</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sortedRewards.map((reward, index) => (
                  <TableRow key={reward.id || index}>
                    <TableCell>
                      <div>
                        <div className="font-medium">{reward.name}</div>
                        <div className="text-sm text-muted-foreground truncate max-w-xs">
                          {reward.description}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {reward.type === "PHYSICAL"
                          ? "Physical"
                          : reward.type === "DIGITAL"
                            ? "Digital"
                            : reward.type === "EXPERIENCE"
                              ? "Experience"
                              : "Coupon"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge>{reward.pointsCost.toLocaleString()} points</Badge>
                    </TableCell>
                    <TableCell>
                      {reward.stock !== undefined
                        ? reward.stock.toLocaleString()
                        : "Unlimited"}
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuLabel>Actions</DropdownMenuLabel>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            onClick={() => handleEdit(reward, index)}
                          >
                            <Pencil className="mr-2 h-4 w-4" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleDelete(index)}>
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
