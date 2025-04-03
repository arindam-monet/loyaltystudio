'use client';

import { useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useToast } from '@loyaltystudio/ui';
import { Button } from '@loyaltystudio/ui';
import { ArrowRight, BarChart3, Gift, Globe, Lock, Shield, Users, ChevronRight, Star, Award, Zap } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';

export default function HomePage() {
  const router = useRouter();
  const { toast } = useToast();

  useEffect(() => {
    // Only handle email verification success
    const hash = window.location.hash;
    if (hash) {
      try {
        const params = new URLSearchParams(hash.substring(1));
        const type = params.get('type');
        
        if (type === 'signup') {
          toast({
            title: "Email Verified Successfully!",
            description: "Your email has been verified. You can now log in to your account.",
            duration: 5000,
          });
          setTimeout(() => {
            router.push('/login');
          }, 1000);
        }
      } catch (error) {
        console.error('Error processing verification:', error);
      }
    }
  }, [router, toast]);

  return (
    <div className="flex flex-col min-h-screen bg-gradient-to-b from-background to-background/95">
      {/* Navigation */}
      <nav className="border-b py-4 px-6 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-8">
            <Link href="/" className="font-semibold text-xl">
              LoyaltyStudio
            </Link>
            <div className="hidden md:flex items-center gap-8">
              <Link href="#features" className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors">
                Features
              </Link>
              <Link href="#solutions" className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors">
                Solutions
              </Link>
              <Link href="#pricing" className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors">
                Pricing
              </Link>
              <Link href="/docs" className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors">
                Documentation
              </Link>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <Link href="/login">
              <Button variant="ghost" className="font-medium">Sign In</Button>
            </Link>
            <Link href="/register">
              <Button className="font-medium bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary">
                Book a Demo
              </Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="py-24 px-6 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-primary/5 to-transparent" />
        <div className="max-w-7xl mx-auto relative">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div>
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary mb-8">
                <Star className="w-4 h-4" />
                <span className="text-sm font-medium">Recognized by Google and Deloitte</span>
              </div>
              <h1 className="text-6xl font-bold leading-tight mb-6 bg-gradient-to-r from-primary to-primary/80 bg-clip-text text-transparent">
                API-first loyalty software
              </h1>
              <p className="text-xl text-muted-foreground mb-8 leading-relaxed">
                Build and scale your loyalty program with our powerful API-first platform. Drive customer retention and growth with customizable rewards.
              </p>
              <div className="flex gap-4">
                <Link href="/register">
                  <Button size="lg" className="bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary">
                    Book a Demo
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
                <Link href="/docs">
                  <Button variant="outline" size="lg">
                    Get Product Sheet
                  </Button>
                </Link>
              </div>
              <div className="mt-12 pt-12 border-t">
                <p className="text-sm text-muted-foreground mb-4">Trusted by great companies</p>
                <div className="grid grid-cols-4 gap-8">
                  {/* Replace with actual company logos */}
                  <div className="h-8 bg-muted/20 rounded" />
                  <div className="h-8 bg-muted/20 rounded" />
                  <div className="h-8 bg-muted/20 rounded" />
                  <div className="h-8 bg-muted/20 rounded" />
                </div>
              </div>
            </div>
            <div className="relative">
              <div className="absolute -inset-4 bg-gradient-to-r from-primary/10 to-primary/5 rounded-3xl blur-3xl" />
              <div className="relative bg-card border rounded-2xl shadow-2xl overflow-hidden">
                <Image
                  src="/dashboard-preview.png"
                  alt="Dashboard Preview"
                  width={800}
                  height={600}
                  className="w-full"
                  priority
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Metrics Section */}
      <section className="py-24 px-6 bg-gradient-to-b from-primary/5 to-background relative">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-12">
            <div className="text-center">
              <div className="text-5xl font-bold mb-2 bg-gradient-to-r from-primary to-primary/80 bg-clip-text text-transparent">120ms</div>
              <div className="text-sm font-medium text-muted-foreground">Average Response Time</div>
            </div>
            <div className="text-center">
              <div className="text-5xl font-bold mb-2 bg-gradient-to-r from-primary to-primary/80 bg-clip-text text-transparent">99.99%</div>
              <div className="text-sm font-medium text-muted-foreground">Uptime SLA</div>
            </div>
            <div className="text-center">
              <div className="text-5xl font-bold mb-2 bg-gradient-to-r from-primary to-primary/80 bg-clip-text text-transparent">50M+</div>
              <div className="text-sm font-medium text-muted-foreground">API Requests/Day</div>
            </div>
            <div className="text-center">
              <div className="text-5xl font-bold mb-2 bg-gradient-to-r from-primary to-primary/80 bg-clip-text text-transparent">800M+</div>
              <div className="text-sm font-medium text-muted-foreground">Loyalty Events/Year</div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-24 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-4xl font-bold mb-6">Use LoyaltyStudio to do the job for you</h2>
            <p className="text-lg text-muted-foreground">
              Leverage our powerful features to build and scale your loyalty program faster than developing in-house.
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            {/* For Marketers */}
            <div className="group relative">
              <div className="absolute -inset-4 bg-gradient-to-r from-primary/10 to-transparent rounded-3xl blur-3xl opacity-0 group-hover:opacity-100 transition-opacity" />
              <div className="relative p-8 rounded-2xl border bg-card hover:border-primary/50 transition-colors">
                <div className="h-12 w-12 rounded-2xl bg-primary/10 flex items-center justify-center mb-6">
                  <Gift className="h-6 w-6 text-primary" />
                </div>
                <h3 className="text-xl font-semibold mb-4">For Marketers</h3>
                <p className="text-muted-foreground mb-6">
                  Achieve your KPIs and prove the impact of your loyalty project with market-proven strategies.
                </p>
                <Link href="/solutions/marketers" className="inline-flex items-center text-primary font-medium hover:underline">
                  Learn more
                  <ChevronRight className="ml-1 h-4 w-4" />
                </Link>
              </div>
            </div>

            {/* For Developers */}
            <div className="group relative">
              <div className="absolute -inset-4 bg-gradient-to-r from-primary/10 to-transparent rounded-3xl blur-3xl opacity-0 group-hover:opacity-100 transition-opacity" />
              <div className="relative p-8 rounded-2xl border bg-card hover:border-primary/50 transition-colors">
                <div className="h-12 w-12 rounded-2xl bg-primary/10 flex items-center justify-center mb-6">
                  <Globe className="h-6 w-6 text-primary" />
                </div>
                <h3 className="text-xl font-semibold mb-4">For Developers</h3>
                <p className="text-muted-foreground mb-6">
                  Save time with our API-first approach and ready-to-implement loyalty modules.
                </p>
                <Link href="/solutions/developers" className="inline-flex items-center text-primary font-medium hover:underline">
                  Learn more
                  <ChevronRight className="ml-1 h-4 w-4" />
                </Link>
              </div>
            </div>

            {/* For Product Managers */}
            <div className="group relative">
              <div className="absolute -inset-4 bg-gradient-to-r from-primary/10 to-transparent rounded-3xl blur-3xl opacity-0 group-hover:opacity-100 transition-opacity" />
              <div className="relative p-8 rounded-2xl border bg-card hover:border-primary/50 transition-colors">
                <div className="h-12 w-12 rounded-2xl bg-primary/10 flex items-center justify-center mb-6">
                  <Zap className="h-6 w-6 text-primary" />
                </div>
                <h3 className="text-xl font-semibold mb-4">For Product Managers</h3>
                <p className="text-muted-foreground mb-6">
                  Enrich your product with loyalty and gamification features that drive engagement.
                </p>
                <Link href="/solutions/product-managers" className="inline-flex items-center text-primary font-medium hover:underline">
                  Learn more
                  <ChevronRight className="ml-1 h-4 w-4" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Enterprise Features */}
      <section className="py-24 px-6 bg-gradient-to-b from-primary/5 to-background">
        <div className="max-w-7xl mx-auto">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-4xl font-bold mb-6">Grow with an enterprise-grade loyalty program</h2>
            <p className="text-lg text-muted-foreground">
              Built for scale with enterprise security, reliability, and performance.
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {/* Core Capabilities */}
            <div className="p-6 rounded-xl border bg-card/50 backdrop-blur">
              <h3 className="text-lg font-semibold mb-4">Core Capabilities</h3>
              <ul className="space-y-3">
                <li className="flex items-center gap-3 text-muted-foreground">
                  <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Award className="h-4 w-4 text-primary" />
                  </div>
                  Campaign builder
                </li>
                <li className="flex items-center gap-3 text-muted-foreground">
                  <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Users className="h-4 w-4 text-primary" />
                  </div>
                  Custom events
                </li>
                <li className="flex items-center gap-3 text-muted-foreground">
                  <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
                    <BarChart3 className="h-4 w-4 text-primary" />
                  </div>
                  Loyalty analytics
                </li>
              </ul>
            </div>

            {/* Security & Compliance */}
            <div className="p-6 rounded-xl border bg-card/50 backdrop-blur">
              <h3 className="text-lg font-semibold mb-4">Security & Compliance</h3>
              <ul className="space-y-3">
                <li className="flex items-center gap-3 text-muted-foreground">
                  <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Shield className="h-4 w-4 text-primary" />
                  </div>
                  ISO 27001 certified
                </li>
                <li className="flex items-center gap-3 text-muted-foreground">
                  <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Lock className="h-4 w-4 text-primary" />
                  </div>
                  GDPR compliant
                </li>
                <li className="flex items-center gap-3 text-muted-foreground">
                  <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Shield className="h-4 w-4 text-primary" />
                  </div>
                  Enterprise SSO
                </li>
              </ul>
            </div>

            {/* Integration */}
            <div className="p-6 rounded-xl border bg-card/50 backdrop-blur">
              <h3 className="text-lg font-semibold mb-4">Integration</h3>
              <ul className="space-y-3">
                <li className="flex items-center gap-3 text-muted-foreground">
                  <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Globe className="h-4 w-4 text-primary" />
                  </div>
                  REST API
                </li>
                <li className="flex items-center gap-3 text-muted-foreground">
                  <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Zap className="h-4 w-4 text-primary" />
                  </div>
                  Webhooks
                </li>
                <li className="flex items-center gap-3 text-muted-foreground">
                  <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Globe className="h-4 w-4 text-primary" />
                  </div>
                  SDK support
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl font-bold mb-6">Ready to transform your loyalty program?</h2>
          <p className="text-xl text-muted-foreground mb-8">
            Join thousands of businesses using LoyaltyStudio to drive customer retention and growth.
          </p>
          <div className="flex gap-4 justify-center">
            <Link href="/register">
              <Button size="lg" className="bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary">
                Book a Demo
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
            <Link href="/contact">
              <Button variant="outline" size="lg">
                Contact Sales
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t py-16 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-12">
            <div>
              <h3 className="font-semibold mb-4">Product</h3>
              <ul className="space-y-2">
                <li><Link href="#features" className="text-sm text-muted-foreground hover:text-primary transition-colors">Features</Link></li>
                <li><Link href="#pricing" className="text-sm text-muted-foreground hover:text-primary transition-colors">Pricing</Link></li>
                <li><Link href="/docs" className="text-sm text-muted-foreground hover:text-primary transition-colors">Documentation</Link></li>
                <li><Link href="/changelog" className="text-sm text-muted-foreground hover:text-primary transition-colors">Changelog</Link></li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-4">Solutions</h3>
              <ul className="space-y-2">
                <li><Link href="/solutions/marketers" className="text-sm text-muted-foreground hover:text-primary transition-colors">For Marketers</Link></li>
                <li><Link href="/solutions/developers" className="text-sm text-muted-foreground hover:text-primary transition-colors">For Developers</Link></li>
                <li><Link href="/solutions/product-managers" className="text-sm text-muted-foreground hover:text-primary transition-colors">For Product Managers</Link></li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-4">Company</h3>
              <ul className="space-y-2">
                <li><Link href="/about" className="text-sm text-muted-foreground hover:text-primary transition-colors">About</Link></li>
                <li><Link href="/blog" className="text-sm text-muted-foreground hover:text-primary transition-colors">Blog</Link></li>
                <li><Link href="/careers" className="text-sm text-muted-foreground hover:text-primary transition-colors">Careers</Link></li>
                <li><Link href="/contact" className="text-sm text-muted-foreground hover:text-primary transition-colors">Contact</Link></li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-4">Legal</h3>
              <ul className="space-y-2">
                <li><Link href="/privacy" className="text-sm text-muted-foreground hover:text-primary transition-colors">Privacy Policy</Link></li>
                <li><Link href="/terms" className="text-sm text-muted-foreground hover:text-primary transition-colors">Terms of Service</Link></li>
                <li><Link href="/security" className="text-sm text-muted-foreground hover:text-primary transition-colors">Security</Link></li>
                <li><Link href="/gdpr" className="text-sm text-muted-foreground hover:text-primary transition-colors">GDPR</Link></li>
              </ul>
            </div>
          </div>
          <div className="mt-16 pt-8 border-t text-center">
            <p className="text-sm text-muted-foreground">&copy; {new Date().getFullYear()} LoyaltyStudio. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
} 