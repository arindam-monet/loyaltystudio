'use client';

import * as React from "react"
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Users,
  Gift,
  Settings,
  FileText,
  BarChart3,
  Receipt,
  HelpCircle,
  Award,
  Tag,
  Sparkles,
  AlertCircle,
} from 'lucide-react';
import { useMerchants } from '@/hooks/use-merchants';

import { NavMain } from "@/components/nav-main"
import { NavUser } from "@/components/nav-user"
import MerchantSwitcher from './merchant-switcher';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
  useSidebar,
} from '@loyaltystudio/ui';

// Define navigation data
const getNavData = (pathname: string) => ({
  navMain: [
    {
      title: 'Dashboard',
      url: '/dashboard',
      icon: LayoutDashboard,
      isActive: pathname === '/dashboard',
    },
    {
      title: 'Analytics',
      url: '/analytics',
      icon: BarChart3,
      isActive: pathname === '/analytics',
    },
    {
      title: 'Loyalty Programs',
      url: '/loyalty-programs',
      icon: Gift,
      isActive: pathname.includes('/loyalty-programs') || pathname.includes('/tiers') || pathname.includes('/rewards') || pathname.includes('/campaigns') || pathname.includes('/program-members'),
      items: [
        {
          title: 'Programs',
          url: '/loyalty-programs',
          icon: Gift,
          isActive: pathname === '/loyalty-programs' || pathname.startsWith('/loyalty-programs/'),
        },
        {
          title: 'Members',
          url: '/program-members',
          icon: Users,
          isActive: pathname.startsWith('/program-members'),
        },
        {
          title: 'Tiers',
          url: '/tiers',
          icon: Award,
          isActive: pathname === '/tiers' || pathname.startsWith('/tiers/'),
        },
        {
          title: 'Rewards',
          url: '/rewards',
          icon: Tag,
          isActive: pathname === '/rewards' || pathname.startsWith('/rewards/'),
        },
        {
          title: 'Campaigns',
          url: '/campaigns',
          icon: Sparkles,
          isActive: pathname === '/campaigns' || pathname.startsWith('/campaigns/'),
        },
      ],
    },
    {
      title: 'Transactions',
      url: '/transactions',
      icon: Receipt,
      isActive: pathname.startsWith('/transactions'),
    },
    {
      title: 'Settings',
      url: '/settings',
      icon: Settings,
      isActive: pathname.startsWith('/settings'),
      items: [
        {
          title: 'General',
          url: '/settings/general',
        },
        {
          title: 'Team',
          url: '/settings/team',
        },
        {
          title: 'Billing',
          url: '/settings/billing',
        },
      ],
    },
    {
      title: 'Help',
      url: '/help',
      icon: HelpCircle,
      isActive: pathname === '/help',
    },
    {
      title: 'API Docs',
      url: '/api-docs',
      icon: FileText,
      isActive: pathname === '/api-docs',
    },
  ],
});



export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const pathname = usePathname();
  const navData = getNavData(pathname);
  const { open: isOpen } = useSidebar();
  const { data: merchants = [] } = useMerchants();
  const hasMerchants = merchants.length > 0;

  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader className="border-b px-4 py-3 flex-none transition-all duration-300 ease-in-out bg-gradient-to-b from-primary/10 to-transparent shadow-sm relative z-10">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <div className="flex-shrink-0 mr-2">
              <div className="h-9 w-9 rounded-md bg-primary shadow-sm flex items-center justify-center text-white font-bold">
                LS
              </div>
            </div>
            {isOpen && (
              <h1 className="text-xl font-semibold truncate bg-gradient-to-r from-primary to-primary/80 bg-clip-text text-transparent">
                Loyalty Studio
              </h1>
            )}
          </div>
        </div>
        <div className="mt-3 p-1.5 rounded-md bg-background/80 shadow-sm border border-border/40">
          <MerchantSwitcher />
        </div>
        {!hasMerchants && (
          <div className={`mt-3 p-2.5 rounded-md bg-amber-50/90 border border-amber-200 shadow-sm ${!isOpen ? 'flex justify-center' : ''}`}>
            <div className="flex items-start gap-2">
              <AlertCircle className="h-4 w-4 text-amber-500 mt-0.5 flex-shrink-0" />
              {isOpen && (
                <div className="text-xs font-medium text-amber-800">
                  Create a merchant to get started with your loyalty program
                </div>
              )}
            </div>
          </div>
        )}
      </SidebarHeader>
      <SidebarContent className="bg-gradient-to-b from-transparent to-background/50">
        <div className="px-3 py-2">
          <div className="h-px bg-border/60 w-full my-1"></div>
        </div>
        <NavMain items={navData.navMain} />
      </SidebarContent>
      <SidebarFooter className="border-t bg-muted/30 shadow-inner">
        <NavUser />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
