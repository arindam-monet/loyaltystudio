'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/stores/auth';
import { useLogout } from '@/hooks/use-auth';
import {
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  SidebarProvider,
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarFooter,
  SidebarTrigger,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarInset,
  SidebarRail,
  SidebarSeparator
} from '@loyaltystudio/ui';
import {
  Building2,
  ArrowRight,
  LayoutDashboard,
  Users,
  Gift,
  Settings,
  PlusCircle,
  LogOut,
  Search
} from 'lucide-react';

interface Merchant {
  id: string;
  name: string;
  sales: number;
}

export default function DashboardPage() {
  const router = useRouter();
  const { user } = useAuthStore();
  const logout = useLogout();
  const [selectedMerchant, setSelectedMerchant] = useState<string>('');

  // TODO: Replace with actual API call
  const merchants: Merchant[] = [];

  const handleLogout = async () => {
    try {
      await logout.mutateAsync();
      router.replace('/login');
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  const handleCreateMerchant = () => {
    router.push('/onboarding');
  };

  if (!user) {
    router.replace('/login');
    return null;
  }

  return (
    <SidebarProvider defaultOpen>
      <div className="grid min-h-screen w-full lg:grid-cols-[280px_1fr]">
        <Sidebar className="hidden lg:block border-r bg-sidebar">
          <SidebarHeader className="border-b px-6 py-3">
            <div className="flex items-center justify-between">
              <h1 className="text-xl font-semibold">Loyalty Studio</h1>
              <SidebarTrigger />
            </div>
          </SidebarHeader>

          <SidebarContent className="px-4 py-2">
            <div className="space-y-4">
              <div className="px-2 py-2">
                <h2 className="mb-2 px-2 text-lg font-semibold tracking-tight">
                  Overview
                </h2>
                <SidebarMenu>
                  <SidebarMenuItem>
                    <SidebarMenuButton tooltip="Search">
                      <Search className="mr-2 h-4 w-4" />
                      Search
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                </SidebarMenu>
              </div>
              <SidebarSeparator />
              <div className="px-2 py-2">
                <h2 className="mb-2 px-2 text-lg font-semibold tracking-tight">
                  Your Businesses
                </h2>
                <SidebarMenu>
                  {merchants.length > 0 ? (
                    merchants.map((merchant) => (
                      <SidebarMenuItem key={merchant.id}>
                        <SidebarMenuButton
                          isActive={selectedMerchant === merchant.id}
                          onClick={() => setSelectedMerchant(merchant.id)}
                          tooltip={merchant.name}
                        >
                          <Building2 className="mr-2 h-4 w-4" />
                          {merchant.name}
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    ))
                  ) : null}
                  <SidebarMenuItem>
                    <SidebarMenuButton 
                      onClick={handleCreateMerchant}
                      tooltip="Add New Business"
                    >
                      <PlusCircle className="mr-2 h-4 w-4" />
                      Add New Business
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                </SidebarMenu>
              </div>

              {merchants.length > 0 && (
                <>
                  <SidebarSeparator />
                  <div className="px-2 py-2">
                    <h2 className="mb-2 px-2 text-lg font-semibold tracking-tight">
                      Management
                    </h2>
                    <SidebarMenu>
                      <SidebarMenuItem>
                        <SidebarMenuButton 
                          isActive={true}
                          tooltip="Dashboard"
                        >
                          <LayoutDashboard className="mr-2 h-4 w-4" />
                          Dashboard
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                      <SidebarMenuItem>
                        <SidebarMenuButton tooltip="Customers">
                          <Users className="mr-2 h-4 w-4" />
                          Customers
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                      <SidebarMenuItem>
                        <SidebarMenuButton tooltip="Rewards">
                          <Gift className="mr-2 h-4 w-4" />
                          Rewards
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                      <SidebarMenuItem>
                        <SidebarMenuButton tooltip="Settings">
                          <Settings className="mr-2 h-4 w-4" />
                          Settings
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    </SidebarMenu>
                  </div>
                </>
              )}
            </div>
          </SidebarContent>

          <SidebarFooter className="border-t p-4">
            <Button 
              variant="ghost" 
              className="w-full justify-start" 
              onClick={handleLogout}
            >
              <LogOut className="mr-2 h-4 w-4" />
              Logout
            </Button>
          </SidebarFooter>
          <SidebarRail />
        </Sidebar>
        <div className="flex flex-col">
          <header className="sticky top-0 z-10 flex h-16 items-center gap-4 border-b bg-background px-6">
            <SidebarTrigger className="lg:hidden" />
            <h1 className="text-xl font-semibold">Dashboard</h1>
          </header>
          <main className="flex-1 overflow-auto">
            {merchants.length === 0 ? (
              <div className="container mx-auto p-6">
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

                <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
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
              </div>
            ) : (
              <div className="flex-1 space-y-4 p-8 pt-6">
                <div className="flex items-center justify-between space-y-2">
                  <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
                </div>
                {/* Add dashboard content for businesses here */}
              </div>
            )}
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
} 