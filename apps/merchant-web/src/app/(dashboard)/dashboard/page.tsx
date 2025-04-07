'use client';

import { useRouter } from 'next/navigation';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Button,
  Alert,
  AlertTitle,
  AlertDescription,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@loyaltystudio/ui';
import {
  Building2,
  Gift,
  Users,
  Code,
  CheckCircle2,
  Circle,
  ChevronRight,
  AlertCircle,
  TrendingUp,
  UserPlus,
  Wallet,
  BarChart3,
} from 'lucide-react';
import { useAuthStore } from '@/lib/stores/auth-store';
import { useAuthGuard } from '@/hooks/use-auth-guard';
import { useMerchants } from '@/hooks/use-merchants';
import { useLoyaltyPrograms } from '@/hooks/use-loyalty-programs';
import { LoadingScreen } from '@/components/loading-screen';
import { MerchantOnboardingDialog } from '@/components/merchant-onboarding-dialog';
import { useState, useEffect } from 'react';
import { ChecklistService } from '@/services/checklist-service';

type ChecklistItem = {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  completed: boolean;
  action?: {
    label: string;
    href: string;
  };
  required: boolean;
};

const CHECKLIST_CONFIG = [
  {
    id: 'merchant',
    title: 'Create Merchant',
    description: 'Set up your merchant profile with business details and branding',
    icon: <Building2 className="w-4 h-4" />,
    action: {
      label: 'Add Merchant',
      href: '#',
    },
    required: true,
  },
  {
    id: 'program',
    title: 'Create Loyalty Program',
    description: 'Set up your first loyalty program with points, rewards, and rules',
    icon: <Gift className="w-4 h-4" />,
    action: {
      label: 'Create Program',
      href: '/loyalty-programs',
    },
    required: true,
  },
  {
    id: 'members',
    title: 'Add Program Members',
    description: 'Add members to your loyalty program to start testing',
    icon: <Users className="w-4 h-4" />,
    action: {
      label: 'Add Members',
      href: '/program-members',
    },
    required: true,
  },
  {
    id: 'integration',
    title: 'Integrate API',
    description: 'Integrate the Loyalty Studio API with your systems',
    icon: <Code className="w-4 h-4" />,
    action: {
      label: 'View API Docs',
      href: '/api-docs',
    },
    required: false,
  },
];

export default function DashboardPage() {
  const router = useRouter();
  const { user } = useAuthStore();
  const { isLoading: isAuthLoading } = useAuthGuard();
  const { data: merchants, isLoading: isMerchantsLoading, refetch } = useMerchants();
  const { loyaltyPrograms, isLoading: isLoyaltyProgramsLoading } = useLoyaltyPrograms();
  const [isOnboardingOpen, setIsOnboardingOpen] = useState(false);
  const [checklistItems, setChecklistItems] = useState<ChecklistItem[]>([]);

  const fetchChecklistStatus = async () => {
    try {
      // Get checklist status from service
      const status = await ChecklistService.getStatus();

      // Override merchant and program status based on actual data
      status.merchant = Boolean(merchants && merchants.length > 0);
      status.program = Boolean(loyaltyPrograms && loyaltyPrograms.length > 0);

      // Update checklist items with their completion status
      const updatedItems = CHECKLIST_CONFIG.map(item => ({
        ...item,
        completed: Boolean(status[item.id as keyof typeof status]),
      }));

      setChecklistItems(updatedItems);
    } catch (error) {
      console.error('Failed to fetch checklist status:', error);
      // Fallback to basic status if API fails
      setChecklistItems(CHECKLIST_CONFIG.map(item => ({
        ...item,
        completed: item.id === 'merchant' ? Boolean(merchants && merchants.length > 0) : false,
      })));
    }
  };

  useEffect(() => {
    fetchChecklistStatus();
  }, [merchants, loyaltyPrograms]);

  // Calculate completed required items
  const completedRequiredItems = checklistItems.filter(item => item.required && item.completed).length;
  const totalRequiredItems = checklistItems.filter(item => item.required).length;
  const isNewUser = completedRequiredItems === 0;

  // If not authenticated, the useAuthGuard hook will handle the redirect
  if (!user) {
    return null;
  }

  const handleCreateMerchant = () => {
    setIsOnboardingOpen(true);
  };

  const handleOnboardingSuccess = () => {
    refetch();
  };

  const handleLoyaltyProgramSuccess = () => {
    // Refetch checklist status after creating a loyalty program
    fetchChecklistStatus();
  };

  const renderEmptyState = () => {
    // Special emphasis if no merchants exist
    const noMerchants = merchants && merchants.length === 0;
    
    return (
      <div className="flex flex-col gap-8">
        <Alert className={noMerchants ? "border-primary bg-primary/5" : ""}>
          <AlertCircle className={`h-4 w-4 ${noMerchants ? "text-primary" : ""}`} />
          <AlertTitle>{noMerchants ? "Let's get started!" : "Welcome to your dashboard!"}</AlertTitle>
          <AlertDescription>
            {noMerchants 
              ? "Create your first merchant to start building your loyalty program." 
              : "Complete the required steps to set up your loyalty program and start seeing data."}
          </AlertDescription>
        </Alert>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">Getting Started Checklist</CardTitle>
              <div className="text-sm text-muted-foreground">
                {completedRequiredItems}/{totalRequiredItems} required steps completed
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {checklistItems.map((item) => {
              // Check if this is the merchant item and no merchants exist
              const isMerchantItem = item.id === 'merchant';
              const noMerchants = merchants && merchants.length === 0;
              const isHighlighted = isMerchantItem && noMerchants;
              
              return (
                <div key={item.id} className={`flex items-start gap-4 ${isHighlighted ? 'p-3 border border-primary/30 rounded-md bg-primary/5' : ''}`}>
                  <div className={`p-2 rounded-full ${item.completed ? 'bg-green-100' : isHighlighted ? 'bg-primary/20' : 'bg-primary/10'}`}>
                    {item.completed ? (
                      <CheckCircle2 className="w-4 h-4 text-green-600" />
                    ) : (
                      <Circle className={`w-4 h-4 ${isHighlighted ? 'text-primary font-bold' : 'text-primary'}`} />
                    )}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <h3 className={`font-medium ${isHighlighted ? 'text-primary' : ''}`}>
                        {item.title}
                        {!item.required && (
                          <span className="ml-2 text-xs text-muted-foreground">(Optional)</span>
                        )}
                      </h3>
                      {item.action && !item.completed && (
                        <>
                          {item.id === 'merchant' ? (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-7"
                              onClick={handleCreateMerchant}
                            >
                              {item.action.label}
                              <ChevronRight className="w-4 h-4 ml-1" />
                            </Button>
                          ) : item.id === 'program' ? (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-7"
                              onClick={() => router.push('/loyalty-programs')}
                              disabled={!merchants || merchants.length === 0}
                            >
                              {item.action.label}
                              <ChevronRight className="w-4 h-4 ml-1" />
                            </Button>
                          ) : (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-7"
                              onClick={() => router.push(item.action!.href)}
                            >
                              {item.action.label}
                              <ChevronRight className="w-4 h-4 ml-1" />
                            </Button>
                          )}
                        </>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground">{item.description}</p>
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>
      </div>
    );
  };

  const renderDashboard = () => {
    return (
      <div className="grid gap-4">
        {/* Show a reminder if some checklist items are pending */}
        {completedRequiredItems < totalRequiredItems && (
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Setup in progress</AlertTitle>
            <AlertDescription>
              Complete the remaining {totalRequiredItems - completedRequiredItems} setup tasks to fully configure your loyalty program.
            </AlertDescription>
          </Alert>
        )}

        {/* Metrics will only show up once integration is complete */}
        {checklistItems.find(item => item.id === 'integration')?.completed && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Total Revenue
                </CardTitle>
                <TrendingUp className="w-4 h-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">$0.00</div>
                <div className="text-xs text-muted-foreground mt-1">
                  Start tracking revenue with completed transactions
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Active Members
                </CardTitle>
                <UserPlus className="w-4 h-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">0</div>
                <div className="text-xs text-muted-foreground mt-1">
                  Add members to your loyalty program
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Points Issued
                </CardTitle>
                <Wallet className="w-4 h-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">0</div>
                <div className="text-xs text-muted-foreground mt-1">
                  No points have been issued yet
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Redemption Rate
                </CardTitle>
                <BarChart3 className="w-4 h-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">0%</div>
                <div className="text-xs text-muted-foreground mt-1">
                  No rewards have been redeemed yet
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Always show the checklist until everything is complete */}
        {completedRequiredItems < totalRequiredItems && (
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">Setup Progress</CardTitle>
                <div className="text-sm text-muted-foreground">
                  {completedRequiredItems}/{totalRequiredItems} required steps completed
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              {checklistItems.map((item) => (
                <div key={item.id} className="flex items-start gap-4">
                  <div className={`p-2 rounded-full ${item.completed ? 'bg-green-100' : 'bg-primary/10'}`}>
                    {item.completed ? (
                      <CheckCircle2 className="w-4 h-4 text-green-600" />
                    ) : (
                      <Circle className="w-4 h-4 text-primary" />
                    )}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <h3 className="font-medium">
                        {item.title}
                        {!item.required && (
                          <span className="ml-2 text-xs text-muted-foreground">(Optional)</span>
                        )}
                      </h3>
                      {item.action && !item.completed && (
                        <>
                          {item.id === 'merchant' ? (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-7"
                              onClick={handleCreateMerchant}
                            >
                              {item.action.label}
                              <ChevronRight className="w-4 h-4 ml-1" />
                            </Button>
                          ) : (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-7"
                              onClick={() => router.push(item.action!.href)}
                              disabled={item.id === 'program' && (!merchants || merchants.length === 0)}
                            >
                              {item.action.label}
                              <ChevronRight className="w-4 h-4 ml-1" />
                            </Button>
                          )}
                        </>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground">{item.description}</p>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        {/* Show tabs for different views once the basic setup is complete */}
        {completedRequiredItems === totalRequiredItems && (
          <Tabs defaultValue="overview">
            <TabsList>
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="members">Members</TabsTrigger>
              <TabsTrigger value="transactions">Transactions</TabsTrigger>
              <TabsTrigger value="rewards">Rewards</TabsTrigger>
            </TabsList>
            <TabsContent value="overview" className="mt-4">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">
                      Total Revenue
                    </CardTitle>
                    <TrendingUp className="w-4 h-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">$0.00</div>
                    <div className="text-xs text-muted-foreground mt-1">
                      Start tracking revenue with completed transactions
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">
                      Active Members
                    </CardTitle>
                    <UserPlus className="w-4 h-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">0</div>
                    <div className="text-xs text-muted-foreground mt-1">
                      Add members to your loyalty program
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">
                      Points Issued
                    </CardTitle>
                    <Wallet className="w-4 h-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">0</div>
                    <div className="text-xs text-muted-foreground mt-1">
                      No points have been issued yet
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">
                      Redemption Rate
                    </CardTitle>
                    <BarChart3 className="w-4 h-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">0%</div>
                    <div className="text-xs text-muted-foreground mt-1">
                      No rewards have been redeemed yet
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
            <TabsContent value="members" className="mt-4">
              <Card>
                <CardHeader>
                  <CardTitle>Program Members</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">No members yet. Add members to your loyalty program.</p>
                  <Button className="mt-4" onClick={() => router.push('/program-members')}>
                    Manage Members
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>
            <TabsContent value="transactions" className="mt-4">
              <Card>
                <CardHeader>
                  <CardTitle>Recent Transactions</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">No transactions yet. Integrate with your POS system to start tracking transactions.</p>
                  <Button className="mt-4" onClick={() => router.push('/transactions')}>
                    View Transactions
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>
            <TabsContent value="rewards" className="mt-4">
              <Card>
                <CardHeader>
                  <CardTitle>Available Rewards</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">No rewards configured yet. Add rewards to your loyalty program.</p>
                  <Button className="mt-4" onClick={() => router.push('/rewards')}>
                    Manage Rewards
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        )}
      </div>
    );
  };

  if (isAuthLoading || isMerchantsLoading || isLoyaltyProgramsLoading) {
    return <LoadingScreen />;
  }

  return (
    <div className="container py-6 space-y-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">
          Welcome to your Loyalty Studio dashboard
        </p>
      </div>

      {isNewUser ? renderEmptyState() : renderDashboard()}

      <MerchantOnboardingDialog
        open={isOnboardingOpen}
        onOpenChange={setIsOnboardingOpen}
        onSuccess={handleOnboardingSuccess}
      />
    </div>
  );
}
