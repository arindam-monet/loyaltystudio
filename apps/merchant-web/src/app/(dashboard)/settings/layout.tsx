'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@loyaltystudio/ui';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@loyaltystudio/ui';

export default function SettingsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  return (
    <div className="w-full space-y-6">
      <div className="space-y-0.5">
        <h2 className="text-2xl font-bold tracking-tight">Settings</h2>
        <p className="text-muted-foreground">
          Manage your account settings and preferences.
        </p>
      </div>

      <Tabs defaultValue={pathname.split('/').pop()} className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="general" asChild>
            <Link href="/settings/general">General</Link>
          </TabsTrigger>
          <TabsTrigger value="team" asChild>
            <Link href="/settings/team">Team</Link>
          </TabsTrigger>
          <TabsTrigger value="billing" asChild>
            <Link href="/settings/billing">Billing</Link>
          </TabsTrigger>
        </TabsList>
        <TabsContent value={pathname.split('/').pop() || 'general'} className="space-y-4">
          {children}
        </TabsContent>
      </Tabs>
    </div>
  );
}
