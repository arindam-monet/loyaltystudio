import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import '@loyaltystudio/ui/src/styles/globals.css';
import MerchantNavbar from '@/components/layout/Navbar';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Loyalty Studio Merchant Portal',
  description: 'Merchant portal for managing loyalty programs',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <MerchantNavbar />
        <main className="min-h-screen bg-gray-50">
          {children}
        </main>
      </body>
    </html>
  );
} 