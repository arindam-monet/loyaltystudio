import { useState } from "react";
import {
  Button,
  Card,
  CardContent,
  CardDescription,
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
} from "@loyaltystudio/ui";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { MoreHorizontal, Pencil, Plus, Trash2 } from "lucide-react";

const rewardSchema = z.object({
  name: z.string().min(1, "Name is required"),
  description: z.string().min(1, "Description is required"),
  type: z.enum(["PHYSICAL", "DIGITAL", "EXPERIENCE", "COUPON"]),
  pointsCost: z.number().min(0, "Points cost must be positive"),
  stock: z.number().optional(),
  validityPeriod: z.number().optional(),
  redemptionLimit: z.number().optional(),
  conditions: z.record(z.any()).optional(),
});

type RewardFormData = z.infer<typeof rewardSchema>;

interface Reward extends RewardFormData {
  id: string;
}

interface RewardManagerProps {
  rewards: Reward[];
  onAddReward: (reward: RewardFormData) => void;
  onUpdateReward: (id: string, reward: RewardFormData) => void;
  onDeleteReward: (id: string) => void;
}

export function RewardManager({
  rewards,
  onAddReward,
  onUpdateReward,
  onDeleteReward,
}: RewardManagerProps) {
  const [open, setOpen] = useState(false);
  const [editingReward, setEditingReward] = useState<Reward | null>(null);

  const form = useForm<RewardFormData>({
    resolver: zodResolver(rewardSchema),
    defaultValues: {
      name: "",
      description: "",
      type: "DIGITAL",
      pointsCost: 0,
      stock: undefined,
      validityPeriod: undefined,
      redemptionLimit: undefined,
      conditions: {},
    },
  });

  const onSubmit = async (data: RewardFormData) => {
    try {
      if (editingReward) {
        await onUpdateReward(editingReward.id, data);
      } else {
        await onAddReward(data);
      }
      setOpen(false);
      form.reset();
      setEditingReward(null);
    } catch (error) {
      console.error("Failed to save reward:", error);
    }
  };

  const handleEdit = (reward: Reward) => {
    setEditingReward(reward);
    form.reset(reward);
    setOpen(true);
  };

  const handleDelete = async (id: string) => {
    try {
      await onDeleteReward(id);
    } catch (error) {
      console.error("Failed to delete reward:", error);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Program Rewards</h2>
          <p className="text-muted-foreground">
            Create and manage rewards for your loyalty program
          </p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Add Reward
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {editingReward ? "Edit Reward" : "Create Reward"}
              </DialogTitle>
              <DialogDescription>
                Set up a new reward for your loyalty program
              </DialogDescription>
            </DialogHeader>

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
                          <SelectItem value="PHYSICAL">Physical Product</SelectItem>
                          <SelectItem value="DIGITAL">Digital Item</SelectItem>
                          <SelectItem value="EXPERIENCE">Experience</SelectItem>
                          <SelectItem value="COUPON">Coupon/Discount</SelectItem>
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
                          placeholder="Enter points required"
                        />
                      </FormControl>
                      <FormDescription>
                        Points required to redeem this reward
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="stock"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Stock</FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            type="number"
                            onChange={(e) =>
                              field.onChange(
                                e.target.value ? Number(e.target.value) : undefined
                              )
                            }
                            placeholder="Available quantity"
                          />
                        </FormControl>
                        <FormDescription>
                          Leave empty for unlimited
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
                        <FormLabel>Redemption Limit</FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            type="number"
                            onChange={(e) =>
                              field.onChange(
                                e.target.value ? Number(e.target.value) : undefined
                              )
                            }
                            placeholder="Per user limit"
                          />
                        </FormControl>
                        <FormDescription>
                          Leave empty for unlimited
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
                      <FormLabel>Validity Period (Days)</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          type="number"
                          onChange={(e) =>
                            field.onChange(
                              e.target.value ? Number(e.target.value) : undefined
                            )
                          }
                          placeholder="Days until expiration"
                        />
                      </FormControl>
                      <FormDescription>
                        Leave empty for no expiration
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="flex justify-end space-x-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setOpen(false);
                      form.reset();
                      setEditingReward(null);
                    }}
                  >
                    Cancel
                  </Button>
                  <Button type="submit">
                    {editingReward ? "Update Reward" : "Create Reward"}
                  </Button>
                </div>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Available Rewards</CardTitle>
          <CardDescription>
            View and manage your program's rewards catalog
          </CardDescription>
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
              {rewards.map((reward) => (
                <TableRow key={reward.id}>
                  <TableCell>
                    <div>
                      <div className="font-medium">{reward.name}</div>
                      <div className="text-sm text-muted-foreground">
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
                    <Badge variant="secondary">
                      {reward.pointsCost.toLocaleString()} points
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {reward.stock !== undefined ? (
                      <span>{reward.stock.toLocaleString()}</span>
                    ) : (
                      <span className="text-muted-foreground">Unlimited</span>
                    )}
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
                          Edit Reward
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          className="text-destructive"
                          onClick={() => handleDelete(reward.id)}
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          Delete Reward
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
              {!rewards.length && (
                <TableRow>
                  <TableCell colSpan={5} className="h-24 text-center">
                    No rewards found. Create your first reward to get started.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
} 