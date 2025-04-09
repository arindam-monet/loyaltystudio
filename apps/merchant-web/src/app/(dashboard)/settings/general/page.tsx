'use client';

import { useState, useEffect } from 'react';
import { useTheme } from '@/hooks/use-theme';
import { getContrastColor } from '@/lib/utils/theme-utils';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { useQueryClient } from '@tanstack/react-query';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMerchantStore } from '@/lib/stores/merchant-store';
import { useMerchants } from '@/hooks/use-merchants';
import { useToast } from '@loyaltystudio/ui';
import { apiClient } from '@/lib/api-client';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
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
  Input,
  Textarea,
  Separator,
  Alert,
  AlertDescription,
  AlertTitle,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@loyaltystudio/ui';
import { ColorPicker } from '@/components/color-picker';
import { AlertCircle, Loader2, Trash2, AlertTriangle } from 'lucide-react';

// Define the form schema
const merchantSettingsSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  description: z.string().optional(),
  website: z.string().url('Please enter a valid URL').optional().or(z.literal('')),
  contactEmail: z.string().email('Please enter a valid email').optional().or(z.literal('')),
  contactPhone: z.string().optional(),
  currency: z.string().min(3, 'Currency code must be 3 characters').max(3).default('USD').optional(),
  timezone: z.string().min(1, 'Timezone is required').default('UTC').optional(),
  address: z.object({
    street: z.string().optional(),
    city: z.string().optional(),
    state: z.string().optional(),
    postalCode: z.string().optional(),
    country: z.string().optional(),
  }),
  branding: z.object({
    primaryColor: z.string().regex(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/, 'Please enter a valid hex color'),
    primaryTextColor: z.string().regex(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/, 'Please enter a valid hex color').optional(),
    secondaryColor: z.string().regex(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/, 'Please enter a valid hex color'),
    secondaryTextColor: z.string().regex(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/, 'Please enter a valid hex color').optional(),
    accentColor: z.string().regex(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/, 'Please enter a valid hex color').optional(),
    accentTextColor: z.string().regex(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/, 'Please enter a valid hex color').optional(),
    logoUrl: z.union([
      z.string().url('Please enter a valid URL'),
      z.literal(''),
      z.null(),
      z.undefined()
    ]),
  }),
});

type MerchantSettingsFormValues = z.infer<typeof merchantSettingsSchema>;

export default function GeneralSettingsPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const { selectedMerchant, setSelectedMerchant } = useMerchantStore();
  const queryClient = useQueryClient();
  const { updateMerchant, deleteMerchant } = useMerchants();
  const { toast } = useToast();
  const { updateTheme } = useTheme();

  // Initialize form with default values
  const form = useForm<MerchantSettingsFormValues>({
    resolver: zodResolver(merchantSettingsSchema),
    defaultValues: {
      name: '',
      description: '',
      website: '',
      contactEmail: '',
      contactPhone: '',
      currency: 'USD',
      timezone: 'UTC',
      address: {
        street: '',
        city: '',
        state: '',
        postalCode: '',
        country: '',
      },
      branding: {
        primaryColor: '#4f46e5', // Default indigo color
        primaryTextColor: '#ffffff', // Default white text
        secondaryColor: '#0ea5e9', // Default sky blue color
        secondaryTextColor: '#ffffff', // Default white text
        accentColor: '#f59e0b', // Default amber color
        accentTextColor: '#000000', // Default black text
        logoUrl: '',
      },
    },
  });

  // Use the getMerchant hook to fetch merchant data
  const { data: merchantDetails, isLoading: isFetchingMerchant, error: merchantError } =
    useMerchants().getMerchant(selectedMerchant?.id || '');

  // Load merchant data when it's fetched from the API
  useEffect(() => {
    if (!merchantDetails) return;

    try {
      console.log('Merchant details loaded from API:', merchantDetails);

      // Update form values
      form.reset({
        name: merchantDetails.name || '',
        description: merchantDetails.description || '',
        website: merchantDetails.website || '',
        contactEmail: merchantDetails.contactEmail || '',
        contactPhone: merchantDetails.contactPhone || '',
        currency: merchantDetails.currency || 'USD',
        timezone: merchantDetails.timezone || 'UTC',
        address: {
          street: merchantDetails.address?.street || '',
          city: merchantDetails.address?.city || '',
          state: merchantDetails.address?.state || '',
          postalCode: merchantDetails.address?.postalCode || '',
          country: merchantDetails.address?.country || '',
        },
        branding: {
          primaryColor: merchantDetails.branding?.primaryColor || '#4f46e5',
          primaryTextColor: merchantDetails.branding?.primaryTextColor || '#ffffff',
          secondaryColor: merchantDetails.branding?.secondaryColor || '#0ea5e9',
          secondaryTextColor: merchantDetails.branding?.secondaryTextColor || '#ffffff',
          accentColor: merchantDetails.branding?.accentColor || '#f59e0b',
          accentTextColor: merchantDetails.branding?.accentTextColor || '#000000',
          logoUrl: merchantDetails.branding?.logoUrl || (merchantDetails.branding as any)?.logo || '',
        },
      });

      // Apply theme colors
      if (merchantDetails.branding) {
        console.log('Applying theme colors from merchant data');
        updateTheme(merchantDetails.branding);
      }

      console.log('Merchant data loaded successfully');
    } catch (error) {
      console.error('Failed to process merchant data:', error);
      toast({
        title: 'Error',
        description: 'Failed to load merchant settings',
        variant: 'destructive',
      });
    }
  }, [merchantDetails, form, toast]);

  // Set loading state based on API loading state
  useEffect(() => {
    setIsLoading(isFetchingMerchant);
  }, [isFetchingMerchant]);

  // Handle API errors
  useEffect(() => {
    if (merchantError) {
      console.error('Error fetching merchant:', merchantError);
      toast({
        title: 'Error',
        description: 'Failed to load merchant settings',
        variant: 'destructive',
      });
    }
  }, [merchantError, toast]);

  // Theme colors are now managed by the useTheme hook

  // Color conversion functions are now imported from theme-utils.ts

  // Handle form submission
  const onSubmit = async (data: MerchantSettingsFormValues) => {
    if (!selectedMerchant) return;

    setIsSaving(true);
    try {
      console.log('Updating merchant data:', JSON.stringify(data, null, 2));

      // Prepare the update data
      const updateData = {
        name: data.name,
        description: data.description,
        website: data.website || '',
        contactEmail: data.contactEmail || '',
        contactPhone: data.contactPhone || '',
        currency: data.currency,
        timezone: data.timezone,
        address: data.address,
        branding: {
          primaryColor: data.branding.primaryColor,
          primaryTextColor: data.branding.primaryTextColor,
          secondaryColor: data.branding.secondaryColor,
          secondaryTextColor: data.branding.secondaryTextColor,
          accentColor: data.branding.accentColor || '#f59e0b',
          accentTextColor: data.branding.accentTextColor,
          // Ensure logoUrl is a valid URL or an empty string
          logoUrl: data.branding.logoUrl && data.branding.logoUrl.startsWith('http')
            ? data.branding.logoUrl
            : ''
        },
      };

      console.log('Update payload:', JSON.stringify(updateData, null, 2));

      // Update merchant data
      const updatedMerchant = await updateMerchant.mutateAsync({
        id: selectedMerchant.id,
        data: updateData,
      });

      console.log('API response:', JSON.stringify(updatedMerchant, null, 2));

      // Apply theme colors immediately
      updateTheme(data.branding);

      // Refresh the merchant data
      // This will trigger a refetch of the merchant details
      queryClient.invalidateQueries({ queryKey: ['merchant', selectedMerchant.id] });

      console.log('Merchant updated successfully');

      toast({
        title: 'Success',
        description: 'Merchant settings updated successfully',
        duration: 5000,
      });
    } catch (error: any) {
      console.error('Failed to update merchant settings:', error);
      let errorMessage = 'Failed to update merchant settings';

      if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.message) {
        errorMessage = error.message;
      }

      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive',
        duration: 7000,
      });
    } finally {
      setIsSaving(false);
    }
  };

  // State for tracking associated programs
  const [associatedPrograms, setAssociatedPrograms] = useState<{ id: string; name: string }[]>([]);
  const [isCheckingPrograms, setIsCheckingPrograms] = useState(false);

  // Check for associated loyalty programs when dialog opens
  useEffect(() => {
    const checkAssociatedPrograms = async () => {
      if (!showDeleteDialog || !selectedMerchant) return;

      setIsCheckingPrograms(true);
      try {
        // Fetch loyalty programs for this merchant
        const response = await apiClient.get(`/loyalty-programs?merchantId=${selectedMerchant.id}`);
        const programs = response.data || [];

        setAssociatedPrograms(programs.map((p: any) => ({ id: p.id, name: p.name })));
      } catch (error) {
        console.error('Failed to fetch associated programs:', error);
        // Set empty array on error to avoid blocking deletion
        setAssociatedPrograms([]);
      } finally {
        setIsCheckingPrograms(false);
      }
    };

    checkAssociatedPrograms();
  }, [showDeleteDialog, selectedMerchant]);

  // Handle merchant deletion
  const handleDeleteMerchant = async () => {
    if (!selectedMerchant) return;

    setIsDeleting(true);
    try {
      console.log('Deleting merchant:', selectedMerchant.id);

      // Delete the merchant
      await deleteMerchant.mutateAsync(selectedMerchant.id);

      // Close the dialog
      setShowDeleteDialog(false);

      // Show success message
      toast({
        title: 'Success',
        description: 'Merchant deleted successfully',
        duration: 5000,
      });

      // Clear the selected merchant from the store
      setSelectedMerchant(null);

      // Invalidate the merchants query to refresh the list
      queryClient.invalidateQueries({ queryKey: ['merchants'] });

      // Redirect to the dashboard
      router.push('/');
    } catch (error: any) {
      console.error('Failed to delete merchant:', error);
      let errorMessage = 'Failed to delete merchant';

      if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.message) {
        errorMessage = error.message;
      }

      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive',
        duration: 7000,
      });
    } finally {
      setIsDeleting(false);
    }
  };

  // Watch branding colors to preview changes
  const primaryColor = form.watch('branding.primaryColor');
  const secondaryColor = form.watch('branding.secondaryColor');
  const accentColor = form.watch('branding.accentColor');

  // Update theme colors when form values change
  useEffect(() => {
    if (primaryColor && secondaryColor) {
      console.log('Form values changed, updating theme colors');
      updateTheme({
        primaryColor,
        secondaryColor,
        accentColor: accentColor || '#f59e0b',
        primaryTextColor: form.watch('branding.primaryTextColor'),
        secondaryTextColor: form.watch('branding.secondaryTextColor'),
        accentTextColor: form.watch('branding.accentTextColor')
      });
    }
  }, [primaryColor, secondaryColor, accentColor]);

  // Apply theme colors on initial load
  useEffect(() => {
    if (selectedMerchant?.branding) {
      console.log('Initial theme application from merchant data');
      updateTheme(selectedMerchant.branding);
    }
  }, []);

  if (!selectedMerchant) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>No merchant selected</AlertTitle>
        <AlertDescription>
          Please select a merchant to view and edit settings.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-6">
      {/* Delete Merchant Confirmation Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center text-destructive">
              <AlertTriangle className="h-5 w-5 mr-2" />
              Delete Merchant
            </DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this merchant? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Alert variant="destructive" className="mb-4">
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>Warning</AlertTitle>
              <AlertDescription>
                Deleting this merchant will permanently remove all associated data, including:
                <ul className="list-disc pl-5 mt-2 space-y-1">
                  <li>Loyalty programs</li>
                  <li>Program members</li>
                  <li>Transactions</li>
                  <li>Rewards and tiers</li>
                  <li>All other merchant settings</li>
                </ul>
              </AlertDescription>
            </Alert>

            {selectedMerchant && (
              <div className="p-3 border rounded-md bg-muted">
                <p className="font-medium">Merchant to delete:</p>
                <p className="text-destructive font-bold">{selectedMerchant.name}</p>
                <p className="text-sm text-muted-foreground mt-1">ID: {selectedMerchant.id}</p>
              </div>
            )}

            {isCheckingPrograms ? (
              <div className="mt-4 flex items-center text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Checking for associated loyalty programs...
              </div>
            ) : associatedPrograms.length > 0 ? (
              <div className="mt-4 p-3 border rounded-md bg-amber-50 border-amber-200">
                <p className="font-medium text-amber-800 flex items-center">
                  <AlertTriangle className="h-4 w-4 mr-2 text-amber-500" />
                  This merchant has {associatedPrograms.length} active loyalty program{associatedPrograms.length !== 1 ? 's' : ''}:
                </p>
                <ul className="mt-2 space-y-1 pl-6 list-disc text-sm text-amber-800">
                  {associatedPrograms.map(program => (
                    <li key={program.id}>{program.name}</li>
                  ))}
                </ul>
                <p className="mt-2 text-sm text-amber-700">
                  All these programs and their associated data will be permanently deleted.
                </p>
              </div>
            ) : null}
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="outline"
              onClick={() => setShowDeleteDialog(false)}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteMerchant}
              disabled={isDeleting}
            >
              {isDeleting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Deleting...
                </>
              ) : (
                'Delete Merchant'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {isLoading ? (
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : (
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
            <Card>
              <CardHeader className="flex flex-row items-start justify-between">
                <div>
                  <CardTitle>Merchant Information</CardTitle>
                  <CardDescription>
                    Basic information about your business
                  </CardDescription>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  type="button" /* Add type="button" to prevent form submission */
                  className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                  onClick={(e) => {
                    e.preventDefault(); // Prevent any form submission
                    setShowDeleteDialog(true);
                  }}
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete Merchant
                </Button>
              </CardHeader>
              <CardContent className="space-y-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Business Name</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter your business name" {...field} />
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
                        <Textarea
                          placeholder="Brief description of your business"
                          className="min-h-[100px]"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="website"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Website</FormLabel>
                        <FormControl>
                          <Input placeholder="https://example.com" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="contactEmail"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Contact Email</FormLabel>
                        <FormControl>
                          <Input placeholder="contact@example.com" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="contactPhone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Contact Phone</FormLabel>
                      <FormControl>
                        <Input placeholder="+1 (555) 123-4567" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="currency"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Currency</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                          value={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select currency" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="USD">USD - US Dollar</SelectItem>
                            <SelectItem value="EUR">EUR - Euro</SelectItem>
                            <SelectItem value="GBP">GBP - British Pound</SelectItem>
                            <SelectItem value="JPY">JPY - Japanese Yen</SelectItem>
                            <SelectItem value="AUD">AUD - Australian Dollar</SelectItem>
                            <SelectItem value="CAD">CAD - Canadian Dollar</SelectItem>
                            <SelectItem value="CHF">CHF - Swiss Franc</SelectItem>
                            <SelectItem value="CNY">CNY - Chinese Yuan</SelectItem>
                            <SelectItem value="INR">INR - Indian Rupee</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormDescription>
                          The default currency for your loyalty programs
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="timezone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Timezone</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                          value={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select timezone" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="UTC">UTC</SelectItem>
                            <SelectItem value="America/New_York">Eastern Time (ET)</SelectItem>
                            <SelectItem value="America/Chicago">Central Time (CT)</SelectItem>
                            <SelectItem value="America/Denver">Mountain Time (MT)</SelectItem>
                            <SelectItem value="America/Los_Angeles">Pacific Time (PT)</SelectItem>
                            <SelectItem value="Europe/London">London (GMT)</SelectItem>
                            <SelectItem value="Europe/Paris">Central European Time (CET)</SelectItem>
                            <SelectItem value="Asia/Kolkata">India (IST)</SelectItem>
                            <SelectItem value="Asia/Tokyo">Japan Time (JST)</SelectItem>
                            <SelectItem value="Asia/Shanghai">China Time (CST)</SelectItem>
                            <SelectItem value="Australia/Sydney">Australian Eastern Time (AET)</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormDescription>
                          The default timezone for your loyalty programs
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Address</CardTitle>
                <CardDescription>
                  Your business location information
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <FormField
                  control={form.control}
                  name="address.street"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Street Address</FormLabel>
                      <FormControl>
                        <Input placeholder="123 Main St" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="address.city"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>City</FormLabel>
                        <FormControl>
                          <Input placeholder="City" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="address.state"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>State/Province</FormLabel>
                        <FormControl>
                          <Input placeholder="State" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="address.postalCode"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Postal Code</FormLabel>
                        <FormControl>
                          <Input placeholder="12345" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="address.country"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Country</FormLabel>
                        <FormControl>
                          <Input placeholder="Country" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Branding</CardTitle>
                <CardDescription>
                  Customize your brand colors and appearance
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-6">
                  <h3 className="text-lg font-medium">Brand Colors</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <FormField
                        control={form.control}
                        name="branding.primaryColor"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Primary Color</FormLabel>
                            <FormControl>
                              <ColorPicker
                                value={field.value}
                                onChange={field.onChange}
                              />
                            </FormControl>
                            <FormDescription>
                              Main brand color used for buttons and accents
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="branding.primaryTextColor"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Primary Text Color</FormLabel>
                            <FormControl>
                              <ColorPicker
                                value={field.value || '#ffffff'}
                                onChange={field.onChange}
                              />
                            </FormControl>
                            <FormDescription>
                              Text color for primary elements (buttons, etc.)
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <div className="space-y-4">
                      <FormField
                        control={form.control}
                        name="branding.secondaryColor"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Secondary Color</FormLabel>
                            <FormControl>
                              <ColorPicker
                                value={field.value}
                                onChange={field.onChange}
                              />
                            </FormControl>
                            <FormDescription>
                              Used for secondary elements and highlights
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="branding.secondaryTextColor"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Secondary Text Color</FormLabel>
                            <FormControl>
                              <ColorPicker
                                value={field.value || '#ffffff'}
                                onChange={field.onChange}
                              />
                            </FormControl>
                            <FormDescription>
                              Text color for secondary elements
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <FormField
                        control={form.control}
                        name="branding.accentColor"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Accent Color</FormLabel>
                            <FormControl>
                              <ColorPicker
                                value={field.value || '#f59e0b'}
                                onChange={field.onChange}
                              />
                            </FormControl>
                            <FormDescription>
                              Used for special highlights and calls to action
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="branding.accentTextColor"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Accent Text Color</FormLabel>
                            <FormControl>
                              <ColorPicker
                                value={field.value || '#000000'}
                                onChange={field.onChange}
                              />
                            </FormControl>
                            <FormDescription>
                              Text color for accent elements
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>
                </div>

                <Separator />

                <FormField
                  control={form.control}
                  name="branding.logoUrl"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Logo URL</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="https://example.com/logo.png"
                          value={field.value || ''}
                          onChange={(e) => {
                            // Validate URL format before setting the value
                            const value = e.target.value;
                            if (value === '' || value.startsWith('http')) {
                              field.onChange(value);
                            } else if (value && !value.startsWith('http')) {
                              // Add https:// prefix if missing
                              field.onChange(`https://${value}`);
                            }
                          }}
                          onBlur={field.onBlur}
                          name={field.name}
                          ref={field.ref}
                        />
                      </FormControl>
                      <FormDescription>
                        URL to your company logo (recommended size: 200x200px). Must start with http:// or https://
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="mt-6">
                  <h3 className="text-lg font-medium mb-2">Theme Preview</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="flex flex-col gap-2">
                      <div
                        className="h-20 rounded-md flex items-center justify-center"
                        style={{
                          backgroundColor: primaryColor,
                          color: form.watch('branding.primaryTextColor') || getContrastColor(primaryColor)
                        }}
                      >
                        Primary Color
                      </div>
                      <div className="flex justify-between text-xs">
                        <span>BG: {primaryColor}</span>
                        <span>Text: {form.watch('branding.primaryTextColor') || getContrastColor(primaryColor)}</span>
                      </div>
                    </div>
                    <div className="flex flex-col gap-2">
                      <div
                        className="h-20 rounded-md flex items-center justify-center"
                        style={{
                          backgroundColor: secondaryColor,
                          color: form.watch('branding.secondaryTextColor') || getContrastColor(secondaryColor)
                        }}
                      >
                        Secondary Color
                      </div>
                      <div className="flex justify-between text-xs">
                        <span>BG: {secondaryColor}</span>
                        <span>Text: {form.watch('branding.secondaryTextColor') || getContrastColor(secondaryColor)}</span>
                      </div>
                    </div>
                    <div className="flex flex-col gap-2">
                      <div
                        className="h-20 rounded-md flex items-center justify-center"
                        style={{
                          backgroundColor: accentColor || '#f59e0b',
                          color: form.watch('branding.accentTextColor') || getContrastColor(accentColor || '#f59e0b')
                        }}
                      >
                        Accent Color
                      </div>
                      <div className="flex justify-between text-xs">
                        <span>BG: {accentColor || '#f59e0b'}</span>
                        <span>Text: {form.watch('branding.accentTextColor') || getContrastColor(accentColor || '#f59e0b')}</span>
                      </div>
                    </div>
                  </div>

                  <div className="mt-6 p-4 border rounded-md">
                    <h4 className="text-md font-medium mb-2">UI Elements Preview</h4>
                    <div className="flex flex-wrap gap-4 items-center">
                      <Button
                        variant="default"
                        type="button"
                        onClick={(e) => {
                          e.preventDefault(); // Prevent form submission
                          console.log('Primary button clicked (preview only)');
                        }}
                      >
                        Primary Button
                      </Button>
                      <Button
                        variant="secondary"
                        type="button"
                        onClick={(e) => {
                          e.preventDefault(); // Prevent form submission
                          console.log('Secondary button clicked (preview only)');
                        }}
                      >
                        Secondary Button
                      </Button>
                      <Button
                        variant="outline"
                        type="button"
                        onClick={(e) => {
                          e.preventDefault(); // Prevent form submission
                          console.log('Outline button clicked (preview only)');
                        }}
                      >
                        Outline Button
                      </Button>
                      <Button
                        variant="ghost"
                        type="button"
                        onClick={(e) => {
                          e.preventDefault(); // Prevent form submission
                          console.log('Ghost button clicked (preview only)');
                        }}
                      >
                        Ghost Button
                      </Button>
                    </div>
                    <div className="mt-4 p-3 rounded-md" style={{ backgroundColor: primaryColor, color: form.watch('branding.primaryTextColor') || getContrastColor(primaryColor) }}>
                      <p>This is how text will look on your primary color background.</p>
                    </div>
                    <div className="mt-2 p-3 rounded-md" style={{ backgroundColor: secondaryColor, color: form.watch('branding.secondaryTextColor') || getContrastColor(secondaryColor) }}>
                      <p>This is how text will look on your secondary color background.</p>
                    </div>
                    <div className="mt-2 p-3 rounded-md" style={{ backgroundColor: accentColor || '#f59e0b', color: form.watch('branding.accentTextColor') || getContrastColor(accentColor || '#f59e0b') }}>
                      <p>This is how text will look on your accent color background.</p>
                    </div>
                  </div>
                </div>
              </CardContent>
              <CardFooter className="flex justify-end">
                <Button type="submit" disabled={isSaving}>
                  {isSaving ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    'Save Changes'
                  )}
                </Button>
              </CardFooter>
            </Card>
          </form>
        </Form>
      )}
    </div>
  );
}
