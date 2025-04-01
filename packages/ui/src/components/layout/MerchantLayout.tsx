'use client';

import * as React from 'react';
import { cn } from '../../lib/utils';
import { Card } from '../card';
import { Button } from '../button';
import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarFooter,
} from '../sidebar';

interface MerchantLayoutProps {
  children: React.ReactNode;
  links: Array<{
    href: string;
    label: string;
    icon?: React.ReactNode;
  }>;
  activePath?: string;
  onLinkClick?: (href: string) => void;
  brandName?: string;
  brandLink?: string;
  currentMerchant?: {
    name: string;
    logo?: string;
    sales?: number;
  };
  onMerchantSelect?: () => void;
  className?: string;
}

export function MerchantLayout({
  children,
  links,
  activePath,
  onLinkClick,
  brandName = 'Loyalty Studio',
  brandLink = '/',
  currentMerchant,
  onMerchantSelect,
  className,
}: MerchantLayoutProps) {
  return (
    <SidebarProvider>
      <div className="flex h-screen bg-gray-50">
        <Sidebar>
          <SidebarHeader>
            {/* Brand Logo */}
            <div className="flex h-16 items-center px-4">
              <a
                href={brandLink}
                className="text-xl font-bold text-gray-900"
                onClick={(e) => {
                  e.preventDefault();
                  onLinkClick?.(brandLink);
                }}
              >
                {brandName}
              </a>
            </div>

            {/* Merchant Selector */}
            {currentMerchant && (
              <div className="px-4">
                <Card className="mb-4 p-4">
                  <div className="flex items-center gap-3">
                    {currentMerchant.logo ? (
                      <img
                        src={currentMerchant.logo}
                        alt={currentMerchant.name}
                        className="h-10 w-10 rounded-lg object-cover"
                      />
                    ) : (
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gray-100 text-lg font-semibold">
                        {currentMerchant.name[0]}
                      </div>
                    )}
                    <div className="flex-1">
                      <h3 className="font-medium">{currentMerchant.name}</h3>
                      {currentMerchant.sales && (
                        <p className="text-sm text-gray-500">
                          {currentMerchant.sales.toLocaleString()} Sales
                        </p>
                      )}
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={onMerchantSelect}
                    >
                      <ChevronDownIcon className="h-4 w-4" />
                    </Button>
                  </div>
                </Card>
              </div>
            )}
          </SidebarHeader>

          <SidebarContent>
            <SidebarMenu>
              {links.map((link) => (
                <SidebarMenuItem key={link.href}>
                  <SidebarMenuButton
                    asChild
                    isActive={activePath === link.href}
                    tooltip={link.label}
                  >
                    <a
                      href={link.href}
                      onClick={(e) => {
                        e.preventDefault();
                        onLinkClick?.(link.href);
                      }}
                    >
                      {link.icon}
                      <span>{link.label}</span>
                    </a>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarContent>

          <SidebarFooter>
            <div className="px-4">
              <Button variant="ghost" className="w-full justify-start" asChild>
                <a href="/settings">
                  <CogIcon className="mr-3 h-5 w-5" />
                  Settings
                </a>
              </Button>
            </div>
          </SidebarFooter>
        </Sidebar>

        <main className={cn('flex-1 overflow-auto p-8', className)}>
          {children}
        </main>
      </div>
    </SidebarProvider>
  );
}

// Icons
function ChevronDownIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 20 20"
      fill="currentColor"
      {...props}
    >
      <path
        fillRule="evenodd"
        d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z"
        clipRule="evenodd"
      />
    </svg>
  );
}

function CogIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 20 20"
      fill="currentColor"
      {...props}
    >
      <path
        fillRule="evenodd"
        d="M7.84 1.804A1 1 0 018.82 1h2.36a1 1 0 01.98.804l.331 1.652a6.993 6.993 0 011.929 1.115l1.598-.54a1 1 0 011.186.447l1.18 2.044a1 1 0 01-.205 1.251l-1.267 1.113a7.047 7.047 0 010 2.228l1.267 1.113a1 1 0 01.206 1.25l-1.18 2.045a1 1 0 01-1.187.447l-1.598-.54a6.993 6.993 0 01-1.929 1.115l-.33 1.652a1 1 0 01-.98.804H8.82a1 1 0 01-.98-.804l-.331-1.652a6.993 6.993 0 01-1.929-1.115l-1.598.54a1 1 0 01-1.186-.447l-1.18-2.044a1 1 0 01.205-1.251l1.267-1.113a7.047 7.047 0 010-2.228L1.821 7.773a1 1 0 01-.206-1.25l1.18-2.045a1 1 0 011.187-.447l1.598.54A6.993 6.993 0 017.51 3.456l.33-1.652zM10 13a3 3 0 100-6 3 3 0 000 6z"
        clipRule="evenodd"
      />
    </svg>
  );
} 