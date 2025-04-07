'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
  Button,
  Alert,
  AlertTitle,
  AlertDescription,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Input,
  Label,
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  Badge,
  Separator,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  toast,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,

} from '@loyaltystudio/ui';
import {
  Users,
  CheckCircle2,
  AlertCircle,
  Gift,
  Trash2,
  Edit,
  Rocket,
  Plus,
  Upload,
  Download,
  FileText,
} from 'lucide-react';
import { useAuthGuard } from '@/hooks/use-auth-guard';
import { useLoyaltyPrograms } from '@/hooks/use-loyalty-programs';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { ChecklistService } from '@/services/checklist-service';
import { useProgramMembers } from '@/hooks/use-program-members';
import { useProgramTiers } from '@/hooks/use-program-tiers';
import { useAuthStore } from '@/lib/stores/auth-store';

// Define the form schema for adding a member
const memberSchema = z.object({
  email: z.string().email('Please enter a valid email'),
  name: z.string().min(2, 'Name must be at least 2 characters'),
  tierId: z.string().min(1, 'Please select a tier'),
  loyaltyProgramId: z.string().min(1, 'Please select a loyalty program'),
  initialPoints: z.number().min(0, 'Initial points must be at least 0'),
});

type MemberFormData = z.infer<typeof memberSchema>;

export default function ProgramMembersPage() {
  const router = useRouter();
  const { isLoading: isAuthLoading } = useAuthGuard();
  const { loyaltyPrograms, isLoading: isLoyaltyProgramsLoading } = useLoyaltyPrograms();
  const [selectedProgram, setSelectedProgram] = useState<string>('');
  const [isChangingProgram, setIsChangingProgram] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isChecklistUpdated, setIsChecklistUpdated] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isBulkImportDialogOpen, setIsBulkImportDialogOpen] = useState(false);
  const [csvData, setCsvData] = useState<any[]>([]);
  const { user } = useAuthStore();
  const { members, isLoading: isMembersLoading, createMember, deleteMember } = useProgramMembers(selectedProgram);
  const { tiers, isLoading: isTiersLoading } = useProgramTiers(selectedProgram);

  const form = useForm<MemberFormData>({
    resolver: zodResolver(memberSchema),
    defaultValues: {
      email: '',
      name: '',
      tierId: '',
      loyaltyProgramId: '',
      initialPoints: 0,
    },
  });

  // Set form values when program is selected
  useEffect(() => {
    if (selectedProgram) {
      form.setValue('loyaltyProgramId', selectedProgram);

      // If we have members, update the checklist
      if (members.length > 0 && !isChecklistUpdated) {
        ChecklistService.completeMembersStep()
          .then(() => setIsChecklistUpdated(true))
          .catch(err => console.error('Failed to update checklist:', err));
      }
    }
  }, [selectedProgram, members, isChecklistUpdated]);

  // Set default tier when tiers are loaded
  useEffect(() => {
    if (tiers.length > 0) {
      // Find the lowest tier by pointsThreshold
      const lowestTier = tiers.reduce((prev, current) =>
        prev.pointsThreshold < current.pointsThreshold ? prev : current
      );

      console.log('Setting default tier:', lowestTier);
      form.setValue('tierId', lowestTier.id);
    }
  }, [tiers, form]);

  // Reset form and set default values when dialog opens
  useEffect(() => {
    if (isAddDialogOpen && tiers.length > 0) {
      const lowestTier = tiers.reduce((prev, current) =>
        prev.pointsThreshold < current.pointsThreshold ? prev : current
      );

      form.reset({
        email: '',
        name: '',
        tierId: lowestTier.id,
        loyaltyProgramId: selectedProgram,
        initialPoints: 0,
      });
    }
  }, [isAddDialogOpen, tiers, selectedProgram, form]);

  // Filter members based on search query
  const filteredMembers = searchQuery
    ? members.filter(member =>
      member.user.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      member.user.email.toLowerCase().includes(searchQuery.toLowerCase())
    )
    : members;

  // Add a new member
  const onSubmit = async (data: MemberFormData) => {
    console.log('Submitting form with data:', data);

    if (!data.tierId && tiers.length > 0) {
      toast({
        title: 'Error',
        description: 'Please select a membership tier',
        variant: 'destructive'
      });
      return;
    }

    // If no tiers are available, show an error
    if (tiers.length === 0) {
      toast({
        title: 'Error',
        description: 'Cannot add member: No tiers available. Please create a tier first.',
        variant: 'destructive'
      });
      return;
    }

    setIsSubmitting(true);
    try {
      // First, create a user if needed
      let userId = user?.id;

      if (!userId) {
        // In a real implementation, we would create a user
        // For now, we'll use the current user's ID
        toast({ title: 'Error', description: 'No user ID available', variant: 'destructive' });
        return;
      }

      // Create the program member
      await createMember.mutateAsync({
        userId,
        tierId: data.tierId,
        loyaltyProgramId: data.loyaltyProgramId,
        pointsBalance: data.initialPoints,
        metadata: { createdVia: 'merchant-portal' }
      });

      toast({ title: 'Success', description: `Added ${data.name} to the loyalty program` });

      // Close the dialog
      setIsAddDialogOpen(false);

      // Update the checklist status
      if (!isChecklistUpdated) {
        await ChecklistService.completeMembersStep();
        setIsChecklistUpdated(true);
      }
    } catch (error: any) {
      toast({ title: 'Error', description: error.response?.data?.error || error.message || 'Failed to add member', variant: 'destructive' });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Delete a member
  const handleDeleteMember = async (id: string) => {
    try {
      await deleteMember.mutateAsync(id);
      toast({ title: 'Success', description: 'Member removed successfully' });
    } catch (error: any) {
      toast({ title: 'Error', description: error.response?.data?.error || error.message || 'Failed to delete member', variant: 'destructive' });
    }
  };

  // Handle CSV file upload
  const handleCsvUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const text = e.target?.result as string;
        const lines = text.split('\n');
        const headers = lines[0].split(',').map(header => header.trim());

        // Validate headers
        const requiredHeaders = ['email', 'name', 'initialPoints'];
        const missingHeaders = requiredHeaders.filter(h => !headers.includes(h));

        if (missingHeaders.length > 0) {
          toast({
            title: 'Invalid CSV Format',
            description: `Missing required headers: ${missingHeaders.join(', ')}`,
            variant: 'destructive'
          });

          return;
        }

        // Parse data
        const data = [];
        for (let i = 1; i < lines.length; i++) {
          if (!lines[i].trim()) continue; // Skip empty lines

          const values = lines[i].split(',').map(value => value.trim());
          const row: Record<string, any> = {};

          headers.forEach((header, index) => {
            row[header] = values[index] || '';
          });

          // Convert initialPoints to number
          if (row.initialPoints) {
            row.initialPoints = parseInt(row.initialPoints) || 0;
          } else {
            row.initialPoints = 0;
          }

          data.push(row);
        }

        setCsvData(data);

      } catch (error) {
        console.error('Failed to parse CSV:', error);
        toast({
          title: 'Error',
          description: 'Failed to parse CSV file. Please check the format.',
          variant: 'destructive'
        });

      }
    };

    reader.onerror = () => {
      toast({
        title: 'Error',
        description: 'Failed to read the file',
        variant: 'destructive'
      });

    };

    reader.readAsText(file);
  };

  // Bulk import members
  const handleBulkImport = async () => {
    if (!selectedProgram || !csvData.length) return;

    // Check if tiers are available
    if (tiers.length === 0) {
      toast({
        title: 'Error',
        description: 'Cannot import members: No tiers available. Please create a tier first.',
        variant: 'destructive'
      });
      setIsBulkImportDialogOpen(false);
      return;
    }

    setIsSubmitting(true);
    let successCount = 0;
    let errorCount = 0;

    try {
      // Find the default tier
      const defaultTier = tiers.reduce((prev, current) =>
        prev.pointsThreshold < current.pointsThreshold ? prev : current
      );

      if (!defaultTier) {
        toast({
          title: 'Error',
          description: 'No tier found for the selected program',
          variant: 'destructive'
        });
        return;
      }

      // Process each member
      for (const member of csvData) {
        try {
          await createMember.mutateAsync({
            userId: user?.id || '',
            tierId: member.tierName ?
              tiers.find(t => t.name.toLowerCase() === member.tierName.toLowerCase())?.id || defaultTier.id :
              defaultTier.id,
            loyaltyProgramId: selectedProgram,
            pointsBalance: member.initialPoints,
            metadata: {
              createdVia: 'bulk-import',
              importedAt: new Date().toISOString(),
              email: member.email,
              name: member.name
            }
          });
          successCount++;
        } catch (error) {
          console.error(`Failed to import member ${member.email}:`, error);
          errorCount++;
        }
      }

      // Show results
      if (successCount > 0) {
        toast({
          title: 'Import Complete',
          description: `Successfully imported ${successCount} members${errorCount > 0 ? `, ${errorCount} failed` : ''}`
        });

        // Update checklist if needed
        if (!isChecklistUpdated) {
          await ChecklistService.completeMembersStep();
          setIsChecklistUpdated(true);
        }

        // Reset state

        setCsvData([]);
        setIsBulkImportDialogOpen(false);
      } else {
        toast({
          title: 'Import Failed',
          description: 'Failed to import any members. Please check the data and try again.',
          variant: 'destructive'
        });
      }
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to import members',
        variant: 'destructive'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isAuthLoading || isLoyaltyProgramsLoading || (selectedProgram && (isMembersLoading || isTiersLoading))) {
    return <div>Loading...</div>;
  }

  return (
    <div className="flex-1 flex flex-col h-screen overflow-hidden">
      <header className="flex h-16 shrink-0 items-center gap-2 border-b sticky top-0 bg-background z-10">
        <div className="flex items-center gap-2 px-4">
          <h1 className="text-xl font-semibold">Program Members</h1>
        </div>
      </header>
      <main className="flex-1 overflow-y-auto p-6">
        <div className="max-w-6xl mx-auto space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5 text-primary" />
                Manage Program Members
              </CardTitle>
              <CardDescription>
                Add and manage members for your loyalty program. Members can earn and redeem points based on their tier.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {loyaltyPrograms && loyaltyPrograms.length > 0 ? (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="program">Select Loyalty Program</Label>
                    <Select
                      value={selectedProgram}
                      onValueChange={(value) => {
                        if (value !== selectedProgram) {
                          setIsChangingProgram(true);
                          setSelectedProgram(value);
                          setTimeout(() => setIsChangingProgram(false), 300);
                        }
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select a loyalty program" />
                      </SelectTrigger>
                      <SelectContent>
                        {loyaltyPrograms.map((program: any) => (
                          <SelectItem key={program.id} value={program.id}>
                            {program.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {selectedProgram && (
                    <div className="space-y-6">
                      <div className="flex justify-between items-center">
                        {isChangingProgram ? (
                          <>
                            <div className="flex items-center gap-4">
                              <div className="relative w-full max-w-sm">
                                <div className="h-10 w-64 bg-muted animate-pulse rounded-md"></div>
                              </div>
                              <div className="h-9 w-16 bg-muted animate-pulse rounded-md"></div>
                            </div>
                            <div className="flex gap-2">
                              <div className="h-10 w-32 bg-muted animate-pulse rounded-md"></div>
                              <div className="h-10 w-32 bg-muted animate-pulse rounded-md"></div>
                            </div>
                          </>
                        ) : (
                          <>
                            <div className="flex items-center gap-4">
                              <div className="relative w-full max-w-sm">
                                <Input
                                  placeholder="Search members..."
                                  value={searchQuery}
                                  onChange={(e) => setSearchQuery(e.target.value)}
                                  className="pl-8"
                                />
                                <div className="absolute left-2 top-2.5 text-muted-foreground">
                                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8" /><path d="m21 21-4.3-4.3" /></svg>
                                </div>
                              </div>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setSearchQuery('')}
                                disabled={!searchQuery}
                              >
                                Clear
                              </Button>
                            </div>

                            <div className="flex gap-2">
                              <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
                                <DialogTrigger asChild>
                                  <Button className="gap-2">
                                    <Plus className="h-4 w-4" />
                                    Add Member
                                  </Button>
                                </DialogTrigger>
                                <DialogContent className="sm:max-w-[425px]">
                                  <DialogHeader>
                                    <DialogTitle>Add New Member</DialogTitle>
                                    <DialogDescription>
                                      Add a new member to your loyalty program.
                                    </DialogDescription>
                                  </DialogHeader>

                                  <Form {...form}>
                                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                                      <FormField
                                        control={form.control}
                                        name="name"
                                        render={({ field }) => (
                                          <FormItem>
                                            <FormLabel>Name</FormLabel>
                                            <FormControl>
                                              <Input {...field} />
                                            </FormControl>
                                            <FormDescription>
                                              Enter the member's full name
                                            </FormDescription>
                                            <FormMessage />
                                          </FormItem>
                                        )}
                                      />

                                      <FormField
                                        control={form.control}
                                        name="email"
                                        render={({ field }) => (
                                          <FormItem>
                                            <FormLabel>Email</FormLabel>
                                            <FormControl>
                                              <Input {...field} type="email" />
                                            </FormControl>
                                            <FormDescription>
                                              Enter the member's email address
                                            </FormDescription>
                                            <FormMessage />
                                          </FormItem>
                                        )}
                                      />

                                      <FormField
                                        control={form.control}
                                        name="tierId"
                                        render={({ field }) => (
                                          <FormItem>
                                            <FormLabel>Membership Tier</FormLabel>
                                            {tiers.length > 0 ? (
                                              <Select
                                                onValueChange={field.onChange}
                                                value={field.value || (tiers.length > 0 ? tiers[0].id : '')}
                                              >
                                                <FormControl>
                                                  <SelectTrigger>
                                                    <SelectValue placeholder="Select a tier" />
                                                  </SelectTrigger>
                                                </FormControl>
                                                <SelectContent>
                                                  {tiers.map((tier) => (
                                                    <SelectItem key={tier.id} value={tier.id}>
                                                      {tier.name} (Min: {tier.pointsThreshold} points)
                                                    </SelectItem>
                                                  ))}
                                                </SelectContent>
                                              </Select>
                                            ) : (
                                              <div className="flex flex-col gap-2">
                                                <div className="border rounded-md p-3 bg-muted/20 text-sm text-muted-foreground">
                                                  No tiers available. Please create a tier first.
                                                </div>
                                                <Button
                                                  type="button"
                                                  variant="outline"
                                                  size="sm"
                                                  onClick={() => {
                                                    setIsAddDialogOpen(false);
                                                    router.push('/settings/tiers');
                                                  }}
                                                >
                                                  Create Tier
                                                </Button>
                                              </div>
                                            )}
                                            <FormDescription>
                                              Select the membership tier for this member
                                            </FormDescription>
                                            <FormMessage />
                                          </FormItem>
                                        )}
                                      />

                                      <FormField
                                        control={form.control}
                                        name="initialPoints"
                                        render={({ field }) => (
                                          <FormItem>
                                            <FormLabel>Initial Points</FormLabel>
                                            <FormControl>
                                              <Input
                                                type="number"
                                                {...field}
                                                onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                                                value={field.value}
                                              />
                                            </FormControl>
                                            <FormDescription>
                                              Set initial points balance (optional)
                                            </FormDescription>
                                            <FormMessage />
                                          </FormItem>
                                        )}
                                      />

                                      <DialogFooter>
                                        <Button
                                          type="submit"
                                          disabled={isSubmitting}
                                        >
                                          {isSubmitting ? 'Adding...' : 'Add Member'}
                                        </Button>
                                      </DialogFooter>
                                    </form>
                                  </Form>
                                </DialogContent>
                              </Dialog>

                              <Dialog open={isBulkImportDialogOpen} onOpenChange={setIsBulkImportDialogOpen}>
                                <DialogTrigger asChild>
                                  <Button variant="outline" className="gap-2">
                                    <Upload className="h-4 w-4" />
                                    Bulk Import
                                  </Button>
                                </DialogTrigger>
                                <DialogContent className="sm:max-w-[425px]">
                                  <DialogHeader>
                                    <DialogTitle>Bulk Import Members</DialogTitle>
                                    <DialogDescription>
                                      Upload a CSV file to import multiple members at once.
                                    </DialogDescription>
                                  </DialogHeader>

                                  <div className="space-y-4">
                                    <div className="grid w-full max-w-sm items-center gap-1.5">
                                      <Label htmlFor="csv-file">CSV File</Label>
                                      <Input
                                        id="csv-file"
                                        type="file"
                                        accept=".csv"
                                        onChange={handleCsvUpload}
                                      />
                                      <p className="text-sm text-muted-foreground">
                                        CSV must include columns: email, name, initialPoints<br />
                                        Optional column: tierName (if not provided, lowest tier will be used)
                                      </p>
                                    </div>

                                    {csvData.length > 0 && (
                                      <div className="space-y-2">
                                        <div className="flex items-center gap-2">
                                          <FileText className="h-4 w-4 text-primary" />
                                          <span className="text-sm font-medium">
                                            {csvData.length} members ready to import
                                          </span>
                                        </div>
                                        <Button
                                          onClick={handleBulkImport}
                                          disabled={isSubmitting}
                                          className="w-full"
                                        >
                                          {isSubmitting ? 'Importing...' : 'Import Members'}
                                        </Button>
                                      </div>
                                    )}

                                    <div className="mt-4">
                                      <h4 className="text-sm font-medium mb-2">Sample CSV Format</h4>
                                      <div className="bg-muted p-2 rounded-md text-xs font-mono">
                                        email,name,initialPoints,tierName<br />
                                        john@example.com,John Doe,100,Bronze<br />
                                        jane@example.com,Jane Smith,250,Silver
                                      </div>
                                      <Button
                                        variant="link"
                                        size="sm"
                                        className="mt-2 h-auto p-0"
                                        onClick={() => {
                                          const csv = 'email,name,initialPoints,tierName\njohn@example.com,John Doe,100,Bronze\njane@example.com,Jane Smith,250,Silver';
                                          const blob = new Blob([csv], { type: 'text/csv' });
                                          const url = URL.createObjectURL(blob);
                                          const a = document.createElement('a');
                                          a.href = url;
                                          a.download = 'sample_members.csv';
                                          a.click();
                                          URL.revokeObjectURL(url);
                                        }}
                                      >
                                        <Download className="h-3 w-3 mr-1" />
                                        Download Sample
                                      </Button>
                                    </div>
                                  </div>
                                </DialogContent>
                              </Dialog>
                            </div>
                          </>
                        )}
                      </div>

                      {(isMembersLoading || isChangingProgram) ? (
                        <div className="border rounded-md">
                          <Table>
                            <TableHeader>
                              <TableRow>
                                <TableHead>Name</TableHead>
                                <TableHead>Email</TableHead>
                                <TableHead>Tier</TableHead>
                                <TableHead>Points</TableHead>
                                <TableHead>Joined</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {/* Skeleton rows */}
                              {Array(5).fill(0).map((_, index) => (
                                <TableRow key={`skeleton-${index}`}>
                                  <TableCell>
                                    <div className="h-5 w-24 bg-muted animate-pulse rounded"></div>
                                  </TableCell>
                                  <TableCell>
                                    <div className="h-5 w-32 bg-muted animate-pulse rounded"></div>
                                  </TableCell>
                                  <TableCell>
                                    <div className="h-5 w-16 bg-muted animate-pulse rounded"></div>
                                  </TableCell>
                                  <TableCell>
                                    <div className="h-5 w-12 bg-muted animate-pulse rounded"></div>
                                  </TableCell>
                                  <TableCell>
                                    <div className="h-5 w-20 bg-muted animate-pulse rounded"></div>
                                  </TableCell>
                                  <TableCell className="text-right">
                                    <div className="flex justify-end gap-2">
                                      <div className="h-8 w-8 bg-muted animate-pulse rounded"></div>
                                      <div className="h-8 w-8 bg-muted animate-pulse rounded"></div>
                                    </div>
                                  </TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        </div>
                      ) : filteredMembers.length > 0 ? (
                        <div className="border rounded-md">
                          <Table>
                            <TableHeader>
                              <TableRow>
                                <TableHead>Name</TableHead>
                                <TableHead>Email</TableHead>
                                <TableHead>Tier</TableHead>
                                <TableHead>Points</TableHead>
                                <TableHead>Joined</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {filteredMembers.map((member) => (
                                <TableRow key={member.id}>
                                  <TableCell className="font-medium">{member.user.name || 'N/A'}</TableCell>
                                  <TableCell>{member.user.email}</TableCell>
                                  <TableCell>
                                    <Badge variant="outline">{member.tier.name}</Badge>
                                  </TableCell>
                                  <TableCell>{member.pointsBalance}</TableCell>
                                  <TableCell>{new Date(member.joinedAt).toLocaleDateString()}</TableCell>
                                  <TableCell className="text-right">
                                    <div className="flex justify-end gap-2">
                                      <Button variant="ghost" size="icon">
                                        <Edit className="h-4 w-4" />
                                      </Button>
                                      <Button
                                        variant="ghost"
                                        size="icon"
                                        onClick={() => handleDeleteMember(member.id)}
                                      >
                                        <Trash2 className="h-4 w-4" />
                                      </Button>
                                    </div>
                                  </TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        </div>
                      ) : (
                        <Alert>
                          <AlertCircle className="h-4 w-4" />
                          <AlertTitle>No members yet</AlertTitle>
                          <AlertDescription>
                            Add members to your loyalty program to get started.
                          </AlertDescription>
                        </Alert>
                      )}
                    </div>
                  )}
                </>
              ) : (
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>No loyalty programs found</AlertTitle>
                  <AlertDescription>
                    You need to create a loyalty program before you can add members.
                  </AlertDescription>
                </Alert>
              )}
            </CardContent>
            <CardFooter className="flex justify-between">
              <Button
                variant="outline"
                onClick={() => router.push('/dashboard')}
              >
                Back to Dashboard
              </Button>

              {members.length > 0 && (
                <Button
                  onClick={() => router.push('/settings/test')}
                  className="gap-2"
                >
                  <Rocket className="h-4 w-4" />
                  Test Your Program
                </Button>
              )}
            </CardFooter>
          </Card>

          <div className="bg-muted/30 border border-border/40 rounded-lg p-4">
            <div className="mb-3">
              <h3 className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <AlertCircle className="h-4 w-4" />
                Member Management Guidelines
              </h3>
            </div>
            <div className="space-y-4 text-xs">
              <div className="space-y-1.5">
                <h4 className="font-medium flex items-center gap-1.5 text-muted-foreground">
                  <div className="bg-muted p-0.5 rounded-full">
                    <Users className="h-3 w-3" />
                  </div>
                  Add Program Members
                </h4>
                <p className="text-muted-foreground/80">
                  Add members to your loyalty program to start testing. Each member can earn and redeem points
                  based on their tier and activity.
                </p>
              </div>

              <Separator className="bg-border/50" />

              <div className="space-y-1.5">
                <h4 className="font-medium flex items-center gap-1.5 text-muted-foreground">
                  <div className="bg-muted p-0.5 rounded-full">
                    <Gift className="h-3 w-3" />
                  </div>
                  Assign Tiers
                </h4>
                <p className="text-muted-foreground/80">
                  Assign members to different tiers to test tier-specific benefits and rewards.
                  Members can move between tiers as they earn more points.
                </p>
              </div>

              <Separator className="bg-border/50" />

              <div className="space-y-1.5">
                <h4 className="font-medium flex items-center gap-1.5 text-muted-foreground">
                  <div className="bg-muted p-0.5 rounded-full">
                    <CheckCircle2 className="h-3 w-3" />
                  </div>
                  Test Transactions
                </h4>
                <p className="text-muted-foreground/80">
                  After adding members, you can test transactions to see how points are earned and redeemed.
                  This helps verify that your loyalty program is working as expected.
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
