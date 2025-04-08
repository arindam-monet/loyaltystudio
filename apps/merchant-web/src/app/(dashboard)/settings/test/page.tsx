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
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
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
  Textarea,
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  Badge,
  Separator,
} from '@loyaltystudio/ui';
import {
  Rocket,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  Gift,
  CreditCard,
  RefreshCw,
  ChevronRight,
  CheckCircle,
  Users,
} from 'lucide-react';
import { AppSidebar } from '@/components/app-sidebar';
import { SidebarProvider } from '@loyaltystudio/ui';
// Auth guard is now handled at the dashboard layout level
import { useLoyaltyPrograms } from '@/hooks/use-loyalty-programs';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { apiClient } from '@/lib/api-client';
import { ChecklistService } from '@/services/checklist-service';
import { useProgramMembers } from '@/hooks/use-program-members';
import { toast } from '@loyaltystudio/ui';

// Define the form schema for transactions
const transactionSchema = z.object({
  amount: z.number().min(1, 'Amount must be at least 1'),
  type: z.enum(['EARN', 'REDEEM', 'ADJUST']),
  reason: z.string().min(3, 'Reason must be at least 3 characters'),
  metadata: z.record(z.any()).optional(),
});

type Transaction = z.infer<typeof transactionSchema>;

// Define the test result type
type TestResult = {
  id: string;
  amount: number;
  type: string;
  reason: string;
  metadata?: Record<string, any>;
  createdAt: string;
};

export default function TestProgramPage() {
  const router = useRouter();
  // Auth guard is now handled at the dashboard layout level
  const { loyaltyPrograms, isLoading: isLoyaltyProgramsLoading } = useLoyaltyPrograms();
  const [selectedProgram, setSelectedProgram] = useState<string>('');
  const [testResults, setTestResults] = useState<TestResult[]>([]);
  const [isTestCompleted, setIsTestCompleted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [pointsBalance, setPointsBalance] = useState(0);
  const [isLoadingBalance, setIsLoadingBalance] = useState(false);
  const [isProgramMember, setIsProgramMember] = useState(false);
  const [isJoiningProgram, setIsJoiningProgram] = useState(false);

  const form = useForm<Transaction>({
    resolver: zodResolver(transactionSchema),
    defaultValues: {
      amount: 100,
      type: 'EARN',
      reason: 'Test purchase',
      metadata: { test: true },
    },
  });

  // Fetch the user's points balance
  const fetchPointsBalance = async () => {
    if (!selectedProgram) return;

    setIsLoadingBalance(true);
    try {
      const response = await apiClient.get(`/points/balance`);
      if (response.status === 200) {
        setPointsBalance(response.data.balance);
      }
    } catch (error) {
      console.error('Failed to fetch points balance:', error);
    } finally {
      setIsLoadingBalance(false);
    }
  };

  // Fetch transaction history
  const fetchTransactionHistory = async () => {
    if (!selectedProgram) return;

    try {
      const response = await apiClient.get(`/points/transactions`);
      if (response.status === 200) {
        // Filter only test transactions
        const testTransactions = response.data.filter(
          (tx: any) => tx.metadata?.test === true
        );
        setTestResults(testTransactions);
      }
    } catch (error) {
      console.error('Failed to fetch transaction history:', error);
    }
  };

  // Check if user is a program member
  const checkProgramMembership = async () => {
    if (!selectedProgram) return;

    try {
      // Call the API to check membership
      const response = await apiClient.get(`/program-members/check`, {
        params: { loyaltyProgramId: selectedProgram }
      });
      setIsProgramMember(response.data.isMember);
    } catch (error) {
      console.error('Failed to check program membership:', error);
      setIsProgramMember(false);
    }
  };

  // Join the loyalty program
  const joinProgram = async () => {
    if (!selectedProgram) return;

    setIsJoiningProgram(true);
    try {
      // Call the API to join the program
      await apiClient.post('/program-members', {
        loyaltyProgramId: selectedProgram,
        // Get the lowest tier for the program
        tierId: 'default', // API should handle finding the default tier
        metadata: { joinedVia: 'test-interface' }
      });

      toast({ title: 'Success', description: 'Successfully joined the loyalty program' });
      setIsProgramMember(true);
    } catch (error: any) {
      console.error('Failed to join program:', error);
      toast({ title: 'Error', description: error.response?.data?.error || 'Failed to join the loyalty program', variant: 'destructive' });
    } finally {
      setIsJoiningProgram(false);
    }
  };

  // Handle program selection
  useEffect(() => {
    if (selectedProgram) {
      fetchPointsBalance();
      fetchTransactionHistory();
      checkProgramMembership();
    }
  }, [selectedProgram]);

  // Create a test transaction
  const onSubmit = async (data: Transaction) => {
    if (!selectedProgram) {
      toast({ title: 'Error', description: 'Please select a loyalty program first', variant: 'destructive' });
      return;
    }

    if (!isProgramMember) {
      toast({ title: 'Error', description: 'You need to join the loyalty program first', variant: 'destructive' });
      return;
    }

    setIsSubmitting(true);
    try {
      // Ensure metadata includes test flag and program ID
      const metadata = {
        ...data.metadata,
        test: true,
        loyaltyProgramId: selectedProgram,
        source: 'test-interface'
      };

      // Adjust amount for REDEEM transactions
      if (data.type === 'REDEEM' && data.amount > 0) {
        data.amount = -data.amount; // Make it negative for redemptions
      }

      const response = await apiClient.post('/points/transaction', {
        ...data,
        metadata,
      });

      if (response.status === 201) {
        toast({ title: 'Success', description: `${data.type === 'EARN' ? 'Earned' : 'Redeemed'} points successfully` });
        // Refresh data
        fetchPointsBalance();
        fetchTransactionHistory();
      }
    } catch (error: any) {
      toast({ title: 'Error', description: error.response?.data?.error || 'Failed to create transaction', variant: 'destructive' });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Mark test as completed
  const completeTest = async () => {
    try {
      // Update the checklist status using the service
      await ChecklistService.completeTestStep();
      setIsTestCompleted(true);

      toast({ title: 'Success', description: 'Test completed successfully! Your checklist has been updated.' });

      // Navigate back to dashboard after a short delay
      setTimeout(() => {
        router.push('/dashboard');
      }, 2000);
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to mark test as completed', variant: 'destructive' });
    }
  };

  if (isLoyaltyProgramsLoading) {
    return <div>Loading...</div>;
  }

  return (

    <div className="flex-1 flex flex-col h-screen overflow-hidden">
      <header className="flex h-16 shrink-0 items-center gap-2 border-b sticky top-0 bg-background z-10">
        <div className="flex items-center gap-2 px-4">
          <h1 className="text-xl font-semibold">Test Your Loyalty Program</h1>
        </div>
      </header>
      <main className="flex-1 overflow-y-auto p-6">
        <div className="max-w-4xl mx-auto space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Rocket className="h-5 w-5 text-primary" />
                Test Your Loyalty Program
              </CardTitle>
              <CardDescription>
                Verify your loyalty program setup by creating test transactions and checking if points are calculated correctly.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {loyaltyPrograms && loyaltyPrograms.length > 0 ? (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="program">Select Loyalty Program</Label>
                    <Select
                      value={selectedProgram}
                      onValueChange={setSelectedProgram}
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
                    <>
                      {!isProgramMember ? (
                        <div className="p-6 border rounded-lg bg-muted/20 space-y-4">
                          <div className="flex items-center gap-2">
                            <AlertCircle className="h-5 w-5 text-amber-500" />
                            <h3 className="font-medium">Program Membership Required</h3>
                          </div>
                          <p className="text-sm text-muted-foreground">
                            You need to be a member of this loyalty program to create test transactions.
                            Click the button below to join the program with the default tier.
                          </p>
                          <Button
                            onClick={joinProgram}
                            disabled={isJoiningProgram}
                            className="w-full"
                          >
                            {isJoiningProgram ? 'Joining...' : 'Join This Loyalty Program'}
                          </Button>
                        </div>
                      ) : (
                        <Tabs defaultValue="create">
                          <TabsList className="grid w-full grid-cols-2">
                            <TabsTrigger value="create">Create Transaction</TabsTrigger>
                            <TabsTrigger value="results">Test Results</TabsTrigger>
                          </TabsList>
                          <TabsContent value="create" className="space-y-4 pt-4">
                            <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
                              <div>
                                <h3 className="font-medium">Current Points Balance</h3>
                                <p className="text-2xl font-bold">{pointsBalance}</p>
                              </div>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={fetchPointsBalance}
                                disabled={isLoadingBalance}
                              >
                                <RefreshCw className="h-4 w-4 mr-2" />
                                Refresh
                              </Button>
                            </div>

                            <Form {...form}>
                              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                                <FormField
                                  control={form.control}
                                  name="type"
                                  render={({ field }) => (
                                    <FormItem>
                                      <FormLabel>Transaction Type</FormLabel>
                                      <Select
                                        onValueChange={field.onChange}
                                        defaultValue={field.value}
                                      >
                                        <FormControl>
                                          <SelectTrigger>
                                            <SelectValue placeholder="Select transaction type" />
                                          </SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                          <SelectItem value="EARN">Earn Points</SelectItem>
                                          <SelectItem value="REDEEM">Redeem Points</SelectItem>
                                          <SelectItem value="ADJUST">Adjust Points</SelectItem>
                                        </SelectContent>
                                      </Select>
                                      <FormDescription>
                                        {field.value === 'EARN'
                                          ? 'Simulate a customer earning points'
                                          : field.value === 'REDEEM'
                                            ? 'Simulate a customer redeeming points for rewards'
                                            : 'Manually adjust points balance'}
                                      </FormDescription>
                                      <FormMessage />
                                    </FormItem>
                                  )}
                                />

                                <FormField
                                  control={form.control}
                                  name="amount"
                                  render={({ field }) => (
                                    <FormItem>
                                      <FormLabel>
                                        {field.value < 0 ? 'Points to Redeem' : 'Points to Earn'}
                                      </FormLabel>
                                      <FormControl>
                                        <Input
                                          type="number"
                                          {...field}
                                          onChange={(e) => {
                                            const value = form.getValues('type') === 'REDEEM'
                                              ? -Math.abs(parseInt(e.target.value) || 0)
                                              : Math.abs(parseInt(e.target.value) || 0);
                                            field.onChange(value);
                                          }}
                                          value={Math.abs(field.value)}
                                        />
                                      </FormControl>
                                      <FormDescription>
                                        {form.getValues('type') === 'REDEEM'
                                          ? 'Enter the number of points to redeem (will be converted to negative)'
                                          : 'Enter the number of points to earn'}
                                      </FormDescription>
                                      <FormMessage />
                                    </FormItem>
                                  )}
                                />

                                <FormField
                                  control={form.control}
                                  name="reason"
                                  render={({ field }) => (
                                    <FormItem>
                                      <FormLabel>Reason</FormLabel>
                                      <FormControl>
                                        <Input {...field} />
                                      </FormControl>
                                      <FormDescription>
                                        Describe the reason for this transaction
                                      </FormDescription>
                                      <FormMessage />
                                    </FormItem>
                                  )}
                                />

                                <Button
                                  type="submit"
                                  className="w-full"
                                  disabled={isSubmitting}
                                >
                                  {isSubmitting ? 'Processing...' : 'Create Test Transaction'}
                                </Button>
                              </form>
                            </Form>
                          </TabsContent>
                          <TabsContent value="results" className="space-y-4 pt-4">
                            {testResults.length > 0 ? (
                              <div className="space-y-4">
                                <div className="flex justify-between items-center">
                                  <h3 className="font-medium">Transaction History</h3>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={fetchTransactionHistory}
                                  >
                                    <RefreshCw className="h-4 w-4 mr-2" />
                                    Refresh
                                  </Button>
                                </div>
                                <div className="space-y-3">
                                  {testResults.map((result) => (
                                    <div
                                      key={result.id}
                                      className="p-4 border rounded-lg flex justify-between items-center"
                                    >
                                      <div>
                                        <div className="flex items-center gap-2">
                                          <Badge variant={result.type === 'EARN' ? 'default' : 'destructive'}>
                                            {result.type}
                                          </Badge>
                                          <span className="font-medium">{result.reason}</span>
                                        </div>
                                        <div className="text-sm text-muted-foreground">
                                          {new Date(result.createdAt).toLocaleString()}
                                        </div>
                                      </div>
                                      <div className="text-xl font-bold">
                                        {result.amount > 0 ? '+' : ''}{result.amount}
                                      </div>
                                    </div>
                                  ))}
                                </div>

                                {testResults.length >= 2 && !isTestCompleted && (
                                  <Alert className="bg-green-50 border-green-200">
                                    <CheckCircle className="h-4 w-4 text-green-600" />
                                    <AlertTitle>Ready to complete</AlertTitle>
                                    <AlertDescription>
                                      You've successfully tested your loyalty program with multiple transactions.
                                      Mark this step as complete to update your checklist.
                                    </AlertDescription>
                                  </Alert>
                                )}
                              </div>
                            ) : (
                              <Alert>
                                <AlertCircle className="h-4 w-4" />
                                <AlertTitle>No test transactions yet</AlertTitle>
                                <AlertDescription>
                                  Create some test transactions to see the results here.
                                </AlertDescription>
                              </Alert>
                            )}
                          </TabsContent>
                        </Tabs>
                      )}
                    </>
                  )}
                </>
              ) : (
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>No loyalty programs found</AlertTitle>
                  <AlertDescription>
                    You need to create a loyalty program before you can test it.
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

              {testResults.length >= 2 && !isTestCompleted && (
                <Button
                  onClick={completeTest}
                  className="gap-2"
                >
                  <CheckCircle2 className="h-4 w-4" />
                  Mark Test as Complete
                </Button>
              )}
            </CardFooter>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Testing Guidelines</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <h3 className="font-medium flex items-center gap-2">
                  <div className="bg-primary/10 p-1 rounded-full">
                    <Users className="h-4 w-4 text-primary" />
                  </div>
                  Join the Loyalty Program
                </h3>
                <p className="text-sm text-muted-foreground">
                  Before testing transactions, you need to join the loyalty program.
                  This ensures that points are calculated correctly based on your membership tier.
                </p>
              </div>

              <Separator />
              <div className="space-y-2">
                <h3 className="font-medium flex items-center gap-2">
                  <div className="bg-primary/10 p-1 rounded-full">
                    <CreditCard className="h-4 w-4 text-primary" />
                  </div>
                  Test Earning Points
                </h3>
                <p className="text-sm text-muted-foreground">
                  Create a transaction with type "EARN" to simulate a customer earning points.
                  This will help you verify that your points calculation rules are working correctly.
                </p>
              </div>

              <Separator />

              <div className="space-y-2">
                <h3 className="font-medium flex items-center gap-2">
                  <div className="bg-primary/10 p-1 rounded-full">
                    <Gift className="h-4 w-4 text-primary" />
                  </div>
                  Test Redeeming Points
                </h3>
                <p className="text-sm text-muted-foreground">
                  Create a transaction with type "REDEEM" to simulate a customer redeeming points for rewards.
                  This will help you verify that your redemption process is working correctly.
                </p>
              </div>

              <Separator />

              <div className="space-y-2">
                <h3 className="font-medium flex items-center gap-2">
                  <div className="bg-primary/10 p-1 rounded-full">
                    <CheckCircle2 className="h-4 w-4 text-primary" />
                  </div>
                  Complete the Test
                </h3>
                <p className="text-sm text-muted-foreground">
                  After creating at least one earn and one redeem transaction, mark the test as complete
                  to update your checklist and proceed with the next steps.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>

  );
}
