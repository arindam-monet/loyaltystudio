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
import { UserInfo } from './user-info';

export function AppSidebar() {
  const pathname = usePathname();

  return (
    <Sidebar className="border-r bg-sidebar">
      <SidebarHeader className="border-b px-6 py-3">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-semibold">Loyalty Studio</h1>
        </div>
      </SidebarHeader>

      <SidebarContent className="flex flex-col flex-1">
        <div className="space-y-4 px-4 py-2">
          <div className="px-2 py-2">
            <MerchantSwitcher className="w-full" />
          </div>
          <SidebarSeparator />
          <div className="px-2 py-2">
            <h2 className="mb-2 px-2 text-sm font-medium text-muted-foreground">
              Platform
            </h2>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton 
                  asChild
                  isActive={pathname === '/playground'}
                  tooltip="Playground"
                >
                  <Link href="/playground">
                    <LayoutDashboard className="mr-2 h-4 w-4" />
                    Playground
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton 
                  asChild
                  isActive={pathname === '/models'}
                  tooltip="Models"
                >
                  <Link href="/models">
                    <Building2 className="mr-2 h-4 w-4" />
                    Models
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton 
                  asChild
                  isActive={pathname === '/documentation'}
                  tooltip="Documentation"
                >
                  <Link href="/documentation">
                    <FileText className="mr-2 h-4 w-4" />
                    Documentation
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
          <SidebarSeparator />
          <div className="px-2 py-2">
            <h2 className="mb-2 px-2 text-sm font-medium text-muted-foreground">
              Projects
            </h2>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton 
                  asChild
                  isActive={pathname === '/design-engineering'}
                  tooltip="Design Engineering"
                >
                  <Link href="/design-engineering">
                    <Building2 className="mr-2 h-4 w-4" />
                    Design Engineering
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton 
                  asChild
                  isActive={pathname === '/sales-marketing'}
                  tooltip="Sales & Marketing"
                >
                  <Link href="/sales-marketing">
                    <Users className="mr-2 h-4 w-4" />
                    Sales & Marketing
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton 
                  asChild
                  isActive={pathname === '/travel'}
                  tooltip="Travel"
                >
                  <Link href="/travel">
                    <Gift className="mr-2 h-4 w-4" />
                    Travel
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton 
                  asChild
                  isActive={pathname === '/more'}
                  tooltip="More"
                >
                  <Link href="/more">
                    <MoreHorizontal className="mr-2 h-4 w-4" />
                    More
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </div>
        </div>
      </SidebarContent>

      <SidebarFooter className="border-t">
        <UserInfo />
      </SidebarFooter>
    </Sidebar>
  );
} 