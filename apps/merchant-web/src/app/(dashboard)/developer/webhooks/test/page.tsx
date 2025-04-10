'use client';

import { useState } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Button,
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
  Textarea,
  useToast,
  Alert,
  AlertTitle,
  AlertDescription,
  Skeleton,
} from '@loyaltystudio/ui';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { CheckCircle, XCircle, AlertTriangle } from 'lucide-react';
import { useWebhooks } from '@/hooks/use-webhooks';

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

// Define the test form schema
const testWebhookSchema = z.object({
  webhookId: z.string().min(1, 'Please select a webhook'),
  eventType: z.string().min(1, 'Please select an event type'),
  payload: z.string().optional(),
});

type TestWebhookFormValues = z.infer<typeof testWebhookSchema>;

export default function WebhookTestPage() {
  const { webhooks, isLoading, testWebhook } = useWebhooks();
  const [testResult, setTestResult] = useState<{ success: boolean; statusCode: number; message: string } | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const form = useForm<TestWebhookFormValues>({
    resolver: zodResolver(testWebhookSchema),
    defaultValues: {
      webhookId: '',
      eventType: '',
      payload: JSON.stringify({
        test: true,
        timestamp: new Date().toISOString(),
      }, null, 2),
    },
  });

  const onSubmit = async (data: TestWebhookFormValues) => {
    setIsSubmitting(true);
    setTestResult(null);
    
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
          setIsSubmitting(false);
          return;
        }
      }
      
      const result = await testWebhook.mutateAsync({
        id: data.webhookId,
        data: {
          eventType: data.eventType,
          payload
        }
      });
      
      setTestResult(result);
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

  const getWebhookLabel = (id: string) => {
    const webhook = webhooks.find(w => w.id === id);
    return webhook ? `${webhook.url} (${webhook.isActive ? 'Active' : 'Inactive'})` : id;
  };

  return (
    <div className="container mx-auto py-6">
      <h1 className="text-3xl font-bold mb-6">Webhook Testing Tool</h1>
      <p className="text-muted-foreground mb-6">
        Use this tool to test your webhook integrations by sending test events to your endpoints.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Test Webhook</CardTitle>
            <CardDescription>
              Send a test event to one of your webhook endpoints
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-4">
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-32 w-full" />
                <Skeleton className="h-10 w-32" />
              </div>
            ) : webhooks.length === 0 ? (
              <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertTitle>No webhooks found</AlertTitle>
                <AlertDescription>
                  You need to create a webhook before you can test it.
                  <div className="mt-2">
                    <Button variant="outline" onClick={() => window.location.href = '/developer/webhooks'}>
                      Go to Webhooks
                    </Button>
                  </div>
                </AlertDescription>
              </Alert>
            ) : (
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                  <FormField
                    control={form.control}
                    name="webhookId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Webhook Endpoint</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select a webhook endpoint" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {webhooks.map((webhook) => (
                              <SelectItem key={webhook.id} value={webhook.id}>
                                {webhook.url} {!webhook.isActive && "(Inactive)"}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormDescription>
                          Choose the webhook endpoint you want to test
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
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
                              <SelectValue placeholder="Select an event type" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {webhookEventTypes.map((type) => (
                              <SelectItem key={type.value} value={type.value}>
                                {type.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormDescription>
                          Choose the type of event to send
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="payload"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Payload (JSON)</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Enter JSON payload"
                            className="font-mono h-32"
                            {...field}
                          />
                        </FormControl>
                        <FormDescription>
                          Customize the payload to send with the webhook (must be valid JSON)
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <Button type="submit" disabled={isSubmitting}>
                    {isSubmitting ? 'Testing...' : 'Send Test Event'}
                  </Button>
                </form>
              </Form>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Test Results</CardTitle>
            <CardDescription>
              View the results of your webhook test
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isSubmitting ? (
              <div className="flex flex-col items-center justify-center h-64">
                <Skeleton className="h-16 w-16 rounded-full" />
                <Skeleton className="h-6 w-32 mt-4" />
                <Skeleton className="h-4 w-48 mt-2" />
              </div>
            ) : testResult ? (
              <div className="flex flex-col items-center justify-center h-64">
                {testResult.success ? (
                  <CheckCircle className="h-16 w-16 text-green-500" />
                ) : (
                  <XCircle className="h-16 w-16 text-red-500" />
                )}
                <h3 className="text-xl font-semibold mt-4">
                  {testResult.success ? 'Success' : 'Failed'}
                </h3>
                <p className="text-muted-foreground mt-2">
                  Status Code: {testResult.statusCode}
                </p>
                <p className="text-center mt-4">{testResult.message}</p>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-64 text-muted-foreground">
                <p>No test results yet</p>
                <p className="text-sm mt-2">Send a test event to see results here</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Webhook Testing Guide</CardTitle>
          <CardDescription>
            Learn how to properly test and implement webhooks
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <h3 className="text-lg font-semibold">How to Test Webhooks</h3>
              <p className="text-muted-foreground">
                Testing webhooks allows you to verify that your integration is working correctly before relying on it in production.
              </p>
            </div>

            <div>
              <h3 className="text-lg font-semibold">Webhook Signature Verification</h3>
              <p className="text-muted-foreground">
                All webhooks are signed with a secret key. You should verify the signature to ensure the webhook is authentic.
                The signature is sent in the <code>X-Webhook-Signature</code> header.
              </p>
              <pre className="bg-muted p-4 rounded-md mt-2 overflow-x-auto">
                <code>
                  {`// Node.js example
const crypto = require('crypto');

function verifyWebhookSignature(payload, signature, secret) {
  const hmac = crypto.createHmac('sha256', secret);
  const digest = hmac.update(JSON.stringify(payload)).digest('hex');
  return crypto.timingSafeEqual(
    Buffer.from(digest),
    Buffer.from(signature)
  );
}`}
                </code>
              </pre>
            </div>

            <div>
              <h3 className="text-lg font-semibold">Webhook Payload Structure</h3>
              <p className="text-muted-foreground">
                All webhook payloads follow this structure:
              </p>
              <pre className="bg-muted p-4 rounded-md mt-2 overflow-x-auto">
                <code>
                  {`{
  "event": "event_type",
  "timestamp": "2023-06-01T12:34:56Z",
  "data": {
    // Event-specific data
  }
}`}
                </code>
              </pre>
            </div>

            <div>
              <h3 className="text-lg font-semibold">Best Practices</h3>
              <ul className="list-disc pl-6 text-muted-foreground">
                <li>Respond quickly to webhooks (within 5 seconds) to avoid timeouts</li>
                <li>Implement idempotency to handle duplicate webhook deliveries</li>
                <li>Store webhook events in your database before processing them</li>
                <li>Implement proper error handling for webhook processing</li>
                <li>Use a tool like ngrok for local development testing</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
