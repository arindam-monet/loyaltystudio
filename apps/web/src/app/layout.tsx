import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";
import { Navbar } from '@/components/layout/navbar';
import { Footer } from '@/components/layout/footer';

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "LoyaltyStudio - Headless Loyalty Platform",
  description: "Build and manage loyalty programs with our headless loyalty platform. Integrate with any e-commerce system and customize your rewards program.",
  keywords: ["loyalty program", "rewards system", "e-commerce integration", "headless platform", "customer engagement"],
  authors: [{ name: "LoyaltyStudio" }],
  openGraph: {
    title: "LoyaltyStudio - Headless Loyalty Platform",
    description: "Build and manage loyalty programs with our headless loyalty platform.",
    url: "https://loyaltystudio.com",
    siteName: "LoyaltyStudio",
    images: [
      {
        url: "/og-image.jpg",
        width: 1200,
        height: 630,
        alt: "LoyaltyStudio Platform",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "LoyaltyStudio - Headless Loyalty Platform",
    description: "Build and manage loyalty programs with our headless loyalty platform.",
    images: ["/og-image.jpg"],
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="scroll-smooth" suppressHydrationWarning>
      <body className={inter.className}>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <div className="relative min-h-screen flex flex-col">
            <Navbar />
            <main className="flex-1 pt-16">
              {children}
            </main>
            <Footer />
          </div>
        </ThemeProvider>
      </body>
    </html>
  );
} 