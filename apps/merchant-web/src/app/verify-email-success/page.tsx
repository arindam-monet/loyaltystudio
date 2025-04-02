'use client';

import { useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, Button } from '@loyaltystudio/ui';
import { CheckCircle2 } from 'lucide-react';
import Link from 'next/link';

export default function VerifyEmailSuccessPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const email = searchParams.get('email');

  useEffect(() => {
    // Automatically redirect to login page after 5 seconds
    const timer = setTimeout(() => {
      router.push('/login');
    }, 5000);

    return () => clearTimeout(timer);
  }, [router]);

  return (
    <div className="container flex items-center justify-center min-h-screen py-12">
      <Card className="w-full max-w-md">
        <CardHeader>
          <div className="flex items-center justify-center mb-4">
            <CheckCircle2 className="h-12 w-12 text-green-500" />
          </div>
          <CardTitle className="text-2xl text-center">Email Verified Successfully!</CardTitle>
          <CardDescription className="text-center">
            Your email has been verified. You can now log in to your account.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-center text-muted-foreground">
            {email ? `Email ${email} has been verified.` : 'Your email has been verified.'}
          </p>
          <div className="flex flex-col gap-2">
            <Button asChild className="w-full">
              <Link href="/login">
                Go to Login
              </Link>
            </Button>
            <p className="text-sm text-center text-muted-foreground">
              You will be redirected automatically in 5 seconds...
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 