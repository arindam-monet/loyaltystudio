'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@loyaltystudio/ui';
import {
  LayoutDashboard,
  Users,
  Gift,
  Settings,
  LogOut,
  Search,
  Loader2,
} from 'lucide-react';
import {
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarFooter,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarSeparator,
  Button,
} from '@loyaltystudio/ui';
import MerchantSwitcher from './merchant-switcher';
import { useLogout } from '@/hooks/use-auth';

export function AppSidebar() {
  const pathname = usePathname();
  const logout = useLogout();

  const handleLogout = async () => {
    try {
      await logout.mutateAsync();
    } catch (error) {
      console.error('Logout failed:', error);
      // You might want to show a toast notification here
    }
  };

  return (
    <Sidebar className="border-r bg-sidebar">
      <SidebarHeader className="border-b px-6 py-3">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-semibold">Loyalty Studio</h1>
        </div>
      </SidebarHeader>

      <SidebarContent className="px-4 py-2">
        <div className="space-y-4">
          <div className="px-2 py-2">
            <MerchantSwitcher className="w-full" />
          </div>
          <SidebarSeparator />
          <div className="px-2 py-2">
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton 
                  asChild
                  tooltip="Search"
                >
                  <Link href="/search">
                    <Search className="mr-2 h-4 w-4" />
                    Search
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </div>
          <SidebarSeparator />
          <div className="px-2 py-2">
            <h2 className="mb-2 px-2 text-lg font-semibold tracking-tight">
              Management
            </h2>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton 
                  asChild
                  isActive={pathname === '/dashboard'}
                  tooltip="Dashboard"
                >
                  <Link href="/dashboard">
                    <LayoutDashboard className="mr-2 h-4 w-4" />
                    Dashboard
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton 
                  asChild
                  isActive={pathname === '/customers'}
                  tooltip="Customers"
                >
                  <Link href="/customers">
                    <Users className="mr-2 h-4 w-4" />
                    Customers
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton 
                  asChild
                  isActive={pathname === '/rewards'}
                  tooltip="Rewards"
                >
                  <Link href="/rewards">
                    <Gift className="mr-2 h-4 w-4" />
                    Rewards
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton 
                  asChild
                  isActive={pathname === '/settings'}
                  tooltip="Settings"
                >
                  <Link href="/settings">
                    <Settings className="mr-2 h-4 w-4" />
                    Settings
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </div>
        </div>
      </SidebarContent>

      <SidebarFooter className="border-t p-4">
        <Button 
          variant="ghost" 
          className="w-full justify-start" 
          onClick={handleLogout}
          disabled={logout.isPending}
        >
          {logout.isPending ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Logging out...
            </>
          ) : (
            <>
              <LogOut className="mr-2 h-4 w-4" />
              Logout
            </>
          )}
        </Button>
      </SidebarFooter>
    </Sidebar>
  );
} 