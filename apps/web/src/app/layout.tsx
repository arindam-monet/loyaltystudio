import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Monet - Headless Loyalty Platform",
  description: "Next-generation, API-first loyalty platform for businesses to deploy and scale personalized rewards programs.",
  keywords: ["loyalty program", "rewards platform", "customer engagement", "API-first", "white-label"],
  authors: [{ name: "Monet" }],
  openGraph: {
    title: "Monet - Headless Loyalty Platform",
    description: "Next-generation, API-first loyalty platform for businesses to deploy and scale personalized rewards programs.",
    url: "https://monet.loyaltystudio.ai",
    siteName: "Monet",
    images: [
      {
        url: "/og-image.jpg",
        width: 1200,
        height: 630,
        alt: "Monet Platform",
      },
    ],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Monet - Headless Loyalty Platform",
    description: "Next-generation, API-first loyalty platform for businesses to deploy and scale personalized rewards programs.",
    images: ["/og-image.jpg"],
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
} 