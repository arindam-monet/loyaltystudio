'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@loyaltystudio/ui';
import { Button } from '@loyaltystudio/ui';
import { useToast } from '@loyaltystudio/ui';
import { useMerchants } from '@/hooks/use-merchants';
import { useRouter } from 'next/navigation';
import { AxiosError } from 'axios';
import {
  Users,
  Gift,
  CreditCard,
  TrendingUp,
  Plus,
  Share2,
} from 'lucide-react';

interface DashboardMetrics {
  totalMembers: number;
  activeRewards: number;
  monthlyTransactions: number;
  monthlyPointsIssued: number;
}

export default function DashboardPage() {
  const { toast } = useToast();
  const router = useRouter();
  const [metrics, setMetrics] = useState<DashboardMetrics>({
    totalMembers: 0,
    activeRewards: 0,
    monthlyTransactions: 0,
    monthlyPointsIssued: 0,
  });

  const { data: merchants, error, isLoading } = useMerchants();

  useEffect(() => {
    if (error) {
      const axiosError = error as AxiosError;
      // Check if it's a 401 error
      if (axiosError.response?.status === 401) {
        router.push('/login');
        return;
      }
      
      toast({
        title: 'Error',
        description: 'Failed to load dashboard metrics',
        variant: 'destructive',
      });
    }
  }, [error, router, toast]);

  const quickActions = [
    {
      title: 'Add Team Member',
      description: 'Invite a new team member to your business',
      icon: Plus,
      href: './team/invite',
    },
    {
      title: 'Create Reward',
      description: 'Set up a new reward for your loyalty program',
      icon: Gift,
      href: './rewards/new',
    },
    {
      title: 'Share Program',
      description: 'Get sharing links for your loyalty program',
      icon: Share2,
      href: './share',
    },
  ];

  if (isLoading) {
    return (
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold">Dashboard</h1>
          <p className="text-gray-500">Loading...</p>
        </div>
        {/* Add loading skeletons here if needed */}
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <p className="text-gray-500">Welcome to your loyalty program dashboard</p>
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">
              Total Members
            </CardTitle>
            <Users className="w-4 h-4 text-gray-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.totalMembers}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">
              Active Rewards
            </CardTitle>
            <Gift className="w-4 h-4 text-gray-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.activeRewards}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">
              Monthly Transactions
            </CardTitle>
            <CreditCard className="w-4 h-4 text-gray-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.monthlyTransactions}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">
              Points Issued (Monthly)
            </CardTitle>
            <TrendingUp className="w-4 h-4 text-gray-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {metrics.monthlyPointsIssued}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <div>
        <h2 className="text-lg font-semibold mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {quickActions.map((action) => (
            <Card key={action.title}>
              <CardHeader className="flex flex-row items-center gap-4">
                <div className="p-2 bg-primary/10 rounded-lg">
                  <action.icon className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <CardTitle className="text-base">{action.title}</CardTitle>
                  <p className="text-sm text-gray-500">{action.description}</p>
                </div>
              </CardHeader>
              <CardContent>
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => window.location.href = action.href}
                >
                  Get Started
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
} 