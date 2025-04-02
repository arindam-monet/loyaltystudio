'use client';

import { useAuthGuard } from '@/hooks/use-auth-guard';
import { useAuthStore } from '@/lib/stores/auth-store';
import { useRouter } from 'next/navigation';
import { AppSidebar } from '@/components/app-sidebar';
import { useMerchants } from '@/hooks/use-merchants';
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
  Skeleton,
  AreaChart,
  Badge,
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
} from 'lucide-react';
import { LoadingScreen } from '@/components/loading-screen';
import { MerchantOnboardingDialog } from '@/components/merchant-onboarding-dialog';
import { useState } from 'react';

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
};

const checklistItems: ChecklistItem[] = [
  {
    id: 'program',
    title: 'Create Loyalty Program',
    description: 'Set up your first loyalty program',
    icon: <Gift className="w-4 h-4" />,
    completed: false,
    action: {
      label: 'Create Program',
      href: '/programs/new',
    },
  },
  {
    id: 'branding',
    title: 'Customize Branding',
    description: 'Add your logo and brand colors',
    icon: <Settings className="w-4 h-4" />,
    completed: false,
    action: {
      label: 'Customize',
      href: '/settings/branding',
    },
  },
  {
    id: 'team',
    title: 'Invite Team Members',
    description: 'Add your team to collaborate',
    icon: <Users className="w-4 h-4" />,
    completed: false,
    action: {
      label: 'Invite',
      href: '/settings/team',
    },
  },
  {
    id: 'integration',
    title: 'Set Up Integration',
    description: 'Connect your e-commerce platform',
    icon: <Globe className="w-4 h-4" />,
    completed: false,
    action: {
      label: 'Connect',
      href: '/settings/integrations',
    },
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
  const [isOnboardingOpen, setIsOnboardingOpen] = useState(false);

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

  const renderMetrics = () => {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Revenue
            </CardTitle>
            <TrendingUp className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">$1,250.00</div>
            <div className="flex items-center mt-1">
              <Badge variant="secondary" className="text-xs">+12.5%</Badge>
              <span className="text-xs text-muted-foreground ml-2">vs last month</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              New Customers
            </CardTitle>
            <Users className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">1,234</div>
            <div className="flex items-center mt-1">
              <Badge variant="destructive" className="text-xs">-20%</Badge>
              <span className="text-xs text-muted-foreground ml-2">vs last month</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Active Accounts
            </CardTitle>
            <CreditCard className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">45,678</div>
            <div className="flex items-center mt-1">
              <Badge variant="secondary" className="text-xs">+12.5%</Badge>
              <span className="text-xs text-muted-foreground ml-2">vs last month</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Growth Rate
            </CardTitle>
            <TrendingUp className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">4.5%</div>
            <div className="flex items-center mt-1">
              <Badge variant="secondary" className="text-xs">+4.5%</Badge>
              <span className="text-xs text-muted-foreground ml-2">vs last month</span>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  };

  const renderVisitorChart = () => {
    return (
      <Card className="col-span-full">
        <CardHeader>
          <CardTitle>Total Visitors</CardTitle>
        </CardHeader>
        <CardContent>
          <AreaChart
            data={visitorData}
            areaKeys={['visitors', 'customers']}
            xAxisKey="date"
            height={300}
          />
        </CardContent>
      </Card>
    );
  };

  const renderChecklist = () => {
    return (
      <Card className='h-full'>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">Setup Checklist</CardTitle>
            <Badge variant="secondary" className="text-xs">2/4 completed</Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
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
                  <h3 className="font-medium">{item.title}</h3>
                  {item.action && !item.completed && (
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
                </div>
                <p className="text-sm text-muted-foreground">{item.description}</p>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    );
  };

  const renderLoyaltyPrograms = () => {
    return (
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">Loyalty Programs</CardTitle>
            <Button size="sm" onClick={() => router.push('/programs/new')}>
              Create Program
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <div className="bg-primary/10 p-4 rounded-full mb-4">
              <Gift className="w-8 h-8 text-primary" />
            </div>
            <h3 className="text-lg font-semibold mb-2">No Programs Yet</h3>
            <p className="text-muted-foreground mb-6 max-w-md">
              Create your first loyalty program to start rewarding your customers and drive repeat business.
            </p>
            <Button onClick={() => router.push('/programs/new')}>
              Create Your First Program
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </div>
        </CardContent>
      </Card>
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
                <p className="text-muted-foreground">Here's what's happening with your business</p>
              </div>

              {renderMetrics()}

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mt-4">
                {/* Chart takes full width */}
                <div className="lg:col-span-2">
                  {renderVisitorChart()}
                </div>
                
                {/* Checklist and Programs side by side */}
                <div className="h-full">
                  {renderChecklist()}
                </div>
                <div className="h-full">
                  {renderLoyaltyPrograms()}
                </div>
              </div>
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