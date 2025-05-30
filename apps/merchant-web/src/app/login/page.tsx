'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuthStore } from '@/lib/stores/auth-store';
import { useApiAuth } from '@/hooks/use-api-auth';
import { apiClient } from '@/lib/api-client';
import { Button, Input, Label, Card, CardContent, CardDescription, CardHeader, CardTitle, Alert, AlertDescription } from '@loyaltystudio/ui';
import { PasswordInput } from '@loyaltystudio/ui';
import { Loader2 } from 'lucide-react';
import Link from 'next/link';
import { AxiosError } from 'axios';

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { setAuth } = useAuthStore();
  const { verifySession } = useApiAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Check if user is already authenticated
    const checkAuth = async () => {
      try {
        const isAuthenticated = await verifySession();
        if (isAuthenticated) {
          const redirect = searchParams.get('redirect') || '/dashboard';
          router.push(redirect);
        }
      } catch (error) {
        console.error('Auth check failed:', error);
      }
    };

    checkAuth();
  }, [verifySession, router, searchParams]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    const formData = new FormData(e.currentTarget);
    const email = formData.get('email') as string;
    const password = formData.get('password') as string;

    try {
      const response = await apiClient.post('/auth/login', { email, password });
      const { token, user } = response.data;

      if (!token || !user) {
        throw new Error('Invalid response from login endpoint');
      }

      // Set auth state
      setAuth(token, user);

      // Redirect to the requested page or dashboard
      const redirect = searchParams.get('redirect') || '/dashboard';
      router.push(redirect);
    } catch (error) {
      console.error('Login failed:', error);

      // Handle API errors
      if (error instanceof AxiosError) {
        const response = error.response?.data;

        // Handle email verification case (403 status)
        if (error.response?.status === 403 && response?.requiresVerification) {
          router.push(`/verify-email?email=${encodeURIComponent(response.user.email)}`);
          return;
        }

        // Handle account approval status
        if (error.response?.status === 403 && response?.error === 'Account pending approval') {
          const message = response?.demoRequestStatus === 'REJECTED'
            ? 'Your demo request was rejected. Please contact support for assistance.'
            : 'Your account is pending approval. We will contact you once your account is approved.';
          setError(message);
          return;
        }

        if (error.response?.status === 403 && response?.error === 'Account not approved') {
          setError('Your account has not been approved. Please contact support for assistance.');
          return;
        }

        // Handle other API errors
        const errorMessage = response?.error || response?.message || 'Invalid email or password';
        setError(errorMessage);
      } else {
        // Handle other errors
        setError(error instanceof Error ? error.message : 'An unexpected error occurred. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container flex items-center justify-center min-h-screen py-12">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Welcome Back</CardTitle>
          <CardDescription>
            Enter your credentials to access your account
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                name="email"
                type="email"
                placeholder="john@example.com"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <PasswordInput
                id="password"
                name="password"
                required
                placeholder="Enter your password"
              />
            </div>

            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <Button
              type="submit"
              className="w-full"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Logging in...
                </>
              ) : (
                'Log In'
              )}
            </Button>

            <div className="flex items-center justify-between">
              <Link href="/forgot-password" className="text-sm text-primary hover:underline">
                Forgot password?
              </Link>
              <Link href="/register" className="text-sm text-primary hover:underline">
                Create account
              </Link>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}