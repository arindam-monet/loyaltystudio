'use client';

import { useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useToast } from '@loyaltystudio/ui';
import { Loader2 } from 'lucide-react';

export default function HomePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();

  useEffect(() => {
    // Check if this is a verification success redirect
    const hash = window.location.hash;
    if (hash) {
      try {
        const params = new URLSearchParams(hash.substring(1));
        const type = params.get('type');
        
        if (type === 'signup') {
          // Show success message
          toast({
            title: "Email Verified Successfully!",
            description: "Your email has been verified. You can now log in to your account.",
            duration: 5000,
          });

          // Redirect to login page after a short delay
          setTimeout(() => {
            router.push('/login');
          }, 1000);
        }
      } catch (error) {
        console.error('Error processing verification:', error);
        router.push('/login');
      }
    } else {
      // If no hash, redirect to login
      router.push('/login');
    }
  }, [router, toast]);

  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="text-center">
        <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
        <p className="mt-4 text-muted-foreground">Redirecting to login...</p>
      </div>
    </div>
  );
} 