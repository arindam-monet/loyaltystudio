import { Button } from '@/components/ui/button';
import { ArrowRight, CheckCircle2, Zap, Code, BarChart, Shield, Settings } from 'lucide-react';

export default function FeaturesPage() {
  return (
    <div className="flex flex-col gap-16">
      {/* Hero Section */}
      <section className="container flex flex-col items-center justify-center gap-4 py-24 text-center md:py-32">
        <h1 className="text-3xl font-bold leading-tight tracking-tighter md:text-5xl lg:leading-[1.1]">
          Everything You Need to Build
          <br />
          <span className="text-primary">Powerful Loyalty Programs</span>
        </h1>
        <p className="max-w-[750px] text-lg text-muted-foreground sm:text-xl">
          From simple points programs to complex tiered rewards, LoyaltyStudio provides all the tools
          you need to create and manage successful loyalty programs.
        </p>
      </section>

      {/* Core Features */}
      <section className="container py-12">
        <div className="grid gap-8 md:grid-cols-2">
          <div className="flex flex-col gap-4 rounded-lg border p-8">
            <Zap className="h-12 w-12 text-primary" />
            <h2 className="text-2xl font-bold">Lightning Fast Performance</h2>
            <p className="text-muted-foreground">
              Built with performance in mind, our platform delivers instant rewards and real-time updates.
              Experience sub-second response times and handle millions of transactions without breaking a sweat.
            </p>
            <ul className="mt-4 space-y-2">
              <li className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-primary" />
                <span>Sub-second response times</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-primary" />
                <span>Real-time updates</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-primary" />
                <span>High availability</span>
              </li>
            </ul>
          </div>

          <div className="flex flex-col gap-4 rounded-lg border p-8">
            <Code className="h-12 w-12 text-primary" />
            <h2 className="text-2xl font-bold">Developer-First API</h2>
            <p className="text-muted-foreground">
              Our powerful API makes it easy to integrate with any e-commerce platform or custom solution.
              Built with modern standards and comprehensive documentation.
            </p>
            <ul className="mt-4 space-y-2">
              <li className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-primary" />
                <span>RESTful API</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-primary" />
                <span>Webhook support</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-primary" />
                <span>SDK support</span>
              </li>
            </ul>
          </div>

          <div className="flex flex-col gap-4 rounded-lg border p-8">
            <BarChart className="h-12 w-12 text-primary" />
            <h2 className="text-2xl font-bold">Advanced Analytics</h2>
            <p className="text-muted-foreground">
              Get deep insights into your loyalty program with detailed analytics and reporting.
              Track engagement, redemption rates, and customer behavior.
            </p>
            <ul className="mt-4 space-y-2">
              <li className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-primary" />
                <span>Real-time dashboards</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-primary" />
                <span>Custom reports</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-primary" />
                <span>Data export</span>
              </li>
            </ul>
          </div>

          <div className="flex flex-col gap-4 rounded-lg border p-8">
            <Shield className="h-12 w-12 text-primary" />
            <h2 className="text-2xl font-bold">Enterprise Security</h2>
            <p className="text-muted-foreground">
              Built with security in mind, our platform follows industry best practices and
              provides enterprise-grade security features.
            </p>
            <ul className="mt-4 space-y-2">
              <li className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-primary" />
                <span>Data encryption</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-primary" />
                <span>Access control</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-primary" />
                <span>Audit logging</span>
              </li>
            </ul>
          </div>
        </div>
      </section>

      {/* Additional Features */}
      <section className="container py-12">
        <h2 className="mb-8 text-center text-3xl font-bold">Additional Features</h2>
        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
          <div className="flex flex-col gap-4 rounded-lg border p-6">
            <Settings className="h-8 w-8 text-primary" />
            <h3 className="text-xl font-semibold">Rule Builder</h3>
            <p className="text-muted-foreground">
              Create complex reward rules with our visual rule builder. No coding required.
            </p>
          </div>
          <div className="flex flex-col gap-4 rounded-lg border p-6">
            <Settings className="h-8 w-8 text-primary" />
            <h3 className="text-xl font-semibold">Multi-tenant</h3>
            <p className="text-muted-foreground">
              Built for scale with multi-tenant architecture. Perfect for agencies and enterprises.
            </p>
          </div>
          <div className="flex flex-col gap-4 rounded-lg border p-6">
            <Settings className="h-8 w-8 text-primary" />
            <h3 className="text-xl font-semibold">White Label</h3>
            <p className="text-muted-foreground">
              Fully customizable with white-label options. Make it your own brand.
            </p>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="container flex flex-col items-center justify-center gap-4 py-12 text-center">
        <h2 className="text-2xl font-bold md:text-3xl">
          Ready to Get Started?
        </h2>
        <p className="max-w-[600px] text-muted-foreground">
          Join thousands of businesses using LoyaltyStudio to build stronger customer relationships.
        </p>
        <Button size="lg" className="gap-2">
          Start Free Trial <ArrowRight className="h-4 w-4" />
        </Button>
      </section>
    </div>
  );
} 