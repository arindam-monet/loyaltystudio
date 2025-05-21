import Link from "next/link"
import { Button } from '@loyaltystudio/ui'
import { ArrowRight, CheckCircle2, Zap, Briefcase, Code } from 'lucide-react'

export default function Home() {
  return (
    <div className="flex flex-col gap-16">
      {/* Hero Section */}
      <section className="container flex flex-col items-center justify-center gap-4 py-24 text-center md:py-32">
        <h1 className="text-3xl font-bold leading-tight tracking-tighter md:text-5xl lg:leading-[1.1]">
          Build Powerful, Headless Loyalty Programs
        </h1>
        <p className="max-w-[750px] text-lg text-muted-foreground sm:text-xl">
          LoyaltyStudio provides the flexible, API-first platform to create, manage, and scale
          personalized rewards programs that integrate seamlessly with any e-commerce system.
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
        <div className="mt-8 text-sm text-muted-foreground">
          Trusted by leading brands
        </div>
      </section>

      {/* Features Section */}
      <section className="container py-20"> {/* Increased padding */}
        {/* Core Capabilities */}
        <div className="mb-12">
          <h2 className="mb-8 text-center text-2xl font-bold md:text-3xl">
            Core Capabilities
          </h2>
          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
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
          </div>
        </div>

        {/* Platform Strengths */}
        <div>
          <h2 className="mb-8 text-center text-2xl font-bold md:text-3xl">
            Platform Strengths
          </h2>
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
        </div>
      </section>

      {/* Value Proposition Sections */}
      <section className="container py-20"> {/* Increased padding */}
        {/* For Growing Businesses Section */}
        <div className="mb-16 grid items-center gap-8 md:grid-cols-2">
          <div className="flex flex-col items-start gap-4">
            <Briefcase className="mb-4 h-12 w-12 text-primary" />
            <h2 className="text-2xl font-bold md:text-3xl">
              Empower Your Growth with Loyalty
            </h2>
            <p className="text-muted-foreground">
              Attract and retain high-value customers, boost engagement, and increase customer lifetime value with our flexible loyalty solutions. Understand your customers better with built-in analytics and scale your program as your business expands.
            </p>
            <ul className="mt-4 list-disc space-y-2 pl-5 text-muted-foreground">
              <li>Easy Campaign Management</li>
              <li>Detailed Customer Analytics</li>
              <li>Scalable Infrastructure</li>
            </ul>
          </div>
          {/* Placeholder for an image or graphic, if desired */}
          <div className="flex h-64 items-center justify-center rounded-lg border bg-muted md:h-auto">
             {/* You can add an <Image /> component here if you have a relevant visual */}
             <p className="text-sm text-muted-foreground">Illustrative Graphic/Image</p>
          </div>
        </div>

        {/* For Developers Section */}
        <div className="grid items-center gap-8 md:grid-cols-2">
          {/* Placeholder for an image or graphic, if desired */}
          <div className="flex h-64 items-center justify-center rounded-lg border bg-muted md:h-auto md:order-last">
            {/* You can add an <Image /> component here if you have a relevant visual */}
            <p className="text-sm text-muted-foreground">Illustrative Graphic/Image</p>
          </div>
          <div className="flex flex-col items-start gap-4 md:order-first">
            <Code className="mb-4 h-12 w-12 text-primary" />
            <h2 className="text-2xl font-bold md:text-3xl">
              Build Custom Loyalty Experiences, Faster
            </h2>
            <p className="text-muted-foreground">
              Integrate loyalty features seamlessly into your existing stack with our developer-friendly API. Save engineering hours with our headless platform, allowing you to focus on creating unique customer experiences without reinventing the wheel.
            </p>
            <ul className="mt-4 list-disc space-y-2 pl-5 text-muted-foreground">
              <li>Robust API & Webhooks</li>
              <li>Headless & Flexible</li>
              <li>Quick Integration</li>
            </ul>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="container flex flex-col items-center justify-center gap-6 py-24 text-center"> {/* Increased py and gap */}
        <h2 className="text-3xl font-bold tracking-tighter md:text-4xl lg:text-5xl"> {/* Increased text size */}
          Ready to Build a Loyalty Program That Drives Results?
        </h2>
        <p className="max-w-[750px] text-lg text-muted-foreground sm:text-xl"> {/* Increased max-width and text size */}
          Discover how LoyaltyStudio can help you increase customer retention, boost engagement, and maximize lifetime value. Get started today or request a personalized demo.
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
    </div>
  )
} 