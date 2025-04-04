'use client';

import * as React from 'react';
import Link from 'next/link';
import {
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  useSidebar,
} from '@loyaltystudio/ui';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@loyaltystudio/ui';
import { ChevronDown, ChevronRight } from 'lucide-react';
import { useState } from 'react';

interface NavMainProps {
  items: {
    title: string;
    url?: string;
    icon: React.ElementType;
    isActive?: boolean;
    items?: {
      title: string;
      url: string;
      icon?: React.ElementType;
      isActive?: boolean;
    }[];
  }[];
}

export function NavMain({ items }: NavMainProps) {
  const [openMenus, setOpenMenus] = useState<Record<string, boolean>>({});
  // Get sidebar state to conditionally render elements
  const { open: sidebarOpen } = useSidebar();

  return (
    <div className="space-y-4">
      <SidebarMenu className="px-2 space-y-1 pt-2">
        {items.map((item, index) => {
          const Icon = item.icon;
          const isOpen = openMenus[item.title] || false;

          if (item.items) {
            return (
              <SidebarMenuItem key={index}>
                <Collapsible
                  open={isOpen}
                  onOpenChange={(open) =>
                    setOpenMenus((prev) => ({ ...prev, [item.title]: open }))
                  }
                >
                  <CollapsibleTrigger asChild>
                    <SidebarMenuButton
                      className="w-full justify-between"
                      isActive={item.isActive}
                    >
                      <div className="flex items-center">
                        <Icon className="h-5 w-5" aria-hidden="true" />
                        {sidebarOpen && <span className="ml-2">{item.title}</span>}
                      </div>
                      {sidebarOpen && (
                        isOpen ? (
                          <ChevronDown className="h-4 w-4" />
                        ) : (
                          <ChevronRight className="h-4 w-4" />
                        )
                      )}
                    </SidebarMenuButton>
                  </CollapsibleTrigger>
                  <CollapsibleContent className={sidebarOpen ? "ml-4 pl-2 border-l" : "ml-0 pl-0"}>
                    <SidebarMenu className={sidebarOpen ? "" : "flex flex-col items-center"}>
                      {item.items.map((subItem, subIndex) => (
                        <SidebarMenuItem key={`${index}-${subIndex}`}>
                          <Link
                            href={subItem.url}
                            title={!sidebarOpen ? subItem.title : undefined}
                          >
                            <SidebarMenuButton isActive={subItem.isActive}>
                              {subItem.icon && <subItem.icon className="h-4 w-4 mr-2" aria-hidden="true" />}
                              {sidebarOpen && subItem.title}
                            </SidebarMenuButton>
                          </Link>
                        </SidebarMenuItem>
                      ))}
                    </SidebarMenu>
                  </CollapsibleContent>
                </Collapsible>
              </SidebarMenuItem>
            );
          }

          return (
            <SidebarMenuItem key={index}>
              <Link
                href={item.url || '#'}
                title={!sidebarOpen ? item.title : undefined}
              >
                <SidebarMenuButton isActive={item.isActive}>
                  <Icon className="h-5 w-5" aria-hidden="true" />
                  {sidebarOpen && <span className="ml-2">{item.title}</span>}
                </SidebarMenuButton>
              </Link>
            </SidebarMenuItem>
          );
        })}
      </SidebarMenu>
    </div>
  );
}