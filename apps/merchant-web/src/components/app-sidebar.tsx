'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@loyaltystudio/ui';
import {
  LayoutDashboard,
  Users,
  Gift,
  Settings,
  Building2,
  FileText,
  BookOpen,
  MoreHorizontal,
  CreditCard,
  Users2,
  BarChart3,
  Wallet,
  Receipt,
  Bell,
  Mail,
  HelpCircle,
  ChevronDown,
  ChevronRight,
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
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@loyaltystudio/ui';
import MerchantSwitcher from './merchant-switcher';
import { UserInfo } from './user-info';
import { useState } from 'react';

export function AppSidebar() {
  const pathname = usePathname();
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  return (
    <Sidebar className="border-r bg-sidebar h-screen flex flex-col w-64 shrink-0">
      <SidebarHeader className="border-b px-6 py-3 flex-none">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-semibold h-10">Loyalty Studio</h1>
        </div>
      </SidebarHeader>

      <SidebarContent className="flex-1 overflow-y-auto">
        <div className="space-y-4 px-4 py-2">
          <div className="px-2 py-2">
            <MerchantSwitcher className="w-full" />
          </div>
          <SidebarSeparator />
          <div className="px-2 py-2">
            <h2 className="mb-2 px-2 text-sm font-medium text-muted-foreground">
              Main
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
                  isActive={pathname.includes('/loyalty-programs')}
                  tooltip="Loyalty Programs"
                >
                  <Link href="/loyalty-programs">
                    <Gift className="mr-2 h-4 w-4" />
                    Loyalty Programs
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
                  isActive={pathname === '/transactions'}
                  tooltip="Transactions"
                >
                  <Link href="/transactions">
                    <Receipt className="mr-2 h-4 w-4" />
                    Transactions
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton
                  asChild
                  isActive={pathname === '/analytics'}
                  tooltip="Analytics"
                >
                  <Link href="/analytics">
                    <BarChart3 className="mr-2 h-4 w-4" />
                    Analytics
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </div>
          <SidebarSeparator />
          <div className="px-2 py-2">
            <h2 className="mb-2 px-2 text-sm font-medium text-muted-foreground">
              Marketing
            </h2>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton
                  asChild
                  isActive={pathname === '/campaigns'}
                  tooltip="Campaigns"
                >
                  <Link href="/campaigns">
                    <Bell className="mr-2 h-4 w-4" />
                    Campaigns
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </div>
          <SidebarSeparator />
          <div className="px-2 py-2">
            <h2 className="mb-2 px-2 text-sm font-medium text-muted-foreground">
              Settings
            </h2>
            <Collapsible open={isSettingsOpen} onOpenChange={setIsSettingsOpen}>
              <CollapsibleTrigger asChild>
                <SidebarMenuButton
                  className="w-full justify-between"
                  isActive={pathname.startsWith('/settings')}
                >
                  <div className="flex items-center">
                    <Settings className="mr-2 h-4 w-4" />
                    Settings
                  </div>
                  {isSettingsOpen ? (
                    <ChevronDown className="h-4 w-4" />
                  ) : (
                    <ChevronRight className="h-4 w-4" />
                  )}
                </SidebarMenuButton>
              </CollapsibleTrigger>
              <CollapsibleContent className="mt-1 space-y-1">
                <SidebarMenu>
                  <SidebarMenuItem>
                    <SidebarMenuButton
                      asChild
                      isActive={pathname === '/settings/general'}
                      tooltip="General Settings"
                    >
                      <Link href="/settings/general">
                        General
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                  <SidebarMenuItem>
                    <SidebarMenuButton
                      asChild
                      isActive={pathname === '/settings/team'}
                      tooltip="Team Settings"
                    >
                      <Link href="/settings/team">
                        Team
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                  <SidebarMenuItem>
                    <SidebarMenuButton
                      asChild
                      isActive={pathname === '/settings/billing'}
                      tooltip="Billing Settings"
                    >
                      <Link href="/settings/billing">
                        Billing
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>

                </SidebarMenu>
              </CollapsibleContent>
            </Collapsible>
          </div>
          <SidebarSeparator />
          <div className="px-2 py-2">
            <h2 className="mb-2 px-2 text-sm font-medium text-muted-foreground">
              Support
            </h2>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton
                  asChild
                  isActive={pathname === '/help'}
                  tooltip="Help Center"
                >
                  <Link href="/help">
                    <HelpCircle className="mr-2 h-4 w-4" />
                    Help Center
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton
                  asChild
                  isActive={pathname === '/api-docs'}
                  tooltip="API Documentation"
                >
                  <Link href="/api-docs">
                    <FileText className="mr-2 h-4 w-4" />
                    API Docs
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </div>
        </div>
      </SidebarContent>

      <SidebarFooter className="border-t flex-none">
        <UserInfo />
      </SidebarFooter>
    </Sidebar>
  );
}