import Link from 'next/link';
import { Button, Input } from '@loyaltystudio/ui';
import { ArrowRight, Building2, Users, Award, BarChart } from 'lucide-react';
import Image from 'next/image';

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Navigation */}
      <nav className="px-6 py-4 flex items-center justify-between max-w-7xl mx-auto">
        <div className="flex items-center space-x-8">
          <Link href="/" className="text-2xl font-bold">
            LoyaltyStudio
          </Link>
          <div className="hidden md:flex space-x-6">
            <Link href="#features" className="text-gray-600 hover:text-gray-900">
              Features
            </Link>
            <Link href="#about" className="text-gray-600 hover:text-gray-900">
              About us
            </Link>
            <Link href="#cases" className="text-gray-600 hover:text-gray-900">
              Cases
            </Link>
          </div>
        </div>
        <div className="flex items-center space-x-4">
          <Link href="/login">
            <Button variant="ghost">Login</Button>
          </Link>
          <Link href="/register">
            <Button>Register</Button>
          </Link>
        </div>
      </nav>

      {/* Hero Section */}
      <div className="max-w-7xl mx-auto px-6 py-12 md:py-20">
        <div className="flex flex-col md:flex-row gap-12">
          {/* Left Column */}
          <div className="w-full md:w-1/2 md:pr-12">
            <h1 className="text-4xl md:text-6xl font-bold leading-tight mb-6">
              Put people{' '}
              <span className="relative">
                first
                <span className="absolute bottom-2 left-0 w-full border-b-4 border-primary"></span>
              </span>
            </h1>
            <p className="text-lg md:text-xl text-gray-600 mb-8">
              Fast, user-friendly and engaging - turn customer loyalty into 
              meaningful relationships and streamline your daily operations 
              with your own branded loyalty program.
            </p>
            <div className="flex flex-col space-y-6 max-w-md">
              <div className="flex flex-col sm:flex-row gap-2 sm:gap-0 h-10">
                <Input
                  type="email"
                  placeholder="Enter work email"
                  className="w-full sm:w-auto flex-1 h-full rounded-lg sm:rounded-r-none border sm:border-r-0 border-gray-300 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                />
                <Button className="w-full sm:w-auto sm:rounded-l-none">
                  Book a demo
                </Button>
              </div>
              
              {/* Stats */}
              <div className="flex flex-col sm:flex-row sm:space-x-12 space-y-6 sm:space-y-0 mt-12">
                <div>
                  <div className="text-3xl md:text-4xl font-bold">75.2%</div>
                  <div className="text-gray-600">Average daily activity</div>
                </div>
                <div>
                  <div className="text-3xl md:text-4xl font-bold">~20k</div>
                  <div className="text-gray-600">Average daily users</div>
                </div>
              </div>
              
              {/* Rating */}
              <div className="flex items-center space-x-2">
                <div className="flex">
                  {'★★★★☆'.split('').map((star, i) => (
                    <span key={i} className="text-primary text-xl">
                      {star}
                    </span>
                  ))}
                </div>
                <span className="font-semibold">4.5</span>
                <span className="text-gray-600">Average user rating</span>
              </div>
            </div>
          </div>

          {/* Right Column - App Preview */}
          <div className="w-full md:w-1/2">
            <div className="relative">
              <div className="w-full aspect-[4/3] bg-gray-100 rounded-lg shadow-xl transform rotate-3 translate-y-4"></div>
              <div className="absolute inset-0 w-full aspect-[4/3] bg-white rounded-lg shadow-xl -rotate-3"></div>
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