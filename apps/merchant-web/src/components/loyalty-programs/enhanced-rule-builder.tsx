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
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@loyaltystudio/ui";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { MoreHorizontal, Pencil, Plus, Trash2, X } from "lucide-react";

// Define condition types
const conditionTypes = [
  { value: "cartValue", label: "Total cart value" },
  { value: "loyaltyTier", label: "Loyalty Tier" },
  { value: "purchaseCategory", label: "Purchase Category" },
  { value: "transactionChannel", label: "Transaction Channel" },
  { value: "purchaseCount", label: "Purchase Count" },
  { value: "dayOfWeek", label: "Day of Week" },
  { value: "timeOfDay", label: "Time of Day" },
] as const;

// Define operators
const operators = [
  { value: "equals", label: "equals" },
  { value: "greaterThan", label: "is greater than" },
  { value: "lessThan", label: "is less than" },
  { value: "contains", label: "contains" },
  { value: "in", label: "is a" },
] as const;

// Define effect types
const effectTypes = [
  { value: "addPoints", label: "Add loyalty points" },
  { value: "applyDiscount", label: "Apply discount" },
  { value: "giveReward", label: "Give reward" },
] as const;

// Define schema for a single condition
const conditionSchema = z.object({
  type: z.enum(conditionTypes.map(c => c.value) as [string, ...string[]]),
  operator: z.enum(operators.map(o => o.value) as [string, ...string[]]),
  value: z.string().min(1, "Value is required"),
});

// Define schema for a single effect
const effectSchema = z.object({
  type: z.enum(effectTypes.map(e => e.value) as [string, ...string[]]),
  value: z.string().min(1, "Value is required"),
  formula: z.string().optional(),
});

// Define schema for the entire rule
const ruleSchema = z.object({
  name: z.string().min(1, "Rule name is required"),
  description: z.string().optional(),
  isActive: z.boolean().default(true),
  conditions: z.array(conditionSchema).min(1, "At least one condition is required"),
  effects: z.array(effectSchema).min(1, "At least one effect is required"),
});

type RuleFormData = z.infer<typeof ruleSchema>;

interface EnhancedRuleBuilderProps {
  programId: string;
  initialRules?: RuleFormData[];
  onSave?: (rules: RuleFormData[]) => Promise<void>;
}

export function EnhancedRuleBuilder({
  programId,
  initialRules = [],
  onSave
}: EnhancedRuleBuilderProps) {
  const [rules, setRules] = useState<RuleFormData[]>(initialRules);
  const [open, setOpen] = useState(false);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const form = useForm<RuleFormData>({
    resolver: zodResolver(ruleSchema),
    defaultValues: {
      name: "",
      description: "",
      isActive: true,
      conditions: [{ type: "cartValue", operator: "greaterThan", value: "" }],
      effects: [{ type: "addPoints", value: "" }],
    },
  });

  const handleAddCondition = () => {
    const currentConditions = form.getValues("conditions") || [];
    form.setValue("conditions", [
      ...currentConditions,
      { type: "cartValue", operator: "greaterThan", value: "" },
    ]);
  };

  const handleRemoveCondition = (index: number) => {
    const currentConditions = form.getValues("conditions") || [];
    if (currentConditions.length > 1) {
      form.setValue(
        "conditions",
        currentConditions.filter((_, i) => i !== index)
      );
    }
  };

  const handleAddEffect = () => {
    const currentEffects = form.getValues("effects") || [];
    form.setValue("effects", [
      ...currentEffects,
      { type: "addPoints", value: "" },
    ]);
  };

  const handleRemoveEffect = (index: number) => {
    const currentEffects = form.getValues("effects") || [];
    if (currentEffects.length > 1) {
      form.setValue(
        "effects",
        currentEffects.filter((_, i) => i !== index)
      );
    }
  };

  const onSubmit = (data: RuleFormData) => {
    if (editingIndex !== null) {
      // Update existing rule
      const updatedRules = [...rules];
      updatedRules[editingIndex] = data;
      setRules(updatedRules);
    } else {
      // Add new rule
      setRules([...rules, data]);
    }
    setOpen(false);
    form.reset();
    setEditingIndex(null);
  };

  const handleEdit = (rule: RuleFormData, index: number) => {
    setEditingIndex(index);
    form.reset(rule);
    setOpen(true);
  };

  const handleDelete = (index: number) => {
    const updatedRules = [...rules];
    updatedRules.splice(index, 1);
    setRules(updatedRules);
  };

  const handleSaveRules = async () => {
    if (onSave) {
      setIsSaving(true);
      try {
        await onSave(rules);
      } finally {
        setIsSaving(false);
      }
    }
  };

  const getConditionLabel = (condition: any) => {
    const typeLabel = conditionTypes.find(t => t.value === condition.type)?.label || condition.type;
    const operatorLabel = operators.find(o => o.value === condition.operator)?.label || condition.operator;
    return `${typeLabel} ${operatorLabel} ${condition.value}`;
  };

  const getEffectLabel = (effect: any) => {
    const typeLabel = effectTypes.find(t => t.value === effect.type)?.label || effect.type;

    if (effect.type === 'addPoints') {
      return `${typeLabel}: ${effect.value} points`;
    } else if (effect.type === 'applyDiscount') {
      return `${typeLabel}: ${effect.value}%`;
    } else {
      return `${typeLabel}: ${effect.value}`;
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">Loyalty Program Rules</h2>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => {
              form.reset();
              setEditingIndex(null);
              setOpen(true);
            }}
          >
            <Plus className="mr-2 h-4 w-4" />
            Add Rule
          </Button>
        </div>
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
              onClick={() => {
                form.reset();
                setEditingIndex(null);
                setOpen(true);
              }}
            >
              <Plus className="mr-2 h-4 w-4" />
              Add First Rule
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Loyalty Program Rules</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Rule Name</TableHead>
                  <TableHead>Conditions</TableHead>
                  <TableHead>Effects</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rules.map((rule, index) => (
                  <TableRow key={index}>
                    <TableCell className="font-medium">
                      <div>{rule.name}</div>
                      {rule.description && (
                        <div className="text-xs text-muted-foreground">{rule.description}</div>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        {rule.conditions.map((condition, i) => (
                          <div key={i} className="text-sm">
                            {i === 0 ? "If: " : "And: "}
                            <Badge variant="outline" className="ml-1">
                              {getConditionLabel(condition)}
                            </Badge>
                          </div>
                        ))}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        {rule.effects.map((effect, i) => (
                          <div key={i} className="text-sm">
                            <Badge variant="outline">
                              {getEffectLabel(effect)}
                            </Badge>
                          </div>
                        ))}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={rule.isActive ? "default" : "secondary"}>
                        {rule.isActive ? "Active" : "Inactive"}
                      </Badge>
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
                          <DropdownMenuItem
                            onClick={() => handleDelete(index)}
                            className="text-destructive"
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

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingIndex !== null ? "Edit Rule" : "Add New Rule"}</DialogTitle>
            <DialogDescription>
              Define conditions and effects for this loyalty program rule.
            </DialogDescription>
          </DialogHeader>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Rule Name</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="e.g., Gold Tier Bonus" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="isActive"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                      <div className="space-y-0.5">
                        <FormLabel>Active</FormLabel>
                        <FormDescription>
                          Enable or disable this rule
                        </FormDescription>
                      </div>
                      <FormControl>
                        <input
                          type="checkbox"
                          checked={field.value}
                          onChange={field.onChange}
                          className="accent-primary h-4 w-4"
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description (Optional)</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="Brief description of this rule" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-medium">Conditions</h3>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleAddCondition}
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    Add Condition
                  </Button>
                </div>

                <Card>
                  <CardContent className="pt-6">
                    {form.watch("conditions")?.map((_, index) => (
                      <div key={index} className="flex items-start gap-2 mb-4">
                        <div className="w-20 pt-2 text-sm">
                          {index === 0 ? "If:" : "And:"}
                        </div>
                        <div className="flex-1 grid grid-cols-3 gap-2">
                          <FormField
                            control={form.control}
                            name={`conditions.${index}.type`}
                            render={({ field }) => (
                              <FormItem>
                                <Select
                                  value={field.value}
                                  onValueChange={field.onChange}
                                >
                                  <SelectTrigger>
                                    <SelectValue placeholder="Select condition" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {conditionTypes.map((type) => (
                                      <SelectItem key={type.value} value={type.value}>
                                        {type.label}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={form.control}
                            name={`conditions.${index}.operator`}
                            render={({ field }) => (
                              <FormItem>
                                <Select
                                  value={field.value}
                                  onValueChange={field.onChange}
                                >
                                  <SelectTrigger>
                                    <SelectValue placeholder="Select operator" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {operators.map((op) => (
                                      <SelectItem key={op.value} value={op.value}>
                                        {op.label}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={form.control}
                            name={`conditions.${index}.value`}
                            render={({ field }) => (
                              <FormItem>
                                <FormControl>
                                  <Input {...field} placeholder="Value" />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>
                        {form.watch("conditions").length > 1 && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => handleRemoveCondition(index)}
                            className="mt-1"
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    ))}
                  </CardContent>
                </Card>
              </div>

              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-medium">Effects</h3>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleAddEffect}
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    Add Effect
                  </Button>
                </div>

                <Card>
                  <CardContent className="pt-6">
                    {form.watch("effects")?.map((_, index) => (
                      <div key={index} className="flex items-start gap-2 mb-4">
                        <div className="flex-1 grid grid-cols-3 gap-2">
                          <FormField
                            control={form.control}
                            name={`effects.${index}.type`}
                            render={({ field }) => (
                              <FormItem>
                                <Select
                                  value={field.value}
                                  onValueChange={field.onChange}
                                >
                                  <SelectTrigger>
                                    <SelectValue placeholder="Select effect" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {effectTypes.map((type) => (
                                      <SelectItem key={type.value} value={type.value}>
                                        {type.label}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={form.control}
                            name={`effects.${index}.value`}
                            render={({ field }) => (
                              <FormItem>
                                <FormControl>
                                  <Input {...field} placeholder="Value" />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          {form.watch(`effects.${index}.type`) === "addPoints" && (
                            <FormField
                              control={form.control}
                              name={`effects.${index}.formula`}
                              render={({ field }) => (
                                <FormItem>
                                  <Select
                                    value={field.value || ""}
                                    onValueChange={field.onChange}
                                  >
                                    <SelectTrigger>
                                      <SelectValue placeholder="Formula (optional)" />
                                    </SelectTrigger>
                                    <SelectContent>
                                      <SelectItem value="fixed">Fixed amount</SelectItem>
                                      <SelectItem value="percentage">% of transaction</SelectItem>
                                    </SelectContent>
                                  </Select>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          )}
                        </div>
                        {form.watch("effects").length > 1 && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => handleRemoveEffect(index)}
                            className="mt-1"
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    ))}
                  </CardContent>
                </Card>
              </div>

              <div className="flex justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setOpen(false);
                    form.reset();
                  }}
                >
                  Cancel
                </Button>
                <Button type="submit">
                  {editingIndex !== null ? "Update Rule" : "Add Rule"}
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {rules.length > 0 && (
        <div className="flex justify-end mt-6">
          <Button
            variant="default"
            size="lg"
            onClick={handleSaveRules}
            disabled={isSaving}
            className="px-8"
          >
            {isSaving ? "Saving..." : "Save All Rules"}
          </Button>
        </div>
      )}
    </div>
  );
}
