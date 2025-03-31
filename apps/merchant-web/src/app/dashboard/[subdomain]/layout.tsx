'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import {
  LayoutDashboard,
  Users,
  Settings,
  Gift,
  CreditCard,
  BarChart,
  LogOut,
} from 'lucide-react';
import { apiClient } from '@/lib/api-client';
import { useToast } from '@/components/ui/use-toast';

interface MerchantData {
  name: string;
  branding?: {
    logo?: string;
    primaryColor?: string;
    secondaryColor?: string;
  };
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const params = useParams();
  const { toast } = useToast();
  const [merchant, setMerchant] = useState<MerchantData | null>(null);

  useEffect(() => {
    const fetchMerchantData = async () => {
      try {
        const response = await apiClient.get('/merchants/current');
        setMerchant(response.data);
      } catch (error) {
        toast({
          title: 'Error',
          description: 'Failed to load merchant data',
          variant: 'destructive',
        });
      }
    };

    fetchMerchantData();
  }, [toast]);

  const handleLogout = async () => {
    try {
      await apiClient.post('/auth/logout');
      window.location.href = '/login';
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to logout',
        variant: 'destructive',
      });
    }
  };

  const navigation = [
    {
      name: 'Dashboard',
      href: `/dashboard/${params.subdomain}`,
      icon: LayoutDashboard,
    },
    {
      name: 'Team',
      href: `/dashboard/${params.subdomain}/team`,
      icon: Users,
    },
    {
      name: 'Rewards',
      href: `/dashboard/${params.subdomain}/rewards`,
      icon: Gift,
    },
    {
      name: 'Transactions',
      href: `/dashboard/${params.subdomain}/transactions`,
      icon: CreditCard,
    },
    {
      name: 'Analytics',
      href: `/dashboard/${params.subdomain}/analytics`,
      icon: BarChart,
    },
    {
      name: 'Settings',
      href: `/dashboard/${params.subdomain}/settings`,
      icon: Settings,
    },
  ];

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Sidebar */}
      <div className="fixed inset-y-0 left-0 w-64 bg-white border-r">
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="p-4 border-b">
            <h1 className="text-xl font-semibold">
              {merchant?.name || 'Loading...'}
            </h1>
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-4 space-y-1">
            {navigation.map((item) => (
              <Link
                key={item.name}
                href={item.href}
                className="flex items-center px-4 py-2 text-sm text-gray-600 rounded-md hover:bg-gray-50"
              >
                <item.icon className="w-5 h-5 mr-3" />
                {item.name}
              </Link>
            ))}
          </nav>

          {/* Logout */}
          <div className="p-4 border-t">
            <Button
              variant="ghost"
              className="w-full justify-start"
              onClick={handleLogout}
            >
              <LogOut className="w-5 h-5 mr-3" />
              Logout
            </Button>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="pl-64">
        <main className="p-8">{children}</main>
      </div>
    </div>
  );
} 