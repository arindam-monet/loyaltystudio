'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, Button, Alert, AlertDescription } from '@loyaltystudio/ui';
import { Loader2, Mail } from 'lucide-react';
import Link from 'next/link';
import { apiClient } from '@/lib/api-client';

export default function VerifyEmailPage() {
  const searchParams = useSearchParams();
  const email = searchParams.get('email');
  const [isResending, setIsResending] = useState(false);
  const [isSent, setIsSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleResendVerification = async () => {
    if (!email) return;
    
    setIsResending(true);
    setError(null);

    try {
      await apiClient.post('/auth/resend-verification', { email });
      setIsSent(true);
    } catch (error) {
      console.error('Failed to resend verification:', error);
      setError('Failed to send verification email. Please try again.');
    } finally {
      setIsResending(false);
    }
  };

  return (
    <div className="container flex items-center justify-center min-h-screen py-12">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Verify Your Email</CardTitle>
          <CardDescription>
            We've sent a verification link to {email}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert>
            <Mail className="h-4 w-4" />
            <AlertDescription>
              Please check your email and click the verification link to continue.
            </AlertDescription>
          </Alert>

          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {isSent ? (
            <Alert>
              <AlertDescription>
                A new verification email has been sent. Please check your inbox.
              </AlertDescription>
            </Alert>
          ) : (
            <Button
              onClick={handleResendVerification}
              disabled={isResending}
              className="w-full"
            >
              {isResending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Sending...
                </>
              ) : (
                'Resend Verification Email'
              )}
            </Button>
          )}

          <div className="text-center text-sm text-muted-foreground">
            <p>Didn't receive the email?</p>
            <p>Check your spam folder or try a different email address.</p>
            <Link href="/register" className="text-primary hover:underline">
              Register with a different email
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 