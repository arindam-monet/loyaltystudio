'use client';

import { useState, useEffect } from 'react';
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
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
  Alert,
  AlertDescription,
  AlertTitle,
} from '@loyaltystudio/ui';
import { ColorPicker } from '@/components/color-picker';
import { AlertCircle, Loader2 } from 'lucide-react';

// Define the form schema
const merchantSettingsSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  description: z.string().optional(),
  website: z.string().url('Please enter a valid URL').optional().or(z.literal('')),
  contactEmail: z.string().email('Please enter a valid email').optional().or(z.literal('')),
  contactPhone: z.string().optional(),
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
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const { selectedMerchant, setSelectedMerchant } = useMerchantStore();
  const queryClient = useQueryClient();
  const { updateMerchant } = useMerchants();
  const { toast } = useToast();

  // Initialize form with default values
  const form = useForm<MerchantSettingsFormValues>({
    resolver: zodResolver(merchantSettingsSchema),
    defaultValues: {
      name: '',
      description: '',
      website: '',
      contactEmail: '',
      contactPhone: '',
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
        applyThemeColors(
          merchantDetails.branding.primaryColor || '#4f46e5',
          merchantDetails.branding.secondaryColor || '#0ea5e9',
          merchantDetails.branding.accentColor || '#f59e0b',
          merchantDetails.branding.primaryTextColor,
          merchantDetails.branding.secondaryTextColor,
          merchantDetails.branding.accentTextColor
        );
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

  // Function to apply theme colors with optional custom text colors
  const applyThemeColors = (
    primary: string,
    secondary: string,
    accent: string,
    primaryText?: string,
    secondaryText?: string,
    accentText?: string
  ) => {
    console.log('Applying theme colors:', {
      primary, secondary, accent,
      primaryText, secondaryText, accentText
    });

    // Convert hex to HSL for better compatibility with the theme system
    const primaryHSL = hexToHSL(primary);
    const secondaryHSL = hexToHSL(secondary);
    const accentHSL = hexToHSL(accent);

    // Determine text colors - use custom if provided, otherwise calculate contrast
    const primaryForeground = primaryText || getContrastColor(primary);
    const secondaryForeground = secondaryText || getContrastColor(secondary);
    const accentForeground = accentText || getContrastColor(accent);

    // Apply the HSL values to the CSS variables
    if (primaryHSL) {
      document.documentElement.style.setProperty('--primary', `${primaryHSL.h} ${primaryHSL.s}% ${primaryHSL.l}%`);
    } else {
      // Fallback to direct hex color if HSL conversion fails
      document.documentElement.style.setProperty('--primary', primary);
    }
    // Set the text color - convert to HSL if possible
    const primaryTextHSL = hexToHSL(primaryForeground);
    if (primaryTextHSL) {
      document.documentElement.style.setProperty('--primary-foreground', `${primaryTextHSL.h} ${primaryTextHSL.s}% ${primaryTextHSL.l}%`);
    } else {
      document.documentElement.style.setProperty('--primary-foreground', primaryForeground);
    }

    if (secondaryHSL) {
      document.documentElement.style.setProperty('--secondary', `${secondaryHSL.h} ${secondaryHSL.s}% ${secondaryHSL.l}%`);
    } else {
      document.documentElement.style.setProperty('--secondary', secondary);
    }
    // Set the text color - convert to HSL if possible
    const secondaryTextHSL = hexToHSL(secondaryForeground);
    if (secondaryTextHSL) {
      document.documentElement.style.setProperty('--secondary-foreground', `${secondaryTextHSL.h} ${secondaryTextHSL.s}% ${secondaryTextHSL.l}%`);
    } else {
      document.documentElement.style.setProperty('--secondary-foreground', secondaryForeground);
    }

    if (accentHSL) {
      document.documentElement.style.setProperty('--accent', `${accentHSL.h} ${accentHSL.s}% ${accentHSL.l}%`);
    } else {
      document.documentElement.style.setProperty('--accent', accent);
    }
    // Set the text color - convert to HSL if possible
    const accentTextHSL = hexToHSL(accentForeground);
    if (accentTextHSL) {
      document.documentElement.style.setProperty('--accent-foreground', `${accentTextHSL.h} ${accentTextHSL.s}% ${accentTextHSL.l}%`);
    } else {
      document.documentElement.style.setProperty('--accent-foreground', accentForeground);
    }

    // Also set success and warning colors based on the accent color
    document.documentElement.style.setProperty('--success', '142.1 76.2% 36.3%');
    document.documentElement.style.setProperty('--warning', '38 92% 50%');

    console.log('Theme colors applied successfully');
  };

  // Function to convert hex color to HSL
  const hexToHSL = (hex: string): { h: number; s: number; l: number } | null => {
    try {
      // Remove the # if it exists
      hex = hex.replace('#', '');

      // Convert hex to RGB
      const r = parseInt(hex.substring(0, 2), 16) / 255;
      const g = parseInt(hex.substring(2, 4), 16) / 255;
      const b = parseInt(hex.substring(4, 6), 16) / 255;

      // Find the maximum and minimum values to calculate the lightness
      const max = Math.max(r, g, b);
      const min = Math.min(r, g, b);

      // Calculate the lightness
      let h = 0;
      let s = 0;
      const l = (max + min) / 2;

      // Only calculate the hue and saturation if the color isn't grayscale
      if (max !== min) {
        const d = max - min;
        s = l > 0.5 ? d / (2 - max - min) : d / (max + min);

        switch (max) {
          case r:
            h = (g - b) / d + (g < b ? 6 : 0);
            break;
          case g:
            h = (b - r) / d + 2;
            break;
          case b:
            h = (r - g) / d + 4;
            break;
        }

        h = Math.round(h * 60);
      }

      // Convert saturation and lightness to percentages
      s = Math.round(s * 100);
      const lightness = Math.round(l * 100);

      return { h, s, l: lightness };
    } catch (error) {
      console.error('Error converting hex to HSL:', error);
      return null;
    }
  };

  // Function to get contrast color (black or white) based on background color
  const getContrastColor = (hexColor: string) => {
    // Remove the # if it exists
    hexColor = hexColor.replace('#', '');

    // Convert to RGB
    const r = parseInt(hexColor.substr(0, 2), 16);
    const g = parseInt(hexColor.substr(2, 2), 16);
    const b = parseInt(hexColor.substr(4, 2), 16);

    // Calculate luminance
    const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;

    // Return black for bright colors, white for dark colors
    return luminance > 0.5 ? '#000000' : '#ffffff';
  };

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
      applyThemeColors(
        data.branding.primaryColor,
        data.branding.secondaryColor,
        data.branding.accentColor || '#f59e0b',
        data.branding.primaryTextColor,
        data.branding.secondaryTextColor,
        data.branding.accentTextColor
      );

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

  // Watch branding colors to preview changes
  const primaryColor = form.watch('branding.primaryColor');
  const secondaryColor = form.watch('branding.secondaryColor');
  const accentColor = form.watch('branding.accentColor');

  // Update theme colors when form values change
  useEffect(() => {
    if (primaryColor && secondaryColor) {
      console.log('Form values changed, updating theme colors');
      applyThemeColors(
        primaryColor,
        secondaryColor,
        accentColor || '#f59e0b',
        form.watch('branding.primaryTextColor'),
        form.watch('branding.secondaryTextColor'),
        form.watch('branding.accentTextColor')
      );
    }
  }, [primaryColor, secondaryColor, accentColor]);

  // Apply theme colors on initial load
  useEffect(() => {
    if (selectedMerchant?.branding) {
      console.log('Initial theme application from merchant data');
      const branding = selectedMerchant.branding;
      applyThemeColors(
        branding.primaryColor || '#4f46e5',
        branding.secondaryColor || '#0ea5e9',
        branding.accentColor || '#f59e0b',
        branding.primaryTextColor,
        branding.secondaryTextColor,
        branding.accentTextColor
      );
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
      {isLoading ? (
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : (
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
            <Card>
              <CardHeader>
                <CardTitle>Merchant Information</CardTitle>
                <CardDescription>
                  Basic information about your business
                </CardDescription>
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
                          {...field}
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
