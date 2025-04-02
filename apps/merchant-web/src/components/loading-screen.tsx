'use client';

import { cn } from '@loyaltystudio/ui';

interface LoadingScreenProps {
  className?: string;
}

export function LoadingScreen({ className }: LoadingScreenProps) {
  return (
    <div className={cn(
      'fixed inset-0 flex items-center justify-center bg-background',
      className
    )}>
      <div className="flex flex-col items-center gap-4">
        <div className="relative">
          {/* Outer ring */}
          <div className="absolute inset-0 rounded-full border-2 border-primary/30" />
          {/* Inner spinning ring */}
          <div className="h-12 w-12 rounded-full border-2 border-primary border-t-transparent animate-spin" />
        </div>
        <div className="text-sm text-muted-foreground animate-pulse">
          Loading your workspace...
        </div>
      </div>
    </div>
  );
} 