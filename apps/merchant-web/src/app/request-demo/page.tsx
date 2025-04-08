'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@loyaltystudio/ui';
import { toast } from '@loyaltystudio/ui';
import Cal from '@calcom/embed-react';
import { LandingHeader } from '@/components/landing-header';
import { LandingFooter } from '@/components/landing-footer';

// Trusted brands logos
const TRUSTED_BRANDS = [
  { name: 'Brand 1', logo: '/images/placeholder-logo-1.svg' },
  { name: 'Brand 2', logo: '/images/placeholder-logo-2.svg' },
  { name: 'Brand 3', logo: '/images/placeholder-logo-3.svg' },
  { name: 'Brand 4', logo: '/images/placeholder-logo-4.svg' },
];

export default function RequestDemoPage() {
  const [success, setSuccess] = useState(false);
  const router = useRouter();
  const meetingUrl = process.env.NEXT_PUBLIC_CAL_BOOKING_URL || '';

  // Handle successful booking
  const handleBookingSuccess = () => {
    setSuccess(true);
    toast({
      title: 'Success!',
      description: 'Your demo has been scheduled successfully.',
    });
  };

  if (success) {
    return (
      <div className="min-h-screen flex flex-col">
        <LandingHeader />
        <main className="flex-1 flex items-center justify-center py-12">
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle>Thank You!</CardTitle>
              <CardDescription>
                Your demo has been scheduled successfully
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <p>
                We have received your booking and you should receive a calendar invitation shortly.
              </p>
              <p className="font-medium text-primary">
                We look forward to showing you how Loyalty Studio can help grow your business!
              </p>
              <div className="my-6 p-4 bg-muted rounded-lg">
                <h3 className="text-sm font-medium mb-2">What happens next?</h3>
                <ol className="list-decimal pl-5 space-y-1 text-sm">
                  <li>You'll receive a calendar invitation for your scheduled demo</li>
                  <li>Our team will prepare a personalized demo for your business</li>
                  <li>We'll meet at the scheduled time to show you the platform</li>
                  <li>After the demo, we'll set up your account so you can start building your loyalty program</li>
                </ol>
              </div>
              <Button
                className="w-full"
                onClick={() => router.push('/')}
              >
                Return to Home
              </Button>
            </CardContent>
          </Card>
        </main>
        <LandingFooter />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <LandingHeader />
      <main className="flex-1 bg-gradient-to-b from-background to-muted">
        {/* Hero Section */}
        <div className="container mx-auto px-4 py-12">
          <div className="text-center max-w-3xl mx-auto mb-12">
            <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-4 bg-gradient-to-r from-primary to-primary/70 text-transparent bg-clip-text">
              Let's build powerful loyalty programs together
            </h1>
            <p className="text-xl text-muted-foreground">
              Find out how you can create the best loyalty experience for your customers with Loyalty Studio
            </p>
          </div>

          {/* Testimonial and Brands Section */}
          <div className="flex flex-col md:flex-row gap-8 items-center justify-center mb-12">
            <div className="p-6 bg-muted rounded-lg border border-border max-w-md">
              <blockquote className="text-lg italic mb-4">
                "The initial 45 minutes where we ran through the top-level capabilities completely blew us away."
              </blockquote>
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-primary/20 flex items-center justify-center">
                  <span className="text-xs text-primary">JD</span>
                </div>
                <div>
                  <p className="font-medium">John Doe</p>
                  <p className="text-sm text-muted-foreground">Head of Digital, Example Corp</p>
                </div>
              </div>
            </div>

            <div className="space-y-4 max-w-md">
              <p className="text-sm font-medium uppercase text-muted-foreground text-center md:text-left">TRUSTED BY LEADING BRANDS</p>
              <div className="flex flex-wrap gap-6 items-center justify-center md:justify-start">
                {TRUSTED_BRANDS.map((brand, index) => (
                  <div key={index} className="h-8 w-24 bg-muted rounded flex items-center justify-center">
                    <span className="text-xs text-muted-foreground">{brand.name}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Calendar Section */}
          <div className="max-w-5xl mx-auto">
            <Card className="w-full shadow-lg border-primary/10">
              <CardHeader className="text-center pb-2">
                <CardTitle className="text-2xl">Schedule a Demo</CardTitle>
                <CardDescription>
                  Select a convenient time to learn how our loyalty platform can help grow your business
                </CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                <div className="min-h-[650px] w-full">
                  <Cal namespace="30min"
                    calLink={meetingUrl}
                    style={{ width: "100%", height: "100%", overflow: "scroll" }}
                    config={{ "layout": "month_view" }}
                    


                  />
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
      <LandingFooter />
    </div>
  );
}
