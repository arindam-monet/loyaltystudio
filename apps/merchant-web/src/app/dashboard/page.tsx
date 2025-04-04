'use client';

import { useAuthGuard } from '@/hooks/use-auth-guard';
import { useAuthStore } from '@/lib/stores/auth-store';
import { useRouter } from 'next/navigation';
import { AppSidebar } from '@/components/app-sidebar';
import { useMerchants } from '@/hooks/use-merchants';
import { useLoyaltyPrograms } from '@/hooks/use-loyalty-programs';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbList,
  BreadcrumbPage,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Button,
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
  Separator,
  Alert,
  AlertDescription,
  AlertTitle,
} from '@loyaltystudio/ui';
import {
  Building2,
  ArrowRight,
  CheckCircle2,
  Circle,
  Users,
  Settings,
  Globe,
  Briefcase,
  TrendingUp,
  Gift,
  CreditCard,
  ChevronRight,
  AlertCircle,
  Rocket,
} from 'lucide-react';
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
    id: 'test',
    title: 'Test Your Program',
    description: 'Verify your setup with test transactions and rewards',
    icon: <Rocket className="w-4 h-4" />,
    action: {
      label: 'Test Now',
      href: '/settings/test',
    },
    required: true,
  },
  {
    id: 'integration',
    title: 'Set Up Integration',
    description: 'Connect your business system via API or available integrations',
    icon: <Globe className="w-4 h-4" />,
    action: {
      label: 'Connect',
      href: '/settings/integrations',
    },
    required: true,
  },
  {
    id: 'team',
    title: 'Invite Team Members',
    description: 'Add your team members and assign roles (optional)',
    icon: <Users className="w-4 h-4" />,
    action: {
      label: 'Invite',
      href: '/settings/team',
    },
    required: false,
  },
];

// Mock data for the chart
const visitorData = [
  { date: 'Jun 1', visitors: 100, customers: 80 },
  { date: 'Jun 3', visitors: 120, customers: 90 },
  { date: 'Jun 5', visitors: 140, customers: 100 },
  { date: 'Jun 7', visitors: 160, customers: 120 },
  { date: 'Jun 9', visitors: 180, customers: 140 },
  { date: 'Jun 11', visitors: 200, customers: 160 },
  { date: 'Jun 13', visitors: 220, customers: 180 },
  { date: 'Jun 15', visitors: 240, customers: 200 },
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
    return (
      <div className="flex flex-col gap-8">
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Welcome to your dashboard!</AlertTitle>
          <AlertDescription>
            Complete the required steps to set up your loyalty program and start seeing data.
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
                        ) : item.id === 'program' ? (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7"
                            onClick={() => router.push('/loyalty-programs')}
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
            ))}
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
                <Users className="w-4 h-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">0</div>
                <div className="text-xs text-muted-foreground mt-1">
                  Members will appear as they join your program
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Points Issued
                </CardTitle>
                <Gift className="w-4 h-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">0</div>
                <div className="text-xs text-muted-foreground mt-1">
                  Points will accumulate as members earn them
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Rewards Claimed
                </CardTitle>
                <Gift className="w-4 h-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">0</div>
                <div className="text-xs text-muted-foreground mt-1">
                  Track as members redeem their points
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
                          ) : item.id === 'program' ? (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-7"
                              onClick={() => router.push('/loyalty-programs')}
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
              ))}
            </CardContent>
          </Card>
        )}
      </div>
    );
  };

  return (
    <SidebarProvider defaultOpen>
      <div className="flex h-screen overflow-hidden w-full">
        <AppSidebar />
        <div className="flex-1 flex flex-col h-screen overflow-hidden">
          <header className="flex h-16 shrink-0 items-center gap-2 border-b sticky top-0 bg-background z-10">
            <div className="flex items-center gap-2 px-4">
              <SidebarTrigger className="-ml-1" />
              <Separator orientation="vertical" className="mr-2 h-4" />
              <Breadcrumb>
                <BreadcrumbList>
                  <BreadcrumbItem>
                    <BreadcrumbPage>Dashboard</BreadcrumbPage>
                  </BreadcrumbItem>
                </BreadcrumbList>
              </Breadcrumb>
            </div>
          </header>
          <main className="flex-1 overflow-y-auto">
            <div className="flex flex-col gap-4 p-4">
              <div className="mb-8">
                <h1 className="text-3xl font-bold">Welcome, {user?.name}</h1>
                <p className="text-muted-foreground">
                  {isNewUser
                    ? "Let's get started with setting up your loyalty program"
                    : completedRequiredItems < totalRequiredItems
                      ? "Continue setting up your loyalty program"
                      : "Here's how your loyalty program is performing"
                  }
                </p>
              </div>

              {isNewUser ? renderEmptyState() : renderDashboard()}
            </div>
          </main>
        </div>
      </div>
      <MerchantOnboardingDialog
        open={isOnboardingOpen}
        onOpenChange={setIsOnboardingOpen}
        onSuccess={handleOnboardingSuccess}
      />
    </SidebarProvider>
  );
}