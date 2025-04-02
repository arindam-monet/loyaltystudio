'use client';

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { LoadingProvider } from "./loading-provider";
import { Toaster } from "@loyaltystudio/ui";

const queryClient = new QueryClient();

export function RootProvider({ children }: { children: React.ReactNode }) {
  return (
    <QueryClientProvider client={queryClient}>
      <LoadingProvider>
        {children}
        <Toaster />
      </LoadingProvider>
    </QueryClientProvider>
  );
} 