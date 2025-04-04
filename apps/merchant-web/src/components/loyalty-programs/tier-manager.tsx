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

const tierSchema = z.object({
  name: z.string().min(1, "Name is required"),
  description: z.string().optional(),
  pointsThreshold: z.number().min(0, "Points threshold must be positive"),
  benefits: z.record(z.any()).optional(),
});

type TierFormData = z.infer<typeof tierSchema>;

interface Tier extends TierFormData {
  id: string;
}

interface TierManagerProps {
  tiers: Tier[];
  onAddTier: (tier: TierFormData) => void;
  onUpdateTier: (id: string, tier: TierFormData) => void;
  onDeleteTier: (id: string) => void;
}

export function TierManager({ tiers, onAddTier, onUpdateTier, onDeleteTier }: TierManagerProps) {
  const [open, setOpen] = useState(false);
  const [editingTier, setEditingTier] = useState<Tier | null>(null);

  const form = useForm<TierFormData>({
    resolver: zodResolver(tierSchema),
    defaultValues: {
      name: "",
      description: "",
      pointsThreshold: 0,
      benefits: {},
    },
  });

  const onSubmit = async (data: TierFormData) => {
    try {
      if (editingTier) {
        await onUpdateTier(editingTier.id, data);
      } else {
        await onAddTier(data);
      }
      setOpen(false);
      form.reset();
      setEditingTier(null);
    } catch (error) {
      console.error("Failed to save tier:", error);
    }
  };

  const handleEdit = (tier: Tier) => {
    setEditingTier(tier);
    form.reset(tier);
    setOpen(true);
  };

  const handleDelete = async (id: string) => {
    try {
      await onDeleteTier(id);
    } catch (error) {
      console.error("Failed to delete tier:", error);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Program Tiers</h2>
          <p className="text-muted-foreground">
            Create and manage membership tiers for your loyalty program
          </p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Add Tier
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {editingTier ? "Edit Tier" : "Create Tier"}
              </DialogTitle>
              <DialogDescription>
                Set up a new membership tier for your loyalty program
              </DialogDescription>
            </DialogHeader>

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
                          placeholder="Enter points required"
                        />
                      </FormControl>
                      <FormDescription>
                        Points required to reach this tier
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
                      setEditingTier(null);
                    }}
                  >
                    Cancel
                  </Button>
                  <Button type="submit">
                    {editingTier ? "Update Tier" : "Create Tier"}
                  </Button>
                </div>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Membership Tiers</CardTitle>
          <CardDescription>
            View and manage your program's membership tiers
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Tier Name</TableHead>
                <TableHead>Points Required</TableHead>
                <TableHead>Description</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {tiers.map((tier) => (
                <TableRow key={tier.id}>
                  <TableCell className="font-medium">{tier.name}</TableCell>
                  <TableCell>
                    <Badge variant="secondary">
                      {tier.pointsThreshold.toLocaleString()} points
                    </Badge>
                  </TableCell>
                  <TableCell>{tier.description}</TableCell>
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
                          Edit Tier
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          className="text-destructive"
                          onClick={() => handleDelete(tier.id)}
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          Delete Tier
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
              {!tiers.length && (
                <TableRow>
                  <TableCell colSpan={4} className="h-24 text-center">
                    No tiers found. Create your first tier to get started.
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