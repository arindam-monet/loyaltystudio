'use client';

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { LoadingProvider } from "./loading-provider";
import { Toaster } from "@loyaltystudio/ui";
import { ThemeProvider } from "./theme-provider";

const queryClient = new QueryClient();

export function RootProvider({ children }: { children: React.ReactNode }) {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider
        attribute="class"
        defaultTheme="system"
        enableSystem
        disableTransitionOnChange
      >
        <LoadingProvider>
          {children}
          <Toaster />
        </LoadingProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}