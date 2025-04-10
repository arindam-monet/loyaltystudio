'use client';

import { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Button,
  Alert,
  AlertDescription,
  AlertTitle,
  Input,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  Badge,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Checkbox,
  Textarea,
  Skeleton,
  useToast,
} from '@loyaltystudio/ui';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Plus, Trash2, Play, MoreHorizontal, CheckCircle, XCircle, Copy, ExternalLink, RefreshCw } from 'lucide-react';
import { useWebhooks } from '@/hooks/use-webhooks';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@loyaltystudio/ui';

// Define webhook event types
const webhookEventTypes = [
  { value: 'transaction_created', label: 'Transaction Created' },
  { value: 'points_earned', label: 'Points Earned' },
  { value: 'points_redeemed', label: 'Points Redeemed' },
  { value: 'points_adjusted', label: 'Points Adjusted' },
  { value: 'member_created', label: 'Member Created' },
  { value: 'member_updated', label: 'Member Updated' },
  { value: 'member_deleted', label: 'Member Deleted' },
  { value: 'tier_changed', label: 'Tier Changed' },
  { value: 'reward_redeemed', label: 'Reward Redeemed' },
  { value: 'reward_created', label: 'Reward Created' },
  { value: 'reward_updated', label: 'Reward Updated' },
  { value: 'reward_deleted', label: 'Reward Deleted' },
  { value: 'campaign_started', label: 'Campaign Started' },
  { value: 'campaign_ended', label: 'Campaign Ended' },
  { value: 'campaign_updated', label: 'Campaign Updated' },
];

// Define the form schema
const webhookSchema = z.object({
  url: z.string().url('Please enter a valid URL'),
  description: z.string().optional(),
  events: z.array(z.string()).min(1, 'Please select at least one event'),
});

type WebhookFormValues = z.infer<typeof webhookSchema>;

// Define the test form schema
const testWebhookSchema = z.object({
  eventType: z.string(),
  payload: z.string().optional(),
});

type TestWebhookFormValues = z.infer<typeof testWebhookSchema>;



export default function WebhooksPage() {
  const {
    webhooks,
    isLoading,
    createWebhook,
    updateWebhook,
    deleteWebhook,
    testWebhook,
    regenerateSecret,
    getWebhookLogs
  } = useWebhooks();

  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isTestDialogOpen, setIsTestDialogOpen] = useState(false);
  const [isViewSecretDialogOpen, setIsViewSecretDialogOpen] = useState(false);
  const [selectedWebhook, setSelectedWebhook] = useState<any | null>(null);
  const [deliveryLogs, setDeliveryLogs] = useState<any[]>([]);
  const [isLoadingLogs, setIsLoadingLogs] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const form = useForm<WebhookFormValues>({
    resolver: zodResolver(webhookSchema),
    defaultValues: {
      url: '',
      description: '',
      events: [],
    },
  });

  const testForm = useForm<TestWebhookFormValues>({
    resolver: zodResolver(testWebhookSchema),
    defaultValues: {
      eventType: webhookEventTypes[0].value,
      payload: JSON.stringify({ test: true }, null, 2),
    },
  });

  const onSubmit = async (data: WebhookFormValues) => {
    setIsSubmitting(true);
    try {
      await createWebhook.mutateAsync({
        url: data.url,
        events: data.events,
        description: data.description,
      });

      setIsAddDialogOpen(false);
      form.reset();

      toast({
        title: 'Webhook created',
        description: 'Your webhook has been created successfully.',
      });
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'Failed to create webhook',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteWebhook = async (id: string) => {
    try {
      await deleteWebhook.mutateAsync(id);
      toast({
        title: 'Webhook deleted',
        description: 'The webhook has been deleted successfully.',
      });
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'Failed to delete webhook',
        variant: 'destructive',
      });
    }
  };

  const handleToggleWebhook = async (id: string) => {
    const webhook = webhooks.find((w) => w.id === id);
    if (!webhook) return;

    try {
      await updateWebhook.mutateAsync({
        id,
        data: { isActive: !webhook.isActive }
      });

      toast({
        title: webhook.isActive ? 'Webhook disabled' : 'Webhook enabled',
        description: webhook.isActive
          ? 'The webhook has been disabled and will not receive events.'
          : 'The webhook has been enabled and will receive events.',
      });
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'Failed to update webhook',
        variant: 'destructive',
      });
    }
  };

  const handleViewSecret = async (webhook: any) => {
    setSelectedWebhook(webhook);
    setIsViewSecretDialogOpen(true);

    try {
      const result = await regenerateSecret.mutateAsync(webhook.id);
      // Update the selected webhook with the new secret
      setSelectedWebhook({ ...webhook, secret: result.secret });
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'Failed to get webhook secret',
        variant: 'destructive',
      });
    }
  };

  const handleCopySecret = (secret: string) => {
    if (!secret) return;

    navigator.clipboard.writeText(secret);
    toast({
      title: 'Secret copied',
      description: 'The webhook secret has been copied to your clipboard.',
    });
  };

  const handleTestWebhook = (webhook: any) => {
    setSelectedWebhook(webhook);
    setIsTestDialogOpen(true);
    setTestResult(null);
  };

  const fetchWebhookLogs = async (webhookId: string) => {
    setIsLoadingLogs(true);
    try {
      const logsQuery = getWebhookLogs(webhookId);
      const logsData = await logsQuery.refetch();
      if (logsData.data) {
        setDeliveryLogs(logsData.data.logs);
      }
    } catch (error) {
      console.error('Failed to fetch webhook logs:', error);
    } finally {
      setIsLoadingLogs(false);
    }
  };

  useEffect(() => {
    if (webhooks.length > 0) {
      // Fetch logs for the first webhook by default
      fetchWebhookLogs(webhooks[0].id);
    }
  }, [webhooks.length]);

  const onTestSubmit = async (data: TestWebhookFormValues) => {
    if (!selectedWebhook) return;

    setIsSubmitting(true);
    try {
      let payload = {};
      if (data.payload) {
        try {
          payload = JSON.parse(data.payload);
        } catch (e) {
          toast({
            title: 'Invalid JSON',
            description: 'Please provide valid JSON for the payload',
            variant: 'destructive',
          });
          return;
        }
      }

      const result = await testWebhook.mutateAsync({
        id: selectedWebhook.id,
        data: {
          eventType: data.eventType,
          payload
        }
      });

      setTestResult({
        success: result.success,
        message: result.message,
      });

      // Refresh logs after test
      await fetchWebhookLogs(selectedWebhook.id);

    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'Failed to test webhook',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Webhooks</CardTitle>
            <CardDescription>
              Manage webhook endpoints to receive real-time event notifications
            </CardDescription>
          </div>
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Create Webhook
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create Webhook</DialogTitle>
                <DialogDescription>
                  Create a new webhook endpoint to receive event notifications
                </DialogDescription>
              </DialogHeader>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  <FormField
                    control={form.control}
                    name="url"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Endpoint URL</FormLabel>
                        <FormControl>
                          <Input placeholder="https://example.com/webhooks" {...field} />
                        </FormControl>
                        <FormDescription>
                          The URL where webhook events will be sent
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Description (Optional)</FormLabel>
                        <FormControl>
                          <Textarea placeholder="Describe the purpose of this webhook" {...field} />
                        </FormControl>
                        <FormDescription>
                          A description to help you identify this webhook
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="events"
                    render={() => (
                      <FormItem>
                        <div className="mb-4">
                          <FormLabel>Events</FormLabel>
                          <FormDescription>
                            Select the events you want to receive notifications for
                          </FormDescription>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 max-h-60 overflow-y-auto border rounded-md p-2">
                          {webhookEventTypes.map((event) => (
                            <FormField
                              key={event.value}
                              control={form.control}
                              name="events"
                              render={({ field }) => {
                                return (
                                  <FormItem
                                    key={event.value}
                                    className="flex flex-row items-start space-x-3 space-y-0"
                                  >
                                    <FormControl>
                                      <Checkbox
                                        checked={field.value?.includes(event.value)}
                                        onCheckedChange={(checked) => {
                                          return checked
                                            ? field.onChange([...field.value, event.value])
                                            : field.onChange(
                                              field.value?.filter(
                                                (value) => value !== event.value
                                              )
                                            );
                                        }}
                                      />
                                    </FormControl>
                                    <FormLabel className="font-normal cursor-pointer">
                                      {event.label}
                                    </FormLabel>
                                  </FormItem>
                                );
                              }}
                            />
                          ))}
                        </div>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <DialogFooter>
                    <Button type="button" variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                      Cancel
                    </Button>
                    <Button type="submit" disabled={isSubmitting}>
                      {isSubmitting ? 'Creating...' : 'Create'}
                    </Button>
                  </DialogFooter>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>URL</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Events</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Created</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {webhooks.map((webhook) => (
                <TableRow key={webhook.id}>
                  <TableCell className="font-medium max-w-[200px] truncate">
                    {webhook.url}
                  </TableCell>
                  <TableCell className="max-w-[200px] truncate">
                    {webhook.description || '-'}
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {webhook.events.length > 2 ? (
                        <>
                          <Badge variant="outline" className="whitespace-nowrap">
                            {webhook.events[0]}
                          </Badge>
                          <Badge variant="outline" className="whitespace-nowrap">
                            {webhook.events[1]}
                          </Badge>
                          <Badge variant="outline" className="whitespace-nowrap">
                            +{webhook.events.length - 2} more
                          </Badge>
                        </>
                      ) : (
                        webhook.events.map((event) => (
                          <Badge key={event} variant="outline" className="whitespace-nowrap">
                            {event}
                          </Badge>
                        ))
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={webhook.isActive ? 'default' : 'secondary'}>
                      {webhook.isActive ? 'Active' : 'Inactive'}
                    </Badge>
                  </TableCell>
                  <TableCell>{webhook.createdAt}</TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreHorizontal className="h-4 w-4" />
                          <span className="sr-only">Open menu</span>
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Actions</DropdownMenuLabel>
                        <DropdownMenuItem onClick={() => handleTestWebhook(webhook)}>
                          <Play className="mr-2 h-4 w-4" />
                          Test
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleViewSecret(webhook)}>
                          <Copy className="mr-2 h-4 w-4" />
                          View Secret
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleToggleWebhook(webhook.id)}>
                          {webhook.isActive ? (
                            <>
                              <XCircle className="mr-2 h-4 w-4" />
                              Disable
                            </>
                          ) : (
                            <>
                              <CheckCircle className="mr-2 h-4 w-4" />
                              Enable
                            </>
                          )}
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          onClick={() => handleDeleteWebhook(webhook.id)}
                          className="text-destructive focus:text-destructive"
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
              {!isLoading && webhooks.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-6 text-muted-foreground">
                    No webhooks found. Create one to get started.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Webhook Delivery Logs</CardTitle>
            <CardDescription>
              View recent webhook delivery attempts and their status
            </CardDescription>
          </div>
          <Button variant="outline" size="sm" onClick={() => webhooks.length > 0 && fetchWebhookLogs(webhooks[0].id)}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Event Type</TableHead>
                <TableHead>Webhook URL</TableHead>
                <TableHead>Timestamp</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Response Time</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoadingLogs ? (
                <TableRow>
                  <TableCell colSpan={5}>
                    <div className="space-y-2">
                      <Skeleton className="h-4 w-full" />
                      <Skeleton className="h-4 w-full" />
                      <Skeleton className="h-4 w-full" />
                    </div>
                  </TableCell>
                </TableRow>
              ) : deliveryLogs.map((log) => {
                const webhook = webhooks.find((w) => w.id === log.webhookId);
                return (
                  <TableRow key={log.id}>
                    <TableCell>
                      <Badge variant="outline">{log.eventType}</Badge>
                    </TableCell>
                    <TableCell className="max-w-[200px] truncate">
                      {webhook?.url || 'Unknown'}
                    </TableCell>
                    <TableCell>
                      {new Date(log.createdAt).toLocaleString()}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center">
                        {log.successful ? (
                          <>
                            <CheckCircle className="h-4 w-4 text-green-500 mr-1" />
                            <span>{log.statusCode}</span>
                          </>
                        ) : (
                          <>
                            <XCircle className="h-4 w-4 text-red-500 mr-1" />
                            <span>{log.statusCode}</span>
                          </>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>{log.responseTime || '-'}ms</TableCell>
                  </TableRow>
                );
              })}
              {!isLoadingLogs && deliveryLogs.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-6 text-muted-foreground">
                    No delivery logs found.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* View Secret Dialog */}
      <Dialog open={isViewSecretDialogOpen} onOpenChange={setIsViewSecretDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Webhook Secret</DialogTitle>
            <DialogDescription>
              Use this secret to verify webhook signatures
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="rounded-md bg-muted p-4 font-mono text-sm break-all">
              {selectedWebhook?.secret}
            </div>
            <Alert>
              <AlertTitle>Important</AlertTitle>
              <AlertDescription>
                Keep this secret secure. Anyone with this secret can forge webhook signatures.
              </AlertDescription>
            </Alert>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => handleCopySecret(selectedWebhook?.secret || '')}>
              <Copy className="mr-2 h-4 w-4" />
              Copy
            </Button>
            <Button onClick={() => setIsViewSecretDialogOpen(false)}>Done</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Test Webhook Dialog */}
      <Dialog open={isTestDialogOpen} onOpenChange={setIsTestDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Test Webhook</DialogTitle>
            <DialogDescription>
              Send a test event to your webhook endpoint
            </DialogDescription>
          </DialogHeader>
          <Form {...testForm}>
            <form onSubmit={testForm.handleSubmit(onTestSubmit)} className="space-y-4">
              <FormField
                control={testForm.control}
                name="eventType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Event Type</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select event type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {webhookEventTypes.map((event) => (
                          <SelectItem key={event.value} value={event.value}>
                            {event.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormDescription>
                      The type of event to send
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={testForm.control}
                name="payload"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Payload (Optional)</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Enter JSON payload"
                        className="font-mono h-32"
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>
                      Custom JSON payload to send with the event
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              {testResult && (
                <Alert variant={testResult.success ? 'default' : 'destructive'}>
                  {testResult.success ? (
                    <CheckCircle className="h-4 w-4" />
                  ) : (
                    <XCircle className="h-4 w-4" />
                  )}
                  <AlertTitle>{testResult.success ? 'Success' : 'Error'}</AlertTitle>
                  <AlertDescription>{testResult.message}</AlertDescription>
                </Alert>
              )}
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsTestDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? 'Testing...' : 'Send Test Event'}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      <Card>
        <CardHeader>
          <CardTitle>Webhook Documentation</CardTitle>
          <CardDescription>
            Learn how to use webhooks to receive real-time event notifications
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="rounded-lg border p-4 space-y-2">
              <h3 className="font-semibold">Getting Started</h3>
              <p className="text-sm text-muted-foreground">
                Learn how to set up and verify webhook signatures
              </p>
              <Button variant="outline" className="w-full mt-2" asChild>
                <a href="/developer/docs#webhooks" target="_blank" rel="noopener noreferrer">
                  <ExternalLink className="mr-2 h-4 w-4" />
                  View Guide
                </a>
              </Button>
            </div>
            <div className="rounded-lg border p-4 space-y-2">
              <h3 className="font-semibold">Event Types</h3>
              <p className="text-sm text-muted-foreground">
                Detailed documentation for all webhook event types
              </p>
              <Button variant="outline" className="w-full mt-2" asChild>
                <a href="/developer/docs#webhook-events" target="_blank" rel="noopener noreferrer">
                  <ExternalLink className="mr-2 h-4 w-4" />
                  View Events
                </a>
              </Button>
            </div>
            <div className="rounded-lg border p-4 space-y-2">
              <h3 className="font-semibold">Test Webhooks</h3>
              <p className="text-sm text-muted-foreground">
                Use our testing tool to verify your webhook integrations
              </p>
              <Button variant="outline" className="w-full mt-2" asChild>
                <a href="/developer/webhooks/test">
                  <Play className="mr-2 h-4 w-4" />
                  Test Webhooks
                </a>
              </Button>
            </div>
          </div>

          <div className="rounded-lg border p-4 space-y-4">
            <h3 className="font-semibold">Verifying Webhook Signatures</h3>
            <div className="space-y-2">
              <p className="text-sm">
                To verify that a webhook request came from Loyalty Studio, you should validate the signature:
              </p>
              <div className="bg-muted rounded-md p-3 font-mono text-xs overflow-x-auto">
                <pre>{`
// Node.js example
const crypto = require('crypto');

function verifyWebhookSignature(payload, signature, secret) {
  const hmac = crypto.createHmac('sha256', secret);
  const digest = hmac.update(JSON.stringify(payload)).digest('hex');
  return crypto.timingSafeEqual(
    Buffer.from(digest),
    Buffer.from(signature)
  );
}
                `.trim()}</pre>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
