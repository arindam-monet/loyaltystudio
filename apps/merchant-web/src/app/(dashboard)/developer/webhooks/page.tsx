'use client';

import { useState } from 'react';
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

  useToast,
} from '@loyaltystudio/ui';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Plus, Trash2, Play, MoreHorizontal, CheckCircle, XCircle, Copy, ExternalLink } from 'lucide-react';
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

// Mock data for webhooks
const mockWebhooks = [
  {
    id: '1',
    url: 'https://example.com/webhooks/loyalty',
    description: 'Main webhook endpoint for loyalty events',
    events: ['transaction_created', 'points_earned', 'points_redeemed'],
    isActive: true,
    secret: 'whsec_1234567890abcdef',
    createdAt: '2023-01-15',
  },
  {
    id: '2',
    url: 'https://example.com/webhooks/members',
    description: 'Member management webhook',
    events: ['member_created', 'member_updated', 'member_deleted'],
    isActive: true,
    secret: 'whsec_abcdef1234567890',
    createdAt: '2023-02-20',
  },
];

// Mock data for webhook delivery logs
const mockDeliveryLogs = [
  {
    id: '1',
    webhookId: '1',
    eventType: 'transaction_created',
    timestamp: '2023-04-01T12:30:45Z',
    statusCode: 200,
    successful: true,
    responseTime: 245,
  },
  {
    id: '2',
    webhookId: '1',
    eventType: 'points_earned',
    timestamp: '2023-04-01T14:15:22Z',
    statusCode: 200,
    successful: true,
    responseTime: 189,
  },
  {
    id: '3',
    webhookId: '1',
    eventType: 'transaction_created',
    timestamp: '2023-04-02T09:45:12Z',
    statusCode: 500,
    successful: false,
    responseTime: 1245,
  },
  {
    id: '4',
    webhookId: '2',
    eventType: 'member_created',
    timestamp: '2023-04-02T10:22:33Z',
    statusCode: 200,
    successful: true,
    responseTime: 156,
  },
];

export default function WebhooksPage() {
  const [webhooks, setWebhooks] = useState(mockWebhooks);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isTestDialogOpen, setIsTestDialogOpen] = useState(false);
  const [isViewSecretDialogOpen, setIsViewSecretDialogOpen] = useState(false);
  const [selectedWebhook, setSelectedWebhook] = useState<typeof mockWebhooks[0] | null>(null);
  const [deliveryLogs, setDeliveryLogs] = useState(mockDeliveryLogs);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);
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

  const onSubmit = (data: WebhookFormValues) => {
    // In a real app, this would call an API to create a new webhook
    const newWebhook = {
      id: Date.now().toString(),
      url: data.url,
      description: data.description || '',
      events: data.events,
      isActive: true,
      secret: `whsec_${Math.random().toString(36).substring(2, 15)}`,
      createdAt: new Date().toISOString().split('T')[0],
    };

    setWebhooks([...webhooks, newWebhook]);
    setIsAddDialogOpen(false);
    form.reset();

    toast({
      title: 'Webhook created',
      description: 'Your webhook has been created successfully.',
    });
  };

  const handleDeleteWebhook = (id: string) => {
    setWebhooks(webhooks.filter((webhook) => webhook.id !== id));
    toast({
      title: 'Webhook deleted',
      description: 'The webhook has been deleted successfully.',
    });
  };

  const handleToggleWebhook = (id: string) => {
    setWebhooks(
      webhooks.map((webhook) =>
        webhook.id === id
          ? { ...webhook, isActive: !webhook.isActive }
          : webhook
      )
    );

    const webhook = webhooks.find((w) => w.id === id);
    toast({
      title: webhook?.isActive ? 'Webhook disabled' : 'Webhook enabled',
      description: webhook?.isActive
        ? 'The webhook has been disabled and will not receive events.'
        : 'The webhook has been enabled and will receive events.',
    });
  };

  const handleViewSecret = (webhook: typeof mockWebhooks[0]) => {
    setSelectedWebhook(webhook);
    setIsViewSecretDialogOpen(true);
  };

  const handleCopySecret = (secret: string) => {
    navigator.clipboard.writeText(secret);
    toast({
      title: 'Secret copied',
      description: 'The webhook secret has been copied to your clipboard.',
    });
  };

  const handleTestWebhook = (webhook: typeof mockWebhooks[0]) => {
    setSelectedWebhook(webhook);
    setIsTestDialogOpen(true);
    setTestResult(null);
  };

  const onTestSubmit = (data: TestWebhookFormValues) => {
    // In a real app, this would call an API to test the webhook
    // For now, we'll simulate a response
    setTimeout(() => {
      const success = Math.random() > 0.3; // 70% success rate for demo
      setTestResult({
        success,
        message: success
          ? 'Webhook test delivered successfully'
          : 'Failed to deliver webhook test',
      });

      if (success) {
        // Add a new delivery log
        const newLog = {
          id: Date.now().toString(),
          webhookId: selectedWebhook!.id,
          eventType: data.eventType,
          timestamp: new Date().toISOString(),
          statusCode: 200,
          successful: true,
          responseTime: Math.floor(Math.random() * 500) + 100,
        };
        setDeliveryLogs([newLog, ...deliveryLogs]);
      } else {
        // Add a failed delivery log
        const newLog = {
          id: Date.now().toString(),
          webhookId: selectedWebhook!.id,
          eventType: data.eventType,
          timestamp: new Date().toISOString(),
          statusCode: 500,
          successful: false,
          responseTime: Math.floor(Math.random() * 1000) + 500,
        };
        setDeliveryLogs([newLog, ...deliveryLogs]);
      }
    }, 1500);
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
                    <Button type="submit">Create</Button>
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
              {webhooks.length === 0 && (
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
        <CardHeader>
          <CardTitle>Webhook Delivery Logs</CardTitle>
          <CardDescription>
            View recent webhook delivery attempts and their status
          </CardDescription>
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
              {deliveryLogs.map((log) => {
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
                      {new Date(log.timestamp).toLocaleString()}
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
                    <TableCell>{log.responseTime}ms</TableCell>
                  </TableRow>
                );
              })}
              {deliveryLogs.length === 0 && (
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
                <Button type="submit">Send Test Event</Button>
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
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
