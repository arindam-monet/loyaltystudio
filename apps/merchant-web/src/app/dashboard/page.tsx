'use client';

import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/stores/auth';
import { AppSidebar } from '@/components/app-sidebar';
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
} from '@loyaltystudio/ui';
import {
  Building2,
  ArrowRight,
} from 'lucide-react';

export default function DashboardPage() {
  const router = useRouter();
  const { user } = useAuthStore();
  const merchants = []; // TODO: Replace with API call

  const handleCreateMerchant = () => {
    router.push('/onboarding');
  };

  if (!user) {
    router.replace('/login');
    return null;
  }

  return (
    <SidebarProvider>
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
          {merchants.length === 0 ? (
            <>
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

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Quick Setup Guide</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-start gap-4">
                      <div className="bg-primary/10 p-2 rounded-full">
                        <span className="text-primary font-bold">1</span>
                      </div>
                      <div>
                        <h3 className="font-medium">Create Business</h3>
                        <p className="text-sm text-muted-foreground">Add your business details and branding</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-4">
                      <div className="bg-primary/10 p-2 rounded-full">
                        <span className="text-primary font-bold">2</span>
                      </div>
                      <div>
                        <h3 className="font-medium">Set Up Program</h3>
                        <p className="text-sm text-muted-foreground">Configure your loyalty program rules</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-4">
                      <div className="bg-primary/10 p-2 rounded-full">
                        <span className="text-primary font-bold">3</span>
                      </div>
                      <div>
                        <h3 className="font-medium">Launch</h3>
                        <p className="text-sm text-muted-foreground">Review and launch your program</p>
                      </div>
                    </div>
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
            </>
          ) : (
            <>
              <div className="grid auto-rows-min gap-4 md:grid-cols-3">
                <div className="aspect-video rounded-xl bg-muted/50" />
                <div className="aspect-video rounded-xl bg-muted/50" />
                <div className="aspect-video rounded-xl bg-muted/50" />
              </div>
              <div className="min-h-[100vh] flex-1 rounded-xl bg-muted/50 md:min-h-min" />
            </>
          )}
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
} 