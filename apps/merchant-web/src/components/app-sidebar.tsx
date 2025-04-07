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
} from 'lucide-react';

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
      isActive: pathname.includes('/loyalty-programs') || pathname.includes('/tiers') || pathname.includes('/rewards') || pathname.includes('/campaigns'),
      items: [
        {
          title: 'Programs',
          url: '/loyalty-programs',
          icon: Gift,
          isActive: pathname === '/loyalty-programs' || pathname.startsWith('/loyalty-programs/'),
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
      title: 'Members',
      url: '/program-members',
      icon: Users,
      isActive: pathname.startsWith('/program-members'),
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

  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader className="border-b px-4 py-3 flex-none transition-all duration-300 ease-in-out">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <div className="flex-shrink-0 mr-2">
              <div className="h-8 w-8 rounded-md bg-primary flex items-center justify-center text-white font-bold">
                LS
              </div>
            </div>
            {isOpen && (
              <h1 className="text-xl font-semibold truncate">
                Loyalty Studio
              </h1>
            )}
          </div>
        </div>
        <div className="mt-2 p-1 rounded-md bg-muted/30">
          <MerchantSwitcher />
        </div>
      </SidebarHeader>
      <SidebarContent>
        <div className="px-3 py-2">
          <div className="h-px bg-border/60 w-full my-1"></div>
        </div>
        <NavMain items={navData.navMain} />
      </SidebarContent>
      <SidebarFooter>
        <NavUser />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
