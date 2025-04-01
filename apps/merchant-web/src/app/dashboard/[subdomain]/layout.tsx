'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { MerchantLayout, useToast } from '@loyaltystudio/ui';
import {
  LayoutDashboard,
  Users,
  Gift,
  CreditCard,
  BarChart,
} from 'lucide-react';
import apiClient from '@/lib/api-client';

interface MerchantData {
  name: string;
  sales?: number;
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

  const navigation = [
    {
      href: `/dashboard/${params.subdomain}`,
      label: 'Dashboard',
      icon: <LayoutDashboard className="h-5 w-5" />,
    },
    {
      href: `/dashboard/${params.subdomain}/team`,
      label: 'Team',
      icon: <Users className="h-5 w-5" />,
    },
    {
      href: `/dashboard/${params.subdomain}/rewards`,
      label: 'Rewards',
      icon: <Gift className="h-5 w-5" />,
    },
    {
      href: `/dashboard/${params.subdomain}/transactions`,
      label: 'Transactions',
      icon: <CreditCard className="h-5 w-5" />,
    },
    {
      href: `/dashboard/${params.subdomain}/analytics`,
      label: 'Analytics',
      icon: <BarChart className="h-5 w-5" />,
    },
  ];

  return (
    <MerchantLayout
      links={navigation}
      activePath={`/dashboard/${params.subdomain}`}
      currentMerchant={merchant ? {
        name: merchant.name,
        logo: merchant.branding?.logo,
        sales: merchant.sales,
      } : undefined}
      onMerchantSelect={() => {
        // TODO: Implement merchant selection
      }}
    >
      {children}
    </MerchantLayout>
  );
} 