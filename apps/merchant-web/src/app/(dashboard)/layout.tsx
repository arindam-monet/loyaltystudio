'use client';

import React from 'react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { Breadcrumb, BreadcrumbItem, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator, Separator, SidebarInset, SidebarProvider, SidebarTrigger } from '@loyaltystudio/ui';
import { AppSidebar } from '@/components/app-sidebar';
import { ThemeToggle } from '@/components/theme-toggle';

// Helper function to generate breadcrumbs based on pathname
function getBreadcrumbs(pathname: string) {
  const paths = pathname.split('/').filter(Boolean);
  const breadcrumbs = [];

  // Add home breadcrumb
  breadcrumbs.push({
    title: 'Dashboard',
    url: '/dashboard',
  });

  // Build breadcrumb path
  let currentPath = '';

  for (let i = 0; i < paths.length; i++) {
    const path = paths[i];
    currentPath += `/${path}`;

    // Format the title (capitalize and replace hyphens with spaces)
    let title = path.replace(/-/g, ' ');
    title = title.charAt(0).toUpperCase() + title.slice(1);

    // Handle special cases
    if (path === 'loyalty-programs') {
      title = 'Loyalty Programs';
    } else if (path.match(/^[0-9a-f]{24}$/)) {
      // This is likely an ID - try to get a more descriptive name
      if (paths[i - 1] === 'loyalty-programs') {
        title = 'Program Details';
      } else if (paths[i - 1] === 'tiers') {
        title = 'Tier Details';
      } else if (paths[i - 1] === 'rewards') {
        title = 'Reward Details';
      } else if (paths[i - 1] === 'campaigns') {
        title = 'Campaign Details';
      } else {
        title = 'Details';
      }
    }

    breadcrumbs.push({
      title,
      url: currentPath,
      isActive: i === paths.length - 1,
    });
  }

  return breadcrumbs;
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const breadcrumbs = getBreadcrumbs(pathname);

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <header className="flex h-16 shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-[[data-collapsible=icon]]/sidebar-wrapper:h-12 bg-gradient-to-r from-background via-muted/30 to-background border-b shadow-sm sticky top-0 z-10 backdrop-blur-[2px] bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] [background-size:16px_16px] dark:bg-[radial-gradient(#1f2937_1px,transparent_1px)]">
          <div className="flex items-center gap-2 px-4 w-full">
            <div className="flex items-center gap-2">
              <SidebarTrigger className="-ml-1" />
              <Separator orientation="vertical" className="mr-2 h-4" />
              <Breadcrumb className="overflow-hidden">
                <BreadcrumbList className="animate-in fade-in duration-500">
                  {breadcrumbs.map((crumb, index) => (
                    <React.Fragment key={index}>
                      {index > 0 && <BreadcrumbSeparator className="text-muted-foreground/50" />}
                      {crumb.isActive ? (
                        <BreadcrumbPage className="font-semibold text-primary bg-primary/5 px-2 py-1 rounded-md">{crumb.title}</BreadcrumbPage>
                      ) : (
                        <BreadcrumbItem>
                          <Link href={crumb.url} className="hover:text-primary transition-colors hover:bg-muted/50 px-2 py-1 rounded-md">{crumb.title}</Link>
                        </BreadcrumbItem>
                      )}
                    </React.Fragment>
                  ))}
                </BreadcrumbList>
              </Breadcrumb>
            </div>
            <div className="ml-auto flex items-center gap-4">
              <div className="hidden md:flex items-center gap-2">
                <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                  <span className="text-xs font-medium text-primary">LS</span>
                </div>
                <span className="text-sm font-medium">Loyalty Studio</span>
              </div>
              <ThemeToggle />
            </div>
          </div>
        </header>
        <div className="flex flex-1 p-6 pt-4">
          {children}
        </div>
      </SidebarInset>

    </SidebarProvider>
  );
}
