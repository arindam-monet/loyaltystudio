import React, { useState } from "react";
// Import UI components from the correct package
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
  id: z.string().optional(),
  name: z.string().min(1, "Name is required"),
  description: z.string().optional(),
  pointsThreshold: z.number().min(0, "Points threshold must be positive"),
  benefits: z.array(z.string()).default([]),
});

type TierFormData = z.infer<typeof tierSchema>;

interface SimpleTierManagerProps {
  tiers: TierFormData[];
  onTiersChange: (tiers: TierFormData[]) => void;
}

export function SimpleTierManager({
  tiers,
  onTiersChange,
}: SimpleTierManagerProps) {
  const [open, setOpen] = useState(false);
  // Initialize with empty array if tiers is undefined
  const safeTiers = Array.isArray(tiers) ? tiers : [];
  const [editingTier, setEditingTier] = useState<TierFormData | null>(null);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);

  const form = useForm({
    resolver: zodResolver(tierSchema),
    defaultValues: {
      name: "",
      description: "",
      pointsThreshold: 0,
      benefits: [],
    },
  });

  const onSubmit = (data: any) => {
    if (editingIndex !== null) {
      // Update existing tier
      const updatedTiers = [...safeTiers];
      updatedTiers[editingIndex] = { ...data, benefits: data.benefits || [] };
      onTiersChange(updatedTiers);
    } else {
      // Add new tier
      onTiersChange([...safeTiers, { ...data, id: `tier-${Date.now()}` }]);
    }
    setOpen(false);
    form.reset();
    setEditingTier(null);
    setEditingIndex(null);
  };

  const handleEdit = (tier: TierFormData, index: number) => {
    setEditingTier(tier);
    setEditingIndex(index);
    form.reset(tier);
    setOpen(true);
  };

  const handleDelete = (index: number) => {
    const updatedTiers = [...safeTiers];
    updatedTiers.splice(index, 1);
    onTiersChange(updatedTiers);
  };

  // Sort tiers by points threshold
  const sortedTiers = [...safeTiers].sort(
    (a, b) => a.pointsThreshold - b.pointsThreshold
  );

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-medium">
            Membership Tiers{" "}
            <span className="px-2 py-1 bg-muted text-xs rounded-md">
              Optional
            </span>
          </h3>
          <p className="text-sm text-muted-foreground">
            Create tiers to reward your most loyal customers
          </p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button size="sm" type="button">
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
              <form
                onSubmit={(e) => {
                  e.preventDefault(); // Prevent form submission from bubbling up
                  e.stopPropagation(); // Stop propagation to parent forms
                  form.handleSubmit((data) => onSubmit(data as TierFormData))(e);
                }}
                className="space-y-4"
              >
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }: { field: any }) => (
                    <FormItem>
                      <FormLabel>Tier Name</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          placeholder="e.g., Silver, Gold, Platinum"
                        />
                      </FormControl>
                      <FormDescription>
                        A name for this membership tier
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }: { field: any }) => (
                    <FormItem>
                      <FormLabel>Description (Optional)</FormLabel>
                      <FormControl>
                        <Textarea
                          {...field}
                          placeholder="Describe the benefits of this tier"
                        />
                      </FormControl>
                      <FormDescription>
                        Explain what makes this tier special
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="pointsThreshold"
                  render={({ field }: { field: any }) => (
                    <FormItem>
                      <FormLabel>Points Threshold</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          type="number"
                          onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                            field.onChange(Number(e.target.value))
                          }
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
                    onClick={(e) => {
                      e.stopPropagation(); // Stop propagation to parent forms
                      setOpen(false);
                      form.reset();
                      setEditingTier(null);
                      setEditingIndex(null);
                    }}
                  >
                    Cancel
                  </Button>
                  <Button type="submit" onClick={(e) => e.stopPropagation()}>
                    {editingTier ? "Update Tier" : "Create Tier"}
                  </Button>
                </div>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      {safeTiers.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="pt-6 text-center">
            <p className="text-muted-foreground">
              No tiers defined yet. Add tiers to create a multi-level loyalty
              program.
            </p>
            <Button
              variant="outline"
              className="mt-4"
              type="button"
              onClick={() => setOpen(true)}
            >
              <Plus className="mr-2 h-4 w-4" />
              Add First Tier
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Membership Tiers</CardTitle>
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
                {sortedTiers.map((tier, index) => (
                  <TableRow key={tier.id || index}>
                    <TableCell className="font-medium">{tier.name}</TableCell>
                    <TableCell>
                      <Badge variant="secondary">
                        {tier.pointsThreshold.toLocaleString()} points
                      </Badge>
                    </TableCell>
                    <TableCell className="max-w-xs truncate">
                      {tier.description || "—"}
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
                            onClick={() => handleEdit(tier, index)}
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
