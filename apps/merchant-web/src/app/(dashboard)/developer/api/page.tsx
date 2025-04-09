'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useMerchantStore } from '@/lib/stores/merchant-store';
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
  useToast
} from '@loyaltystudio/ui';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Copy, Eye, EyeOff, Plus, RefreshCw, Trash2, AlertCircle } from 'lucide-react';
import { useApiKeys, CreateApiKeyRequest } from '@/hooks/use-api-keys';

// Define API key permission types
type ApiKeyPermission = 'read' | 'write' | 'admin';

// We'll add permissions and formatted dates to the API keys

// Define the form schema
const apiKeySchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  type: z.enum(['test', 'production']),
  permissions: z.enum(['read', 'write', 'admin']),
  expiresIn: z.enum(['30', '60', '90', 'never']),
});

export default function ApiKeysPage() {
  const {
    testApiKeys,
    productionApiKeys,
    refetchApiKeys,
    refetchApiKeyStats,
    createApiKey,
    revokeApiKey
  } = useApiKeys();

  const [activeTab, setActiveTab] = useState<'test' | 'production'>('test');
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [newApiKey, setNewApiKey] = useState<string | null>(null);
  const [showKeys, setShowKeys] = useState<Record<string, boolean>>({});
  const { toast } = useToast();

  // Format dates for display
  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'Never';
    return new Date(dateString).toLocaleDateString();
  };

  // We'll use real API stats when available

  // Use a more specific type for the form
  const form = useForm<{
    name: string;
    type: 'test' | 'production';
    permissions: 'read' | 'write' | 'admin';
    expiresIn: '30' | '60' | '90' | 'never';
  }>({
    resolver: zodResolver(apiKeySchema) as any, // Cast to any to avoid TypeScript errors
    defaultValues: {
      name: '',
      type: 'test',
      permissions: 'read',
      expiresIn: '30',
    },
  });

  // Get the selected merchant from the store
  const { selectedMerchant } = useMerchantStore();

  const onSubmit = async (data: any) => {
    try {
      if (!selectedMerchant) {
        toast({
          title: 'Error',
          description: 'No merchant selected. Please select a merchant first.',
          variant: 'destructive',
        });
        return;
      }

      const expiresIn = data.expiresIn === 'never' ? undefined : parseInt(data.expiresIn);
      const request: CreateApiKeyRequest = {
        name: data.name,
        environment: data.type, // Use the type field as environment
        merchantId: selectedMerchant.id, // Include the merchant ID
        expiresIn
      };

      const response = await createApiKey.mutateAsync(request);
      setNewApiKey(response.key);
      form.reset();

      toast({
        title: 'API key created',
        description: 'Your new API key has been created successfully.',
      });
    } catch (error) {
      console.error('Failed to create API key:', error);
      toast({
        title: 'Error',
        description: 'Failed to create API key. Please try again.',
        variant: 'destructive',
      });
    }
  };

  const handleCopyKey = (key: string) => {
    navigator.clipboard.writeText(key);
    toast({
      title: 'API key copied',
      description: 'The API key has been copied to your clipboard.',
    });
  };

  const toggleShowKey = (id: string) => {
    setShowKeys((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  const handleDeleteKey = async (key: string) => {
    try {
      await revokeApiKey.mutateAsync(key);
      toast({
        title: 'API key revoked',
        description: 'The API key has been revoked and can no longer be used.',
      });
    } catch (error) {
      console.error('Failed to revoke API key:', error);
      toast({
        title: 'Error',
        description: 'Failed to revoke API key. Please try again.',
        variant: 'destructive',
      });
    }
  };

  const closeDialog = () => {
    setIsAddDialogOpen(false);
    setNewApiKey(null);
  };

  // Removed unused formatDate function

  const handleRefreshStats = () => {
    refetchApiKeyStats();
    refetchApiKeys();
  };

  return (
    <div className="space-y-6">
      <div>
        {activeTab === 'test' ? (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">Test API Keys</h3>
              <div className="flex space-x-2">
                <Button variant="outline" onClick={() => setActiveTab('production')}>View Production Keys</Button>
              </div>
            </div>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Test API Keys</CardTitle>
                  <CardDescription>
                    Manage test API keys for development and testing
                  </CardDescription>
                </div>
                <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
                  <DialogTrigger asChild>
                    <Button>
                      <Plus className="mr-2 h-4 w-4" />
                      Create API Key
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-2xl">
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
                          <Alert variant="destructive">
                            <AlertCircle className="h-4 w-4" />
                            <AlertTitle>Important</AlertTitle>
                            <AlertDescription>
                              This API key will not be shown again. If you lose it, you'll need to create a new one.
                            </AlertDescription>
                          </Alert>
                        </div>
                        <DialogFooter>
                          <Button variant="outline" onClick={() => handleCopyKey(newApiKey)}>
                            <Copy className="mr-2 h-4 w-4" />
                            Copy
                          </Button>
                          <Button onClick={closeDialog}>Done</Button>
                        </DialogFooter>
                      </>
                    ) : (
                      <>
                        <DialogHeader>
                          <DialogTitle>Create API Key</DialogTitle>
                          <DialogDescription>
                            Create a new API key for your applications
                          </DialogDescription>
                        </DialogHeader>
                        <Form {...form}>
                          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                            <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-6">
                              <FormField
                                control={form.control}
                                name="name"
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel>Name</FormLabel>
                                    <FormControl>
                                      <Input placeholder="My API Key" {...field} />
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
                                name="type"
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel>Type</FormLabel>
                                    <Select
                                      onValueChange={field.onChange}
                                      defaultValue={field.value}
                                    >
                                      <FormControl>
                                        <SelectTrigger>
                                          <SelectValue placeholder="Select type" />
                                        </SelectTrigger>
                                      </FormControl>
                                      <SelectContent>
                                        <SelectItem value="test">Test</SelectItem>
                                        <SelectItem value="production">Production</SelectItem>
                                      </SelectContent>
                                    </Select>
                                    <FormDescription>
                                      Test keys are for development, production keys for live environments
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
                                    <Select
                                      onValueChange={field.onChange}
                                      defaultValue={field.value}
                                    >
                                      <FormControl>
                                        <SelectTrigger>
                                          <SelectValue placeholder="Select permissions" />
                                        </SelectTrigger>
                                      </FormControl>
                                      <SelectContent>
                                        <SelectItem value="read">Read Only</SelectItem>
                                        <SelectItem value="write">Read & Write</SelectItem>
                                        <SelectItem value="admin">Admin</SelectItem>
                                      </SelectContent>
                                    </Select>
                                    <FormDescription>
                                      Control what actions this API key can perform
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
                                    <Select
                                      onValueChange={field.onChange}
                                      defaultValue={field.value}
                                    >
                                      <FormControl>
                                        <SelectTrigger>
                                          <SelectValue placeholder="Select expiration" />
                                        </SelectTrigger>
                                      </FormControl>
                                      <SelectContent>
                                        <SelectItem value="30">30 days</SelectItem>
                                        <SelectItem value="60">60 days</SelectItem>
                                        <SelectItem value="90">90 days</SelectItem>
                                        <SelectItem value="never">Never</SelectItem>
                                      </SelectContent>
                                    </Select>
                                    <FormDescription>
                                      When this API key should expire
                                    </FormDescription>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                            </div>
                            <DialogFooter className="mt-4 pt-4 border-t">
                              <Button type="button" variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                                Cancel
                              </Button>
                              <Button type="submit">Create</Button>
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
                    {testApiKeys.map((apiKey: any) => (
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
                              <span className="sr-only">
                                {showKeys[apiKey.id] ? 'Hide' : 'Show'}
                              </span>
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleCopyKey(apiKey.key)}
                            >
                              <Copy className="h-4 w-4" />
                              <span className="sr-only">Copy</span>
                            </Button>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={'outline'}
                          >
                            read
                          </Badge>
                        </TableCell>
                        <TableCell>{formatDate(apiKey.createdAt)}</TableCell>
                        <TableCell>{formatDate(apiKey.expiresAt)}</TableCell>
                        <TableCell>{formatDate(apiKey.lastUsedAt)}</TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDeleteKey(apiKey.id)}
                            className="text-destructive hover:text-destructive"
                          >
                            <Trash2 className="h-4 w-4" />
                            <span className="sr-only">Delete</span>
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                    {testApiKeys.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center py-6 text-muted-foreground">
                          No test API keys found. Create one to get started.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">Production API Keys</h3>
              <div className="flex space-x-2">
                <Button variant="outline" onClick={() => setActiveTab('test')}>View Test Keys</Button>
              </div>
            </div>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Production API Keys</CardTitle>
                  <CardDescription>
                    Manage production API keys for your live applications
                  </CardDescription>
                </div>
                <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
                  <DialogTrigger asChild>
                    <Button>
                      <Plus className="mr-2 h-4 w-4" />
                      Create API Key
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-2xl">
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
                          <Alert variant="destructive">
                            <AlertCircle className="h-4 w-4" />
                            <AlertTitle>Important</AlertTitle>
                            <AlertDescription>
                              This API key will not be shown again. If you lose it, you'll need to create a new one.
                            </AlertDescription>
                          </Alert>
                        </div>
                        <DialogFooter>
                          <Button variant="outline" onClick={() => handleCopyKey(newApiKey)}>
                            <Copy className="mr-2 h-4 w-4" />
                            Copy
                          </Button>
                          <Button onClick={closeDialog}>Done</Button>
                        </DialogFooter>
                      </>
                    ) : (
                      <>
                        <DialogHeader>
                          <DialogTitle>Create API Key</DialogTitle>
                          <DialogDescription>
                            Create a new API key for your applications
                          </DialogDescription>
                        </DialogHeader>
                        <Form {...form}>
                          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                            <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-6">
                              <FormField
                                control={form.control}
                                name="name"
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel>Name</FormLabel>
                                    <FormControl>
                                      <Input placeholder="My API Key" {...field} />
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
                                name="type"
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel>Type</FormLabel>
                                    <Select
                                      onValueChange={field.onChange}
                                      defaultValue={field.value}
                                    >
                                      <FormControl>
                                        <SelectTrigger>
                                          <SelectValue placeholder="Select type" />
                                        </SelectTrigger>
                                      </FormControl>
                                      <SelectContent>
                                        <SelectItem value="test">Test</SelectItem>
                                        <SelectItem value="production">Production</SelectItem>
                                      </SelectContent>
                                    </Select>
                                    <FormDescription>
                                      Test keys are for development, production keys for live environments
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
                                    <Select
                                      onValueChange={field.onChange}
                                      defaultValue={field.value}
                                    >
                                      <FormControl>
                                        <SelectTrigger>
                                          <SelectValue placeholder="Select permissions" />
                                        </SelectTrigger>
                                      </FormControl>
                                      <SelectContent>
                                        <SelectItem value="read">Read Only</SelectItem>
                                        <SelectItem value="write">Read & Write</SelectItem>
                                        <SelectItem value="admin">Admin</SelectItem>
                                      </SelectContent>
                                    </Select>
                                    <FormDescription>
                                      Control what actions this API key can perform
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
                                    <Select
                                      onValueChange={field.onChange}
                                      defaultValue={field.value}
                                    >
                                      <FormControl>
                                        <SelectTrigger>
                                          <SelectValue placeholder="Select expiration" />
                                        </SelectTrigger>
                                      </FormControl>
                                      <SelectContent>
                                        <SelectItem value="30">30 days</SelectItem>
                                        <SelectItem value="60">60 days</SelectItem>
                                        <SelectItem value="90">90 days</SelectItem>
                                        <SelectItem value="never">Never</SelectItem>
                                      </SelectContent>
                                    </Select>
                                    <FormDescription>
                                      When this API key should expire
                                    </FormDescription>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                            </div>
                            <DialogFooter className="mt-4 pt-4 border-t">
                              <Button type="button" variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                                Cancel
                              </Button>
                              <Button type="submit">Create</Button>
                            </DialogFooter>
                          </form>
                        </Form>
                      </>
                    )}
                  </DialogContent>
                </Dialog>
              </CardHeader>
              <CardContent>
                <Alert className="mb-4">
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>Important</AlertTitle>
                  <AlertDescription>
                    Production API keys have access to live data. Use with caution and never share them publicly.
                  </AlertDescription>
                </Alert>
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
                    {productionApiKeys.map((apiKey: any) => (
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
                              <span className="sr-only">
                                {showKeys[apiKey.id] ? 'Hide' : 'Show'}
                              </span>
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleCopyKey(apiKey.key)}
                            >
                              <Copy className="h-4 w-4" />
                              <span className="sr-only">Copy</span>
                            </Button>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={'outline'}
                          >
                            read
                          </Badge>
                        </TableCell>
                        <TableCell>{formatDate(apiKey.createdAt)}</TableCell>
                        <TableCell>{formatDate(apiKey.expiresAt)}</TableCell>
                        <TableCell>{formatDate(apiKey.lastUsedAt)}</TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDeleteKey(apiKey.id)}
                            className="text-destructive hover:text-destructive"
                          >
                            <Trash2 className="h-4 w-4" />
                            <span className="sr-only">Delete</span>
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                    {productionApiKeys.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center py-6 text-muted-foreground">
                          No production API keys found. Create one to get started.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </div>
        )}

        <div className="space-y-6 mt-6">
          <Card>
            <CardHeader>
              <CardTitle>API Usage Statistics</CardTitle>
              <CardDescription>
                View usage statistics for your API keys
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="rounded-lg border p-4 space-y-2">
                  <div className="text-sm text-muted-foreground">Total Requests (Last 30 days)</div>
                  <div className="text-2xl font-bold">-</div>
                </div>
                <div className="rounded-lg border p-4 space-y-2">
                  <div className="text-sm text-muted-foreground">Success Rate</div>
                  <div className="text-2xl font-bold">-</div>
                </div>
                <div className="rounded-lg border p-4 space-y-2">
                  <div className="text-sm text-muted-foreground">Last Updated</div>
                  <div className="text-2xl font-bold">
                    <Button variant="ghost" size="sm" className="p-0 h-auto" onClick={handleRefreshStats}>
                      <RefreshCw className="h-4 w-4 mr-1" />
                      Refresh
                    </Button>
                  </div>
                </div>
              </div>

              <div className="rounded-lg border p-4">
                <h3 className="font-semibold mb-3">Top Endpoints</h3>
                <div className="text-sm text-muted-foreground">
                  Detailed API usage statistics coming soon
                </div>
              </div>
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
                  <Button variant="outline" className="w-full mt-2" asChild>
                    <Link href="/developer/docs">View Documentation</Link>
                  </Button>
                </div>
                <div className="rounded-lg border p-4 space-y-2">
                  <h3 className="font-semibold">SDK & Libraries</h3>
                  <p className="text-sm text-muted-foreground">
                    Client libraries for popular programming languages (Coming Soon)
                  </p>
                  <Button variant="outline" className="w-full mt-2" disabled>
                    Coming Soon
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
