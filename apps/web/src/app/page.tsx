import Link from "next/link"
import { Button } from '@loyaltystudio/ui'
import { ArrowRight, CheckCircle2, Zap } from 'lucide-react'

export default function Home() {
  return (
    <div className="flex flex-col gap-16">
      {/* Hero Section */}
      <section className="container flex flex-col items-center justify-center gap-4 py-24 text-center md:py-32">
        <h1 className="text-3xl font-bold leading-tight tracking-tighter md:text-5xl lg:leading-[1.1]">
          Build Powerful Loyalty Programs
          <br />
          <span className="text-primary">Without the Complexity</span>
        </h1>
        <p className="max-w-[750px] text-lg text-muted-foreground sm:text-xl">
          LoyaltyStudio is a headless loyalty platform that helps you create, manage, and scale
          personalized rewards programs. Integrate with any e-commerce system and delight your customers.
        </p>
        <div className="flex flex-col gap-4 sm:flex-row">
          <Link href="/signup">
            <Button size="lg" className="gap-2">
              Get Started <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
          <Link href="/demo">
            <Button size="lg" variant="outline" className="gap-2">
              Request Demo
            </Button>
          </Link>
        </div>
      </section>

      {/* Features Section */}
      <section className="container py-12">
        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
          <div className="flex flex-col gap-4 rounded-lg border p-6">
            <Zap className="h-8 w-8 text-primary" />
            <h3 className="text-xl font-semibold">Lightning Fast</h3>
            <p className="text-muted-foreground">
              Built with performance in mind. Our platform delivers instant rewards and real-time updates.
            </p>
          </div>
          <div className="flex flex-col gap-4 rounded-lg border p-6">
            <CheckCircle2 className="h-8 w-8 text-primary" />
            <h3 className="text-xl font-semibold">Easy Integration</h3>
            <p className="text-muted-foreground">
              Connect with any e-commerce platform or custom solution through our powerful API.
            </p>
          </div>
          <div className="flex flex-col gap-4 rounded-lg border p-6">
            <CheckCircle2 className="h-8 w-8 text-primary" />
            <h3 className="text-xl font-semibold">Flexible Rules</h3>
            <p className="text-muted-foreground">
              Create complex reward rules with our visual rule builder. No coding required.
            </p>
          </div>
          <div className="flex flex-col gap-4 rounded-lg border p-6">
            <CheckCircle2 className="h-8 w-8 text-primary" />
            <h3 className="text-xl font-semibold">Multi-tenant</h3>
            <p className="text-muted-foreground">
              Built for scale with multi-tenant architecture. Perfect for agencies and enterprises.
            </p>
          </div>
          <div className="flex flex-col gap-4 rounded-lg border p-6">
            <CheckCircle2 className="h-8 w-8 text-primary" />
            <h3 className="text-xl font-semibold">Analytics</h3>
            <p className="text-muted-foreground">
              Get insights into your loyalty program with detailed analytics and reporting.
            </p>
          </div>
          <div className="flex flex-col gap-4 rounded-lg border p-6">
            <CheckCircle2 className="h-8 w-8 text-primary" />
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
          Ready to Transform Your Customer Loyalty?
        </h2>
        <p className="max-w-[600px] text-muted-foreground">
          Join thousands of businesses using LoyaltyStudio to build stronger customer relationships.
        </p>
        <Link href="/signup">
          <Button size="lg" className="gap-2">
            Start Free Trial <ArrowRight className="h-4 w-4" />
          </Button>
        </Link>
      </section>
    </div>
  )
} 