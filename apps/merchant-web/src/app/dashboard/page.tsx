'use client';

import { useAuthGuard } from '@/hooks/use-auth-guard';
import { useAuthStore } from '@/lib/stores/auth-store';
import { useRouter } from 'next/navigation';
import { AppSidebar } from '@/components/app-sidebar';
import { useMerchants, Merchant } from '@/hooks/use-merchants';
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
} from 'lucide-react';
import { LoadingScreen } from '@/components/loading-screen';

type ChecklistItem = {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  completed: boolean;
};

const checklistItems: ChecklistItem[] = [
  {
    id: 'business',
    title: 'Business Setup',
    description: 'Create your business profile and branding',
    icon: <Building2 className="w-4 h-4" />,
    completed: false,
  },
  {
    id: 'team',
    title: 'Team Management',
    description: 'Invite team members and set up roles',
    icon: <Users className="w-4 h-4" />,
    completed: false,
  },
  {
    id: 'program',
    title: 'Loyalty Program',
    description: 'Configure and launch your loyalty program',
    icon: <Settings className="w-4 h-4" />,
    completed: false,
  },
];

export default function DashboardPage() {
  const router = useRouter();
  const { user } = useAuthStore();
  const { isLoading: isAuthLoading } = useAuthGuard();
  const { data: merchants, isLoading: isMerchantsLoading } = useMerchants();

  // If not authenticated, the useAuthGuard hook will handle the redirect
  if (!user) {
    return null;
  }

  const handleCreateMerchant = () => {
    router.push('/onboarding');
  };

  const renderMerchantsList = () => {
    if (isMerchantsLoading) {
      return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-6 w-3/4" />
                <Skeleton className="h-4 w-1/2 mt-2" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-4 w-full mb-2" />
                <Skeleton className="h-4 w-2/3" />
              </CardContent>
            </Card>
          ))}
        </div>
      );
    }

    if (!merchants?.length) {
      return (
        <Card className="border-2 border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-16">
            <div className="bg-primary/10 p-4 rounded-full mb-6">
              <Building2 className="w-8 h-8 text-primary" />
            </div>
            <h2 className="text-2xl font-semibold mb-2">Create Your First Business</h2>
            <p className="text-muted-foreground mb-8 text-center max-w-md">
              Get started by creating your first business in Loyalty Studio. 
              Set up your loyalty program and start rewarding your customers.
            </p>
            <Button size="lg" onClick={handleCreateMerchant}>
              Create Business
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </CardContent>
        </Card>
      );
    }

    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {merchants.map((merchant) => (
          <Card key={merchant.id} className="group hover:shadow-md transition-shadow">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="text-lg group-hover:text-primary transition-colors">
                    {merchant.name}
                  </CardTitle>
                  {merchant.isDefault && (
                    <span className="text-xs text-primary font-medium">Default</span>
                  )}
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => router.push(`/dashboard/${merchant.id}`)}
                >
                  View
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {merchant.description && (
                <p className="text-sm text-muted-foreground mb-4">{merchant.description}</p>
              )}
              <div className="space-y-2">
                {merchant.industry && (
                  <div className="flex items-center text-sm text-muted-foreground">
                    <Briefcase className="w-4 h-4 mr-2" />
                    {merchant.industry}
                  </div>
                )}
                {merchant.website && (
                  <div className="flex items-center text-sm text-muted-foreground">
                    <Globe className="w-4 h-4 mr-2" />
                    {merchant.website}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  };

  return (
    <SidebarProvider defaultOpen>
      <div className="flex min-h-screen">
        <AppSidebar />
        <SidebarInset>
          <header className="flex h-16 shrink-0 items-center gap-2 border-b">
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
          <div className="flex flex-1 flex-col gap-4 p-4">
            <div className="mb-8">
              <h1 className="text-3xl font-bold">Welcome, {user?.name}</h1>
              <p className="text-gray-600">Role: {user?.role.name}</p>
            </div>

            {renderMerchantsList()}

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Setup Checklist</CardTitle>
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
                      <div>
                        <h3 className="font-medium">{item.title}</h3>
                        <p className="text-sm text-muted-foreground">{item.description}</p>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>

              <Card className="md:col-span-2">
                <CardHeader>
                  <CardTitle className="text-lg">Why Create a Loyalty Program?</CardTitle>
                </CardHeader>
                <CardContent className="grid grid-cols-2 gap-6">
                  <div>
                    <h3 className="font-medium mb-2">🎯 Increase Customer Retention</h3>
                    <p className="text-sm text-muted-foreground">Reward loyal customers and keep them coming back</p>
                  </div>
                  <div>
                    <h3 className="font-medium mb-2">📈 Boost Sales</h3>
                    <p className="text-sm text-muted-foreground">Drive repeat purchases and higher order values</p>
                  </div>
                  <div>
                    <h3 className="font-medium mb-2">🤝 Build Relationships</h3>
                    <p className="text-sm text-muted-foreground">Create meaningful connections with your customers</p>
                  </div>
                  <div>
                    <h3 className="font-medium mb-2">📊 Get Insights</h3>
                    <p className="text-sm text-muted-foreground">Understand your customers better with data</p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
} 