'use client';
import { useState, useEffect } from 'react';
import { Button } from '@loyaltystudio/ui';
import { Plus, Building2 } from 'lucide-react';
import Link from 'next/link';
import apiClient from '@/lib/api-client';
import { MerchantOnboardingDialog } from '@/components/merchant-onboarding-dialog';

interface Merchant {
  id: string;
  name: string;
  isDefault: boolean;
}

export default function DashboardPage() {
  const [merchants, setMerchants] = useState<Merchant[]>([]);
  const [currentMerchant, setCurrentMerchant] = useState<Merchant | null>(null);
  const [loading, setLoading] = useState(true);
  const [isOnboardingOpen, setIsOnboardingOpen] = useState(false);

  useEffect(() => {
    fetchMerchants();
  }, []);

  const fetchMerchants = async () => {
    try {
      const response = await apiClient.get('/merchants');
      setMerchants(response.data);
      const defaultMerchant = response.data.find((m: Merchant) => m.isDefault);
      setCurrentMerchant(defaultMerchant || response.data[0]);
    } catch (error) {
      console.error('Failed to fetch merchants:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleMerchantChange = async (merchantId: string) => {
    try {
      await apiClient.post('/merchants/switch', { merchantId });
      const merchant = merchants.find(m => m.id === merchantId);
      if (merchant) {
        setCurrentMerchant(merchant);
      }
    } catch (error) {
      console.error('Failed to switch merchant:', error);
    }
  };

  const handleOnboardingSuccess = () => {
    // Refresh the page or update the UI as needed
    window.location.reload();
  };

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
      <div className="sm:flex sm:items-center">
        <div className="sm:flex-auto">
          <div className="flex items-center gap-4">
            <h1 className="text-2xl font-semibold text-gray-900">Dashboard</h1>
            {merchants.length > 1 && (
              <select
                value={currentMerchant?.id}
                onChange={(e) => handleMerchantChange(e.target.value)}
                className="rounded-md border border-gray-300 px-3 py-2 text-sm"
              >
                {merchants.map((merchant) => (
                  <option key={merchant.id} value={merchant.id}>
                    {merchant.name}
                  </option>
                ))}
              </select>
            )}
          </div>
          <p className="mt-2 text-sm text-gray-700">
            Welcome to your Loyalty Studio dashboard. Here you can manage your loyalty programs and view analytics.
          </p>
        </div>
        <div className="mt-4 sm:mt-0 sm:ml-16 sm:flex-none">
          <Button onClick={() => setIsOnboardingOpen(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Create New Business
          </Button>
        </div>
      </div>
      
      {/* Placeholder for program list */}
      <div className="mt-8">
        <div className="rounded-lg border border-dashed border-gray-300 p-12 text-center">
          <h3 className="mt-2 text-sm font-semibold text-gray-900">No programs yet</h3>
          <p className="mt-1 text-sm text-gray-500">Get started by creating a new loyalty program.</p>
          <div className="mt-6">
            <Link href="/onboarding">
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Create Program
              </Button>
            </Link>
          </div>
        </div>
      </div>
      <MerchantOnboardingDialog 
        open={isOnboardingOpen} 
        onOpenChange={setIsOnboardingOpen}
        onSuccess={handleOnboardingSuccess}
      />
    </div>
  );
} 