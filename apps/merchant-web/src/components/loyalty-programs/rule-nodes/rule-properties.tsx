import { useCallback } from 'react';
import { Node } from 'reactflow';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
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
  Switch,
  Textarea,
} from '@loyaltystudio/ui';

const basePropertiesSchema = z.object({
  label: z.string().min(1, 'Label is required'),
  description: z.string().optional(),
  isActive: z.boolean().default(true),
});

const basePointsSchema = basePropertiesSchema.extend({
  points: z.number().min(0, 'Points must be non-negative'),
  minAmount: z.number().min(0, 'Minimum amount must be non-negative'),
});

const categoryMultiplierSchema = basePropertiesSchema.extend({
  multiplier: z.number().min(1, 'Multiplier must be at least 1'),
  category: z.string().min(1, 'Category is required'),
});

const minimumPurchaseSchema = basePropertiesSchema.extend({
  minAmount: z.number().min(0, 'Minimum amount must be non-negative'),
});

const maximumPointsSchema = basePropertiesSchema.extend({
  maxPoints: z.number().min(0, 'Maximum points must be non-negative'),
});

const CATEGORIES = [
  'Food & Beverage',
  'Retail',
  'Electronics',
  'Fashion',
  'Health & Beauty',
  'Travel',
  'Entertainment',
  'Other',
];

interface RulePropertiesProps {
  selectedNode: Node | null;
  onNodeChange: (nodeId: string, data: any) => void;
}

export function RuleProperties({ selectedNode, onNodeChange }: RulePropertiesProps) {
  const getSchemaForNodeType = useCallback((type: string) => {
    switch (type) {
      case 'basePoints':
        return basePointsSchema;
      case 'categoryMultiplier':
        return categoryMultiplierSchema;
      case 'minimumPurchase':
        return minimumPurchaseSchema;
      case 'maximumPoints':
        return maximumPointsSchema;
      default:
        return basePropertiesSchema;
    }
  }, []);

  const form = useForm({
    resolver: zodResolver(
      selectedNode ? getSchemaForNodeType(selectedNode.type ?? 'default') : basePropertiesSchema
    ),
    defaultValues: selectedNode?.data || {},
  });

  const onSubmit = useCallback(
    (values: any) => {
      if (selectedNode) {
        onNodeChange(selectedNode.id, values);
      }
    },
    [selectedNode, onNodeChange]
  );

  if (!selectedNode) {
    return (
      <Card>
        <CardContent className="p-6">
          <p className="text-sm text-muted-foreground">
            Select a node to view and edit its properties
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Node Properties</CardTitle>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onChange={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="label"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Label</FormLabel>
                  <FormControl>
                    <Input {...field} />
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
                    <Textarea {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {selectedNode.type === 'basePoints' && (
              <>
                <FormField
                  control={form.control}
                  name="points"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Points per unit</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          {...field}
                          onChange={(e) =>
                            field.onChange(parseFloat(e.target.value))
                          }
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="minAmount"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Minimum Amount</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          {...field}
                          onChange={(e) =>
                            field.onChange(parseFloat(e.target.value))
                          }
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </>
            )}

            {selectedNode.type === 'categoryMultiplier' && (
              <>
                <FormField
                  control={form.control}
                  name="multiplier"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Points Multiplier</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          {...field}
                          onChange={(e) =>
                            field.onChange(parseFloat(e.target.value))
                          }
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="category"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Category</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select a category" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {CATEGORIES.map((category) => (
                            <SelectItem key={category} value={category}>
                              {category}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </>
            )}

            {selectedNode.type === 'minimumPurchase' && (
              <FormField
                control={form.control}
                name="minAmount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Minimum Purchase Amount</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        {...field}
                        onChange={(e) =>
                          field.onChange(parseFloat(e.target.value))
                        }
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            {selectedNode.type === 'maximumPoints' && (
              <FormField
                control={form.control}
                name="maxPoints"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Maximum Points</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        {...field}
                        onChange={(e) =>
                          field.onChange(parseFloat(e.target.value))
                        }
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            <FormField
              control={form.control}
              name="isActive"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                  <div className="space-y-0.5">
                    <FormLabel>Active</FormLabel>
                    <FormDescription>
                      Enable or disable this rule node
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
          </form>
        </Form>
      </CardContent>
    </Card>
  );
} 