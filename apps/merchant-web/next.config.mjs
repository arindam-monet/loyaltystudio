/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ["@loyaltystudio/ui"],
  // Disable static rendering for pages that use useSearchParams()
  experimental: {
    missingSuspenseWithCSRBailout: false,
  },
}

export default nextConfig
