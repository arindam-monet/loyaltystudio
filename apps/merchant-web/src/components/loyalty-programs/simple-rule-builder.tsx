import { useState } from "react";
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

const ruleSchema = z.object({
  name: z.string().min(1, "Name is required"),
  type: z.enum(["FIXED", "PERCENTAGE"]),
  points: z.number().min(1, "Points must be at least 1"),
  minAmount: z.number().optional(),
});

type RuleFormData = z.infer<typeof ruleSchema>;

interface SimpleRuleBuilderProps {
  rules: RuleFormData[];
  onRulesChange: (rules: RuleFormData[]) => void;
}

export function SimpleRuleBuilder({ rules, onRulesChange }: SimpleRuleBuilderProps) {
  const [open, setOpen] = useState(false);
  const [editingRule, setEditingRule] = useState<RuleFormData | null>(null);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);

  const form = useForm<RuleFormData>({
    resolver: zodResolver(ruleSchema),
    defaultValues: {
      name: "",
      type: "FIXED",
      points: 1,
      minAmount: 0,
    },
  });

  const onSubmit = (data: RuleFormData) => {
    if (editingIndex !== null) {
      // Update existing rule
      const updatedRules = [...rules];
      updatedRules[editingIndex] = data;
      onRulesChange(updatedRules);
    } else {
      // Add new rule
      onRulesChange([...rules, data]);
    }
    setOpen(false);
    form.reset();
    setEditingRule(null);
    setEditingIndex(null);
  };

  const handleEdit = (rule: RuleFormData, index: number) => {
    setEditingRule(rule);
    setEditingIndex(index);
    form.reset(rule);
    setOpen(true);
  };

  const handleDelete = (index: number) => {
    const updatedRules = [...rules];
    updatedRules.splice(index, 1);
    onRulesChange(updatedRules);
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-medium">Point Earning Rules</h3>
          <p className="text-sm text-muted-foreground">
            Define how customers earn points in your program
          </p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button size="sm">
              <Plus className="mr-2 h-4 w-4" />
              Add Rule
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {editingRule ? "Edit Rule" : "Create Rule"}
              </DialogTitle>
              <DialogDescription>
                Define how customers earn points in your program
              </DialogDescription>
            </DialogHeader>

            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Rule Name</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="e.g., Base Points, Bonus Points" />
                      </FormControl>
                      <FormDescription>
                        A descriptive name for this rule
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="type"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Rule Type</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select rule type" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="FIXED">Fixed Points</SelectItem>
                          <SelectItem value="PERCENTAGE">Percentage-based Points</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormDescription>
                        How points are calculated for this rule
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="points"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        {form.watch("type") === "FIXED" ? "Points per Purchase" : "Percentage Rate"}
                      </FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          type="number"
                          onChange={(e) => field.onChange(Number(e.target.value))}
                          placeholder={form.watch("type") === "FIXED" ? "e.g., 10" : "e.g., 5"}
                        />
                      </FormControl>
                      <FormDescription>
                        {form.watch("type") === "FIXED"
                          ? "Number of points earned per purchase"
                          : "Percentage of purchase amount converted to points"}
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="minAmount"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Minimum Purchase Amount (Optional)</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          type="number"
                          onChange={(e) => field.onChange(Number(e.target.value) || 0)}
                          placeholder="e.g., 10"
                        />
                      </FormControl>
                      <FormDescription>
                        Minimum purchase amount required to earn points (0 for no minimum)
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
                      setEditingRule(null);
                      setEditingIndex(null);
                    }}
                  >
                    Cancel
                  </Button>
                  <Button type="submit">
                    {editingRule ? "Update Rule" : "Create Rule"}
                  </Button>
                </div>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      {rules.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="pt-6 text-center">
            <p className="text-muted-foreground">
              No rules defined yet. Add your first rule to define how customers earn points.
            </p>
            <Button
              variant="outline"
              className="mt-4"
              onClick={() => setOpen(true)}
            >
              <Plus className="mr-2 h-4 w-4" />
              Add First Rule
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Point Earning Rules</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Rule Name</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Points</TableHead>
                  <TableHead>Min. Amount</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rules.map((rule, index) => (
                  <TableRow key={index}>
                    <TableCell className="font-medium">{rule.name}</TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {rule.type === "FIXED" ? "Fixed" : "Percentage"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {rule.type === "FIXED"
                        ? `${rule.points} points`
                        : `${rule.points}%`}
                    </TableCell>
                    <TableCell>
                      {rule.minAmount && rule.minAmount > 0
                        ? `$${rule.minAmount}`
                        : "None"}
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
                          <DropdownMenuItem onClick={() => handleEdit(rule, index)}>
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
