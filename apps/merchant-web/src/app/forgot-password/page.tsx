'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForgotPassword } from '@/hooks/use-auth';
import { Button, Card, CardContent, CardDescription, CardHeader, CardTitle, Input, Alert, AlertDescription } from '@loyaltystudio/ui';
import { Loader2, Mail, ArrowLeft } from 'lucide-react';

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const forgotPassword = useForgotPassword();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    try {
      await forgotPassword.mutateAsync(email);
      setSubmitted(true);
    } catch (error) {
      // Error is handled by the mutation
    }
  };

  return (
    <div className="container flex items-center justify-center min-h-screen py-12">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4">
            <Mail className="h-12 w-12 text-primary" />
          </div>
          <CardTitle className="text-2xl">Reset Password</CardTitle>
          <CardDescription className="text-base">
            Enter your email address and we'll send you a link to reset your password.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {submitted ? (
            <div className="space-y-6">
              <div className="rounded-lg bg-primary/5 p-4">
                <div className="flex items-center space-x-3">
                  <Mail className="h-5 w-5 text-primary" />
                  <p className="font-medium">Check Your Email</p>
                </div>
                <p className="mt-2 text-sm text-muted-foreground">
                  We've sent a password reset link to{' '}
                  <span className="font-medium text-foreground">{email}</span>.
                  Please check your inbox and click the link to reset your password.
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

                <div className="text-center space-y-4">
                  <Button
                    variant="outline"
                    onClick={() => setSubmitted(false)}
                    disabled={forgotPassword.isPending}
                    className="mx-auto"
                  >
                    Try again with a different email
                  </Button>
                  
                  <Button
                    variant="link"
                    onClick={() => router.push('/login')}
                    className="mx-auto"
                  >
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Back to login
                  </Button>
                </div>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {forgotPassword.isError && (
                <Alert variant="destructive">
                  <AlertDescription>
                    {forgotPassword.error?.message || 'Failed to send reset password email. Please try again.'}
                  </AlertDescription>
                </Alert>
              )}

              <div className="space-y-2">
                <Input
                  type="email"
                  placeholder="Enter your email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  disabled={forgotPassword.isPending}
                />
              </div>

              <div className="space-y-4">
                <Button
                  type="submit"
                  className="w-full"
                  disabled={forgotPassword.isPending || !email}
                >
                  {forgotPassword.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Sending...
                    </>
                  ) : (
                    'Send Reset Link'
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
          )}
        </CardContent>
      </Card>
    </div>
  );
} 