'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useVerifyEmail, useResendVerificationEmail } from '@/hooks/use-auth';
import { Button, Card, CardContent, CardDescription, CardHeader, CardTitle, Alert, AlertDescription } from '@loyaltystudio/ui';
import { Loader2, Mail, CheckCircle2, AlertCircle } from 'lucide-react';

export default function VerifyEmailPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [token, setToken] = useState<string | null>(null);
  const [email, setEmail] = useState<string | null>(searchParams.get('email'));
  
  const [verificationStatus, setVerificationStatus] = useState<'idle' | 'verifying' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState<string>('');
  
  const verifyEmail = useVerifyEmail();
  const resendVerification = useResendVerificationEmail();

  useEffect(() => {
    // Get token from URL hash
    const hash = window.location.hash;
    if (hash) {
      // Extract token from hash
      const params = new URLSearchParams(hash.substring(1));
      const tokenFromHash = params.get('token');
      const emailFromHash = params.get('email');
      
      if (tokenFromHash) {
        setToken(tokenFromHash);
      }
      if (emailFromHash) {
        setEmail(emailFromHash);
      }
    }
  }, []);

  useEffect(() => {
    if (token) {
      handleVerification();
    }
  }, [token]);

  const handleVerification = async () => {
    if (!token) return;
    
    setVerificationStatus('verifying');
    try {
      await verifyEmail.mutateAsync(token);
      setVerificationStatus('success');
      // After successful verification, redirect to login after a short delay
      setTimeout(() => {
        router.push('/login?verified=true');
      }, 2000);
    } catch (error) {
      setVerificationStatus('error');
      setErrorMessage('Failed to verify email. Please try again or request a new verification link.');
    }
  };

  const handleResendVerification = async () => {
    if (!email) return;
    
    try {
      await resendVerification.mutateAsync(email);
      setVerificationStatus('idle');
      setErrorMessage('');
    } catch (error) {
      setErrorMessage('Failed to resend verification email. Please try again later.');
    }
  };

  return (
    <div className="container flex items-center justify-center min-h-screen py-12">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4">
            {verificationStatus === 'idle' && (
              <Mail className="h-12 w-12 text-primary" />
            )}
            {verificationStatus === 'verifying' && (
              <Loader2 className="h-12 w-12 animate-spin text-primary" />
            )}
            {verificationStatus === 'success' && (
              <CheckCircle2 className="h-12 w-12 text-green-500" />
            )}
            {verificationStatus === 'error' && (
              <AlertCircle className="h-12 w-12 text-destructive" />
            )}
          </div>
          <CardTitle className="text-2xl">
            {verificationStatus === 'idle' && 'Verify Your Email'}
            {verificationStatus === 'verifying' && 'Verifying Email'}
            {verificationStatus === 'success' && 'Email Verified'}
            {verificationStatus === 'error' && 'Verification Failed'}
          </CardTitle>
          <CardDescription className="text-base">
            {verificationStatus === 'idle' && 'Please verify your email address to access all features.'}
            {verificationStatus === 'verifying' && 'Please wait while we verify your email...'}
            {verificationStatus === 'success' && 'Your email has been verified successfully!'}
            {verificationStatus === 'error' && 'We encountered an issue verifying your email.'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {verificationStatus === 'success' && (
            <Alert className="bg-green-50 border-green-200">
              <AlertDescription className="text-green-800">
                Your email has been verified successfully. You will be redirected to the login page...
              </AlertDescription>
            </Alert>
          )}

          {verificationStatus === 'error' && (
            <div className="space-y-4">
              <Alert variant="destructive">
                <AlertDescription>{errorMessage}</AlertDescription>
              </Alert>
              {email && (
                <Button
                  onClick={handleResendVerification}
                  disabled={resendVerification.isPending}
                  className="w-full"
                >
                  {resendVerification.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Resending...
                    </>
                  ) : (
                    'Resend Verification Email'
                  )}
                </Button>
              )}
            </div>
          )}

          {verificationStatus === 'idle' && !token && (
            <div className="space-y-6">
              <div className="rounded-lg bg-primary/5 p-4">
                <div className="flex items-center space-x-3">
                  <Mail className="h-5 w-5 text-primary" />
                  <p className="font-medium">Verification Email Sent</p>
                </div>
                <p className="mt-2 text-sm text-muted-foreground">
                  We've sent a verification link to{' '}
                  <span className="font-medium text-foreground">{email}</span>.
                  Please check your inbox and click the link to verify your account.
                </p>
              </div>
              
              <div className="space-y-4">
                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t" />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-background px-2 text-muted-foreground">
                      Haven't received the email?
                    </span>
                  </div>
                </div>

                <div className="text-center">
                  <Button
                    variant="outline"
                    onClick={handleResendVerification}
                    disabled={resendVerification.isPending}
                    className="mx-auto"
                  >
                    {resendVerification.isPending ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Resending...
                      </>
                    ) : (
                      'Resend Verification Email'
                    )}
                  </Button>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
} 