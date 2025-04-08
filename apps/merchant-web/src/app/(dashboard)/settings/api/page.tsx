'use client';

// Note: This is a placeholder implementation with mock data.
// In a real application, this would be connected to the API.

import { useState } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
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
} from '@loyaltystudio/ui';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { AlertCircle, Copy, Eye, EyeOff, Key, Plus, RefreshCw, Trash2 } from 'lucide-react';
import { useToast } from '@loyaltystudio/ui';

// Define the form schema
const apiKeySchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  permissions: z.enum(['read', 'write', 'admin']),
  expiresIn: z.enum(['30', '60', '90', 'never']),
});

type ApiKeyFormValues = z.infer<typeof apiKeySchema>;

// Mock data for API keys
const mockApiKeys = [
  { id: '1', name: 'Production API Key', key: 'ls_prod_1234567890abcdef', created: '2023-01-15', expires: 'Never', permissions: 'admin', lastUsed: '2023-04-01' },
  { id: '2', name: 'Test API Key', key: 'ls_test_abcdef1234567890', created: '2023-02-20', expires: '2023-05-20', permissions: 'read', lastUsed: '2023-03-15' },
];

export default function ApiSettingsPage() {
  const [apiKeys, setApiKeys] = useState(mockApiKeys);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [newApiKey, setNewApiKey] = useState<string | null>(null);
  const [showKeys, setShowKeys] = useState<Record<string, boolean>>({});
  const { toast } = useToast();

  const form = useForm<ApiKeyFormValues>({
    resolver: zodResolver(apiKeySchema),
    defaultValues: {
      name: '',
      permissions: 'read',
      expiresIn: '30',
    },
  });

  const handleCreateApiKey = (data: ApiKeyFormValues) => {
    // Generate a mock API key
    const newKey = `ls_${data.permissions.substring(0, 4)}_${Math.random().toString(36).substring(2, 15)}`;

    // Calculate expiry date
    let expiryDate = 'Never';
    if (data.expiresIn !== 'never') {
      const date = new Date();
      date.setDate(date.getDate() + parseInt(data.expiresIn));
      expiryDate = date.toISOString().split('T')[0];
    }

    const newApiKeyObj = {
      id: Date.now().toString(),
      name: data.name,
      key: newKey,
      created: new Date().toISOString().split('T')[0],
      expires: expiryDate,
      permissions: data.permissions,
      lastUsed: 'Never',
    };

    setApiKeys([...apiKeys, newApiKeyObj]);
    setNewApiKey(newKey);
    form.reset();
  };

  const handleDeleteApiKey = (id: string) => {
    setApiKeys(apiKeys.filter(key => key.id !== id));
    toast({
      title: 'API Key Deleted',
      description: 'The API key has been permanently deleted.',
    });
  };

  const toggleShowKey = (id: string) => {
    setShowKeys(prev => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: 'Copied to clipboard',
      description: 'API key has been copied to your clipboard.',
    });
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>API Keys</CardTitle>
            <CardDescription>
              Manage API keys to authenticate your applications
            </CardDescription>
          </div>
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Create API Key
              </Button>
            </DialogTrigger>
            <DialogContent>
              {newApiKey ? (
                <>
                  <DialogHeader>
                    <DialogTitle>Your New API Key</DialogTitle>
                    <DialogDescription>
                      This key will only be displayed once. Please copy it now and store it securely.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <div className="rounded-md bg-muted p-4 font-mono text-sm break-all">
                      {newApiKey}
                    </div>
                    <Alert variant="warning">
                      <AlertCircle className="h-4 w-4" />
                      <AlertTitle>Important</AlertTitle>
                      <AlertDescription>
                        This API key will not be shown again. If you lose it, you'll need to generate a new one.
                      </AlertDescription>
                    </Alert>
                  </div>
                  <DialogFooter>
                    <Button onClick={() => copyToClipboard(newApiKey)} className="mr-2">
                      <Copy className="mr-2 h-4 w-4" />
                      Copy to Clipboard
                    </Button>
                    <Button variant="outline" onClick={() => {
                      setNewApiKey(null);
                      setIsAddDialogOpen(false);
                    }}>
                      Done
                    </Button>
                  </DialogFooter>
                </>
              ) : (
                <>
                  <DialogHeader>
                    <DialogTitle>Create API Key</DialogTitle>
                    <DialogDescription>
                      Create a new API key to authenticate your applications
                    </DialogDescription>
                  </DialogHeader>
                  <Form {...form}>
                    <form onSubmit={form.handleSubmit(handleCreateApiKey)} className="space-y-4">
                      <FormField
                        control={form.control}
                        name="name"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Key Name</FormLabel>
                            <FormControl>
                              <Input placeholder="Production API Key" {...field} />
                            </FormControl>
                            <FormDescription>
                              A descriptive name to identify this API key
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="permissions"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Permissions</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select permissions" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="read">Read Only</SelectItem>
                                <SelectItem value="write">Read & Write</SelectItem>
                                <SelectItem value="admin">Admin (Full Access)</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormDescription>
                              This determines what actions can be performed with this API key
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="expiresIn"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Expiration</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select expiration" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="30">30 days</SelectItem>
                                <SelectItem value="60">60 days</SelectItem>
                                <SelectItem value="90">90 days</SelectItem>
                                <SelectItem value="never">Never expires</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormDescription>
                              When this API key should expire
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <DialogFooter>
                        <Button type="button" variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                          Cancel
                        </Button>
                        <Button type="submit">Create API Key</Button>
                      </DialogFooter>
                    </form>
                  </Form>
                </>
              )}
            </DialogContent>
          </Dialog>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>API Key</TableHead>
                <TableHead>Permissions</TableHead>
                <TableHead>Created</TableHead>
                <TableHead>Expires</TableHead>
                <TableHead>Last Used</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {apiKeys.map((apiKey) => (
                <TableRow key={apiKey.id}>
                  <TableCell className="font-medium">{apiKey.name}</TableCell>
                  <TableCell>
                    <div className="flex items-center space-x-2">
                      <code className="rounded bg-muted px-1 py-0.5 font-mono text-sm">
                        {showKeys[apiKey.id] ? apiKey.key : `${apiKey.key.substring(0, 8)}...`}
                      </code>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => toggleShowKey(apiKey.id)}
                      >
                        {showKeys[apiKey.id] ? (
                          <EyeOff className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => copyToClipboard(apiKey.key)}
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={
                      apiKey.permissions === 'admin'
                        ? 'default'
                        : apiKey.permissions === 'write'
                          ? 'secondary'
                          : 'outline'
                    }>
                      {apiKey.permissions.charAt(0).toUpperCase() + apiKey.permissions.slice(1)}
                    </Badge>
                  </TableCell>
                  <TableCell>{apiKey.created}</TableCell>
                  <TableCell>{apiKey.expires}</TableCell>
                  <TableCell>{apiKey.lastUsed}</TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDeleteApiKey(apiKey.id)}
                      className="text-destructive hover:bg-destructive/10"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>API Documentation</CardTitle>
          <CardDescription>
            Resources to help you integrate with our API
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="rounded-lg border p-4 space-y-2">
              <h3 className="font-semibold">API Reference</h3>
              <p className="text-sm text-muted-foreground">
                Comprehensive documentation for all API endpoints
              </p>
              <Button variant="outline" className="w-full mt-2">
                View Documentation
              </Button>
            </div>
            <div className="rounded-lg border p-4 space-y-2">
              <h3 className="font-semibold">SDK & Libraries</h3>
              <p className="text-sm text-muted-foreground">
                Client libraries for popular programming languages
              </p>
              <Button variant="outline" className="w-full mt-2">
                View SDKs
              </Button>
            </div>
          </div>

          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Rate Limits</AlertTitle>
            <AlertDescription>
              API requests are limited to 100 requests per minute per API key. Contact support if you need higher limits.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    </div>
  );
}
