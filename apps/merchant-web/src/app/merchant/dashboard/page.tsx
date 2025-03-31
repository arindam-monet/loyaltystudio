'use client';
import { Button } from '@loyaltystudio/ui';
import { Plus } from 'lucide-react';
import Link from 'next/link';

export default function DashboardPage() {
  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
      <div className="sm:flex sm:items-center">
        <div className="sm:flex-auto">
          <h1 className="text-2xl font-semibold text-gray-900">Dashboard</h1>
          <p className="mt-2 text-sm text-gray-700">
            Welcome to your Loyalty Studio dashboard. Here you can manage your loyalty programs and view analytics.
          </p>
        </div>
        <div className="mt-4 sm:mt-0 sm:ml-16 sm:flex-none">
          <Link href="/merchant/onboarding">
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              New Program
            </Button>
          </Link>
        </div>
      </div>
      
      {/* Placeholder for program list */}
      <div className="mt-8">
        <div className="rounded-lg border border-dashed border-gray-300 p-12 text-center">
          <h3 className="mt-2 text-sm font-semibold text-gray-900">No programs yet</h3>
          <p className="mt-1 text-sm text-gray-500">Get started by creating a new loyalty program.</p>
          <div className="mt-6">
            <Link href="/merchant/onboarding">
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Create Program
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
} 