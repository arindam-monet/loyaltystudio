import Link from 'next/link';
import { Button } from '@loyaltystudio/ui';
import { ArrowRight, Building2, Users, Award, BarChart } from 'lucide-react';
import Image from 'next/image';

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-gray-50">
      {/* Hero Section */}
      <div className="relative isolate overflow-hidden max-h-[calc(100vh-80px)]">
        <div className="mx-auto max-w-7xl px-6 pb-16 pt-10 sm:pb-24 lg:flex lg:px-8 lg:py-24">
          <div className="mx-auto max-w-2xl flex-shrink-0 lg:mx-0 lg:max-w-xl lg:pt-8">
            <div className="mt-16 sm:mt-24 lg:mt-8">
              <span className="rounded-full bg-indigo-500/10 px-3 py-1 text-sm font-semibold leading-6 text-indigo-600 ring-1 ring-inset ring-indigo-500/20">
                Launching Soon
              </span>
            </div>
            <h1 className="mt-8 text-4xl font-bold tracking-tight text-gray-900 sm:text-6xl">
              Transform Your Business with Loyalty Studio
            </h1>
            <p className="mt-6 text-lg leading-8 text-gray-600">
              Create and manage powerful loyalty programs that drive customer engagement and boost revenue. Perfect for businesses of all sizes.
            </p>
            <div className="mt-8 flex items-center gap-x-6">
              <Link href="/register">
                <Button size="lg" className="gap-2">
                  Get Started <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
              <Link href="#features" className="text-sm font-semibold leading-6 text-gray-900">
                Learn more <span aria-hidden="true">→</span>
              </Link>
            </div>
          </div>
          <div className="mx-auto mt-8 flex max-w-2xl sm:mt-16 lg:ml-10 lg:mr-0 lg:mt-0 lg:max-w-none lg:flex-none xl:ml-32">
            <div className="max-w-3xl flex-none sm:max-w-5xl lg:max-w-none">
              <div className="relative rounded-xl bg-white/5 p-2 ring-1 ring-inset ring-white/10">
                <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-indigo-500/20 to-purple-500/20 blur-2xl" />
                <div className="relative rounded-xl bg-white p-4 shadow-2xl">
                  <Image
                    src="/dashboard-preview.png"
                    alt="Loyalty Studio Dashboard Preview"
                    width={1920}
                    height={1080}
                    className="rounded-lg shadow-xl ring-1 ring-gray-900/10"
                    priority
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div id="features" className="mx-auto max-w-7xl px-6 lg:px-8 py-24 sm:py-32">
        <div className="mx-auto max-w-2xl lg:text-center">
          <h2 className="text-base font-semibold leading-7 text-indigo-600">Everything you need</h2>
          <p className="mt-2 text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
            Powerful features for your loyalty program
          </p>
          <p className="mt-6 text-lg leading-8 text-gray-600">
            From program setup to customer engagement, we've got you covered with all the tools you need to run a successful loyalty program.
          </p>
        </div>
        <div className="mx-auto mt-16 max-w-2xl sm:mt-20 lg:mt-24 lg:max-w-none">
          <dl className="grid max-w-xl grid-cols-1 gap-x-8 gap-y-16 lg:max-w-none lg:grid-cols-3">
            <div className="flex flex-col">
              <dt className="flex items-center gap-x-3 text-base font-semibold leading-7 text-gray-900">
                <Building2 className="h-5 w-5 flex-none text-indigo-600" aria-hidden="true" />
                Multi-Business Management
              </dt>
              <dd className="mt-4 flex flex-auto flex-col text-base leading-7 text-gray-600">
                <p className="flex-auto">Manage multiple businesses under one account with separate loyalty programs and settings.</p>
              </dd>
            </div>
            <div className="flex flex-col">
              <dt className="flex items-center gap-x-3 text-base font-semibold leading-7 text-gray-900">
                <Users className="h-5 w-5 flex-none text-indigo-600" aria-hidden="true" />
                Team Collaboration
              </dt>
              <dd className="mt-4 flex flex-auto flex-col text-base leading-7 text-gray-600">
                <p className="flex-auto">Invite team members and manage roles with granular permissions for each business.</p>
              </dd>
            </div>
            <div className="flex flex-col">
              <dt className="flex items-center gap-x-3 text-base font-semibold leading-7 text-gray-900">
                <Award className="h-5 w-5 flex-none text-indigo-600" aria-hidden="true" />
                Custom Rewards
              </dt>
              <dd className="mt-4 flex flex-auto flex-col text-base leading-7 text-gray-600">
                <p className="flex-auto">Create custom rewards and tiers to match your business needs and customer preferences.</p>
              </dd>
            </div>
            <div className="flex flex-col">
              <dt className="flex items-center gap-x-3 text-base font-semibold leading-7 text-gray-900">
                <BarChart className="h-5 w-5 flex-none text-indigo-600" aria-hidden="true" />
                Analytics & Insights
              </dt>
              <dd className="mt-4 flex flex-auto flex-col text-base leading-7 text-gray-600">
                <p className="flex-auto">Track program performance with detailed analytics and actionable insights.</p>
              </dd>
            </div>
          </dl>
        </div>
      </div>

      {/* CTA Section */}
      <div className="relative isolate mt-32 px-6 py-32 sm:mt-56 sm:py-40 lg:px-8">
        <div className="absolute inset-x-0 top-1/2 -z-10 -translate-y-1/2 transform-gpu overflow-hidden opacity-30 blur-3xl">
          <div className="ml-[max(50%,38rem)] aspect-[1313/771] w-[82.0625rem] bg-gradient-to-tr from-[#ff80b5] to-[#9089fc]" />
        </div>
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
            Ready to get started?
          </h2>
          <p className="mx-auto mt-6 max-w-xl text-lg leading-8 text-gray-600">
            Join businesses like Lloyds Banking Group in transforming their customer loyalty programs.
          </p>
          <div className="mt-10 flex items-center justify-center gap-x-6">
            <Link href="/register">
              <Button size="lg" className="gap-2">
                Start Your Journey <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
            <Link href="/contact" className="text-sm font-semibold leading-6 text-gray-900">
              Contact Sales <span aria-hidden="true">→</span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
} 