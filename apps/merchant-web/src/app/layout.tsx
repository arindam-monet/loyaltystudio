import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { RootProvider } from "@/providers/root-provider";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Loyalty Studio Merchant Portal",
  description: "Merchant portal for managing loyalty programs",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <RootProvider>
          {children}
        </RootProvider>
      </body>
    </html>
  );
}
