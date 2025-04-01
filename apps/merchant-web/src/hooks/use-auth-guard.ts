import { useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/lib/stores/auth-store';
import { useApiAuth } from './use-api-auth';

interface UseAuthGuardOptions {
  requireEmailVerification?: boolean;
  redirectTo?: string;
}

export function useAuthGuard({
  requireEmailVerification = true,
  redirectTo = '/login'
}: UseAuthGuardOptions = {}) {
  const router = useRouter();
  const { user, isAuthenticated } = useAuthStore();
  const { verifySession } = useApiAuth();
  const hasVerified = useRef(false);

  useEffect(() => {
    // Only verify if we haven't verified yet and we have a token
    if (!hasVerified.current && isAuthenticated) {
      hasVerified.current = true;
      
      verifySession().then(isValid => {
        if (!isValid) {
          hasVerified.current = false;
          const currentPath = window.location.pathname;
          router.push(`${redirectTo}?redirect=${encodeURIComponent(currentPath)}`);
          return;
        }

        // Check email verification if required
        if (requireEmailVerification && user && !user.emailVerified) {
          router.push(`/verify-email?email=${encodeURIComponent(user.email)}`);
        }
      });
    }
  }, [verifySession, router, requireEmailVerification, redirectTo, isAuthenticated]);

  return {
    isAuthenticated,
    isEmailVerified: user?.emailVerified ?? false,
    user,
    isLoading: !isAuthenticated || (requireEmailVerification && user && !user.emailVerified)
  };
} 