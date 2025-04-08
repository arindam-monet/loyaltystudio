import React, { useState, useEffect } from "react";
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
  DialogFooter,
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
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
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
import { MoreHorizontal, Pencil, Plus, Trash2, X, Gift, Award } from "lucide-react";
import { useProgramTiers } from "@/hooks/use-program-tiers";
import { useProgramRewards } from "@/hooks/use-program-rewards";

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
  { value: "upgradeTier", label: "Upgrade to tier" },
] as const;

// Define schema for a single condition
const conditionSchema = z.object({
  type: z.enum(conditionTypes.map(c => c.value) as [string, ...string[]]),
  operator: z.enum(operators.map(o => o.value) as [string, ...string[]]),
  value: z.string().min(1, "Value is required"),
  tierId: z.string().optional(),
});

// Define schema for a single effect
const effectSchema = z.object({
  type: z.enum(effectTypes.map(e => e.value) as [string, ...string[]]),
  value: z.string().min(1, "Value is required"),
  formula: z.string().optional(),
  rewardId: z.string().optional(),
  tierId: z.string().optional(),
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
  // Fetch tiers and rewards for the program
  const { tiers, isLoading: tiersLoading } = useProgramTiers(programId);
  const { rewards, isLoading: rewardsLoading } = useProgramRewards(programId);
  const [rules, setRules] = useState<RuleFormData[]>(initialRules);
  const [open, setOpen] = useState(false);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [deleteIndex, setDeleteIndex] = useState<number | null>(null);

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

  // Get appropriate operators based on condition type
  const getOperatorsForConditionType = (conditionType: string) => {
    switch (conditionType) {
      case 'loyaltyTier':
        return operators.filter(op => ['equals', 'in'].includes(op.value));
      case 'purchaseCategory':
        return operators.filter(op => ['equals', 'contains'].includes(op.value));
      case 'dayOfWeek':
      case 'timeOfDay':
        return operators.filter(op => ['equals'].includes(op.value));
      default:
        return operators;
    }
  };

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

  const handleDeleteClick = (index: number) => {
    setDeleteIndex(index);
    setDeleteConfirmOpen(true);
  };

  const handleDelete = () => {
    if (deleteIndex !== null) {
      const updatedRules = [...rules];
      updatedRules.splice(deleteIndex, 1);
      setRules(updatedRules);
      setDeleteIndex(null);
    }
    setDeleteConfirmOpen(false);
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

    if (condition.type === 'loyaltyTier' && condition.tierId) {
      const tierName = tiers.find(t => t.id === condition.tierId)?.name || condition.value;
      return `${typeLabel} ${operatorLabel} ${tierName}`;
    }

    return `${typeLabel} ${operatorLabel} ${condition.value}`;
  };

  const getEffectLabel = (effect: any) => {
    const typeLabel = effectTypes.find(t => t.value === effect.type)?.label || effect.type;

    if (effect.type === 'addPoints') {
      return `${typeLabel}: ${effect.value} points`;
    } else if (effect.type === 'applyDiscount') {
      return `${typeLabel}: ${effect.value}%`;
    } else if (effect.type === 'giveReward') {
      const rewardName = rewards.find(r => r.id === effect.rewardId)?.name || effect.value;
      return `${typeLabel}: ${rewardName}`;
    } else if (effect.type === 'upgradeTier') {
      const tierName = tiers.find(t => t.id === effect.tierId)?.name || effect.value;
      return `${typeLabel}: ${tierName}`;
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
        <div className="space-y-4">
          {rules.map((rule, index) => (
            <Card key={index} className={!rule.isActive ? "opacity-70" : ""}>
              <CardHeader className="pb-2">
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-lg flex items-center gap-2">
                      {rule.name}
                      <Badge variant={rule.isActive ? "default" : "secondary"} className="ml-2">
                        {rule.isActive ? "Active" : "Inactive"}
                      </Badge>
                    </CardTitle>
                    {rule.description && (
                      <p className="text-sm text-muted-foreground mt-1">{rule.description}</p>
                    )}
                  </div>
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
                        onClick={() => handleDeleteClick(index)}
                        className="text-destructive"
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Conditions Section */}
                  <div className="space-y-2">
                    <h4 className="text-sm font-semibold text-muted-foreground">Conditions</h4>
                    <div className="bg-muted/50 rounded-lg p-3 space-y-2">
                      {rule.conditions.map((condition, i) => (
                        <div key={i} className="flex items-start gap-2">
                          <div className="min-w-[40px] text-xs font-medium text-muted-foreground pt-0.5">
                            {i === 0 ? "IF:" : "AND:"}
                          </div>
                          <div className="bg-background rounded border px-3 py-2 text-sm flex-1">
                            {getConditionLabel(condition)}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Effects Section */}
                  <div className="space-y-2">
                    <h4 className="text-sm font-semibold text-muted-foreground">Effects</h4>
                    <div className="bg-muted/50 rounded-lg p-3 space-y-2">
                      {rule.effects.map((effect, i) => (
                        <div key={i} className="flex items-start gap-2">
                          <div className="min-w-[40px] text-xs font-medium text-muted-foreground pt-0.5">
                            {i === 0 ? "THEN:" : "AND:"}
                          </div>
                          <div className="bg-background rounded border px-3 py-2 text-sm flex-1">
                            {getEffectLabel(effect)}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
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
                                  onValueChange={(value) => {
                                    field.onChange(value);
                                    // Reset operator when condition type changes
                                    const availableOperators = getOperatorsForConditionType(value);
                                    if (availableOperators.length > 0) {
                                      form.setValue(`conditions.${index}.operator`, availableOperators[0].value);
                                    }
                                  }}
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
                                    {getOperatorsForConditionType(form.watch(`conditions.${index}.type`)).map((op) => (
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
                          {form.watch(`conditions.${index}.type`) === "loyaltyTier" ? (
                            <FormField
                              control={form.control}
                              name={`conditions.${index}.tierId`}
                              render={({ field }) => (
                                <FormItem>
                                  <Select
                                    value={field.value || ""}
                                    onValueChange={(value) => {
                                      field.onChange(value);
                                      // Also update the value field with the tier name for backward compatibility
                                      const tier = tiers.find(t => t.id === value);
                                      if (tier) {
                                        form.setValue(`conditions.${index}.value`, tier.name);
                                      }
                                    }}
                                    disabled={tiersLoading || tiers.length === 0}
                                  >
                                    <SelectTrigger>
                                      <SelectValue placeholder="Select a tier" />
                                    </SelectTrigger>
                                    <SelectContent>
                                      {tiersLoading ? (
                                        <SelectItem value="loading" disabled>Loading tiers...</SelectItem>
                                      ) : tiers.length === 0 ? (
                                        <SelectItem value="none" disabled>No tiers available</SelectItem>
                                      ) : (
                                        tiers.map(tier => (
                                          <SelectItem key={tier.id} value={tier.id}>
                                            <div className="flex items-center">
                                              <Award className="mr-2 h-4 w-4" />
                                              {tier.name} ({tier.pointsThreshold} points)
                                            </div>
                                          </SelectItem>
                                        ))
                                      )}
                                    </SelectContent>
                                  </Select>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          ) : (
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
                          )}
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

                          {form.watch(`effects.${index}.type`) === "giveReward" && (
                            <FormField
                              control={form.control}
                              name={`effects.${index}.rewardId`}
                              render={({ field }) => (
                                <FormItem>
                                  <Select
                                    value={field.value || ""}
                                    onValueChange={(value) => {
                                      field.onChange(value);
                                      // Also update the value field with the reward name for backward compatibility
                                      const reward = rewards.find(r => r.id === value);
                                      if (reward) {
                                        form.setValue(`effects.${index}.value`, reward.name);
                                      }
                                    }}
                                    disabled={rewardsLoading || rewards.length === 0}
                                  >
                                    <SelectTrigger>
                                      <SelectValue placeholder="Select a reward" />
                                    </SelectTrigger>
                                    <SelectContent>
                                      {rewardsLoading ? (
                                        <SelectItem value="loading" disabled>Loading rewards...</SelectItem>
                                      ) : rewards.length === 0 ? (
                                        <SelectItem value="none" disabled>No rewards available</SelectItem>
                                      ) : (
                                        rewards.map(reward => (
                                          <SelectItem key={reward.id} value={reward.id}>
                                            <div className="flex items-center">
                                              <Gift className="mr-2 h-4 w-4" />
                                              {reward.name} ({reward.pointsCost} points)
                                            </div>
                                          </SelectItem>
                                        ))
                                      )}
                                    </SelectContent>
                                  </Select>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          )}

                          {form.watch(`effects.${index}.type`) === "upgradeTier" && (
                            <FormField
                              control={form.control}
                              name={`effects.${index}.tierId`}
                              render={({ field }) => (
                                <FormItem>
                                  <Select
                                    value={field.value || ""}
                                    onValueChange={(value) => {
                                      field.onChange(value);
                                      // Also update the value field with the tier name for backward compatibility
                                      const tier = tiers.find(t => t.id === value);
                                      if (tier) {
                                        form.setValue(`effects.${index}.value`, tier.name);
                                      }
                                    }}
                                    disabled={tiersLoading || tiers.length === 0}
                                  >
                                    <SelectTrigger>
                                      <SelectValue placeholder="Select a tier" />
                                    </SelectTrigger>
                                    <SelectContent>
                                      {tiersLoading ? (
                                        <SelectItem value="loading" disabled>Loading tiers...</SelectItem>
                                      ) : tiers.length === 0 ? (
                                        <SelectItem value="none" disabled>No tiers available</SelectItem>
                                      ) : (
                                        tiers.map(tier => (
                                          <SelectItem key={tier.id} value={tier.id}>
                                            <div className="flex items-center">
                                              <Award className="mr-2 h-4 w-4" />
                                              {tier.name} ({tier.pointsThreshold} points)
                                            </div>
                                          </SelectItem>
                                        ))
                                      )}
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

      <AlertDialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the rule
              and remove it from the loyalty program.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
