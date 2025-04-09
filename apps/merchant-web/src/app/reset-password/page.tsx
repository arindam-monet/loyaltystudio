'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useResetPassword } from '@/hooks/use-auth';
import { Button, Card, CardContent, CardDescription, CardHeader, CardTitle, Alert, AlertDescription, Label } from '@loyaltystudio/ui';
import { PasswordInput } from '@loyaltystudio/ui';
import { Loader2, Lock, ArrowLeft } from 'lucide-react';

export default function ResetPasswordPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [token, setToken] = useState<string | null>(null);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const resetPassword = useResetPassword();

  useEffect(() => {
    // Get token from URL hash or query parameters
    const hash = window.location.hash;

    // First try to get token from hash (Supabase default behavior)
    if (hash) {
      // Extract token from hash
      const params = new URLSearchParams(hash.substring(1));
      const tokenFromHash = params.get('token') || params.get('access_token');
      if (tokenFromHash) {
        console.log('Found token in hash');
        setToken(tokenFromHash);
        return;
      }
    }

    // If not in hash, try to get from query parameters
    // Check for token, access_token, or code (Supabase uses code for PKCE flow)
    const tokenFromQuery = searchParams.get('token') ||
      searchParams.get('access_token');

    const codeFromQuery = searchParams.get('code');

    if (tokenFromQuery) {
      console.log('Found token in query parameters:', tokenFromQuery.substring(0, 10) + '...');
      setToken(tokenFromQuery);
      return;
    }

    if (codeFromQuery) {
      console.log('Found code in query parameters:', codeFromQuery.substring(0, 10) + '...');
      // For PKCE flow, we need to store the code in localStorage to be used by Supabase client
      localStorage.setItem('supabase.auth.code', codeFromQuery);
      setToken(codeFromQuery);
      return;
    }

    // If still no token, check if it's in the URL path
    const pathSegments = window.location.pathname.split('/');
    if (pathSegments.length > 2) {
      const possibleToken = pathSegments[pathSegments.length - 1];
      if (possibleToken && possibleToken.length > 20) { // Tokens are usually long
        console.log('Found possible token in URL path');
        setToken(possibleToken);
        return;
      }
    }

    console.log('No token found in URL. Search params:', Object.fromEntries(searchParams.entries()));
  }, [searchParams]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!token) {
      setError('No reset token found. Please request a new password reset link.');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters long.');
      return;
    }

    try {
      await resetPassword.mutateAsync({ token, password });
      // Redirect to login with success message
      router.push('/login?reset=success');
    } catch (error) {
      // Error is handled by the mutation
    }
  };

  if (!token) {
    return (
      <div className="container flex items-center justify-center min-h-screen py-12">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4">
              <Lock className="h-12 w-12 text-destructive" />
            </div>
            <CardTitle className="text-2xl">Invalid Reset Link</CardTitle>
            <CardDescription className="text-base">
              This password reset link is invalid or has expired.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <Button
                variant="link"
                onClick={() => router.push('/forgot-password')}
                className="mx-auto w-full"
              >
                Request a new reset link
              </Button>
              <Button
                variant="link"
                onClick={() => router.push('/login')}
                className="mx-auto w-full"
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to login
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container flex items-center justify-center min-h-screen py-12">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4">
            <Lock className="h-12 w-12 text-primary" />
          </div>
          <CardTitle className="text-2xl">Reset Password</CardTitle>
          <CardDescription className="text-base">
            Enter your new password below.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {(error || resetPassword.isError) && (
              <Alert variant="destructive">
                <AlertDescription>
                  {error || resetPassword.error?.message || 'Failed to reset password. Please try again.'}
                </AlertDescription>
              </Alert>
            )}

            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="password">New Password</Label>
                <PasswordInput
                  id="password"
                  placeholder="Enter new password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  disabled={resetPassword.isPending}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirm Password</Label>
                <PasswordInput
                  id="confirmPassword"
                  placeholder="Confirm new password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  disabled={resetPassword.isPending}
                />
              </div>
            </div>

            <div className="space-y-4">
              <Button
                type="submit"
                className="w-full"
                disabled={resetPassword.isPending || !password || !confirmPassword}
              >
                {resetPassword.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Resetting...
                  </>
                ) : (
                  'Reset Password'
                )}
              </Button>

              <Button
                variant="link"
                onClick={() => router.push('/login')}
                className="mx-auto w-full"
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to login
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}