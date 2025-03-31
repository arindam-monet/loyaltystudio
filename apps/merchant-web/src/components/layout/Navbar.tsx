'use client';

import { usePathname } from 'next/navigation';
import { Navbar as BaseNavbar } from '@loyaltystudio/ui';

const merchantLinks = [
  { href: '/merchant/dashboard', label: 'Dashboard' },
  { href: '/merchant/programs', label: 'Programs' },
  { href: '/merchant/customers', label: 'Customers' },
  { href: '/merchant/reports', label: 'Reports' },
];

export default function MerchantNavbar() {
  const pathname = usePathname();

  return (
    <BaseNavbar
      variant="merchant"
      links={merchantLinks}
      activePath={pathname}
      onLinkClick={(href: string) => {
        // Next.js will handle the navigation
      }}
      brandName="Loyalty Studio Merchant"
      brandLink="/merchant/dashboard"
    />
  );
} 