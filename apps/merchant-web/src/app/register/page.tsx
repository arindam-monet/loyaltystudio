'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/lib/stores/auth-store';
import { apiClient } from '@/lib/api-client';
import { Button, Input, Label, Card, CardContent, CardDescription, CardHeader, CardTitle, Alert, AlertDescription } from '@loyaltystudio/ui';
import { PasswordInput } from '@loyaltystudio/ui';
import { Loader2 } from 'lucide-react';
import Link from 'next/link';
import { AxiosError } from 'axios';

export default function RegisterPage() {
  const router = useRouter();
  const { setAuth } = useAuthStore();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    const formData = new FormData(e.currentTarget);
    const email = formData.get('email') as string;
    const password = formData.get('password') as string;
    const name = formData.get('name') as string;

    try {
      const response = await apiClient.post('/auth/register', { email, password, name });
      const { token, user, requiresVerification } = response.data;

      if (!user) {
        throw new Error('Invalid response from registration endpoint');
      }

      // Set auth state if we have a token
      if (token) {
        setAuth(token, user);
      }

      // Redirect to email verification if required
      if (requiresVerification) {
        router.push(`/verify-email?email=${encodeURIComponent(email)}`);
        return;
      }

      // Otherwise, redirect to dashboard
      router.push('/dashboard');
    } catch (error) {
      console.error('Registration failed:', error);
      
      // Handle API errors
      if (error instanceof AxiosError) {
        const errorMessage = error.response?.data?.error || error.response?.data?.message || 'Registration failed';
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
          <CardTitle>Create an Account</CardTitle>
          <CardDescription>
            Enter your details to create your account
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                name="name"
                type="text"
                placeholder="John Doe"
                required
              />
            </div>

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
                placeholder="Create a password"
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
                  Creating account...
                </>
              ) : (
                'Create Account'
              )}
            </Button>

            <div className="text-center text-sm text-muted-foreground">
              Already have an account?{' '}
              <Link href="/login" className="text-primary hover:underline">
                Log in
              </Link>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
} 