import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Define public paths that don't require authentication
const publicPaths = [
  '/',
  '/login',
  '/register',
  '/verify-email',
  '/forgot-password',
  '/reset-password',
  '/api/auth',
];

// Define paths that require email verification
const verifiedPaths = [
  '/dashboard',
  '/settings',
  '/team',
  '/merchants',
  '/programs',
  '/rewards',
  '/analytics',
];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Debug logging
  console.log('Middleware processing request:', {
    pathname,
    method: request.method,
  });

  // Allow public paths
  if (publicPaths.some(path => pathname === path || pathname.startsWith(path + '/'))) {
    console.log('Allowing public path:', pathname);
    return NextResponse.next();
  }

  // For protected routes, we'll let the client-side handle auth state
  // The client will check auth state and redirect if needed
  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!_next/static|_next/image|favicon.ico|public).*)',
  ],
}; 