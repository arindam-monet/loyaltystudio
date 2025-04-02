import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/lib/stores/auth-store';
import { useApiAuth } from './use-api-auth';

interface UseAuthGuardOptions {
  requireEmailVerification?: boolean;
  redirectTo?: string;
  allowUnverifiedAccess?: boolean;
}

export function useAuthGuard({
  requireEmailVerification = true,
  redirectTo = '/login',
  allowUnverifiedAccess = false
}: UseAuthGuardOptions = {}) {
  const router = useRouter();
  const { user, isAuthenticated } = useAuthStore();
  const { verifySession } = useApiAuth();
  const hasVerified = useRef(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const protectRoute = async () => {
      // Skip verification if we're already on the verify-email page
      if (window.location.pathname === '/verify-email') {
        setIsLoading(false);
        return;
      }

      // If not authenticated, redirect to login
      if (!isAuthenticated) {
        const currentPath = window.location.pathname;
        router.push(`${redirectTo}?redirect=${encodeURIComponent(currentPath)}`);
        setIsLoading(false);
        return;
      }

      // Only verify if we haven't verified yet and we have a token
      if (!hasVerified.current) {
        hasVerified.current = true;
        
        try {
          const isValid = await verifySession();
          if (!isValid) {
            hasVerified.current = false;
            const currentPath = window.location.pathname;
            router.push(`${redirectTo}?redirect=${encodeURIComponent(currentPath)}`);
            return;
          }

          // Check email verification if required and not allowing unverified access
          if (requireEmailVerification && !allowUnverifiedAccess && user && !user.emailVerified) {
            router.push(`/verify-email?email=${encodeURIComponent(user.email)}`);
          }
        } catch (error) {
          console.error('Session verification failed:', error);
          hasVerified.current = false;
          const currentPath = window.location.pathname;
          router.push(`${redirectTo}?redirect=${encodeURIComponent(currentPath)}`);
        }
      }
      
      setIsLoading(false);
    };

    protectRoute();
  }, [isAuthenticated, router, redirectTo, requireEmailVerification, allowUnverifiedAccess, user, verifySession]);

  return {
    isAuthenticated,
    isEmailVerified: user?.emailVerified ?? false,
    user,
    isLoading
  };
} 