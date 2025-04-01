import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import Cookies from 'js-cookie';

// Paths that don't require authentication
const publicPaths = [
  '/login',
  '/register',
  '/verify-email',
  '/forgot-password',
  '/reset-password'
];

// Paths that require email verification
const verifiedPaths = [
  '/merchant',
  '/merchant/dashboard',
  '/merchant/settings',
  '/merchant/team'
];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Allow public paths
  if (publicPaths.some(path => pathname.startsWith(path))) {
    return NextResponse.next();
  }

  // Check for token
  const token = request.cookies.get('token')?.value;
  if (!token) {
    const url = new URL('/login', request.url);
    url.searchParams.set('from', pathname);
    return NextResponse.redirect(url);
  }

  // Get user data from cookie
  const userCookie = request.cookies.get('user')?.value;
  if (!userCookie) {
    const url = new URL('/login', request.url);
    url.searchParams.set('from', pathname);
    return NextResponse.redirect(url);
  }

  try {
    const user = JSON.parse(userCookie);

    // Check email verification for protected paths
    if (verifiedPaths.some(path => pathname.startsWith(path)) && !user.emailVerified) {
      const url = new URL('/verify-email', request.url);
      url.searchParams.set('email', user.email);
      return NextResponse.redirect(url);
    }

    return NextResponse.next();
  } catch (error) {
    // If user data is invalid, redirect to login
    const url = new URL('/login', request.url);
    url.searchParams.set('from', pathname);
    return NextResponse.redirect(url);
  }
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
}; 