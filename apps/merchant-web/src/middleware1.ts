import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { jwtVerify } from 'jose';

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

interface SupabaseJWT {
  user_metadata: {
    email_verified: boolean;
    email: string;
    tenant_id: string;
    role: string;
  };
  email: string;
  sub: string;
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Allow public paths
  if (publicPaths.some(path => pathname === path || pathname.startsWith(path + '/'))) {
    return NextResponse.next();
  }

  // Check for Authorization header
  const authHeader = request.headers.get('Authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('redirect', pathname);
    return NextResponse.redirect(loginUrl);
  }

  try {
    // Verify JWT token
    const token = authHeader.split(' ')[1];
    const secret = new TextEncoder().encode(process.env.JWT_SECRET || process.env.NEXT_PUBLIC_SUPABASE_JWT_SECRET);
    const { payload } = await jwtVerify(token, secret);
    const supabasePayload = payload as unknown as SupabaseJWT;

    // Check if email is verified for protected routes
    if (!supabasePayload.user_metadata.email_verified && verifiedPaths.some(path => pathname === path || pathname.startsWith(path + '/'))) {
      const verifyUrl = new URL('/verify-email', request.url);
      verifyUrl.searchParams.set('email', supabasePayload.email);
      return NextResponse.redirect(verifyUrl);
    }

    // Allow access to verified routes
    return NextResponse.next();
  } catch (error) {
    // If token is invalid, redirect to login
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('redirect', pathname);
    return NextResponse.redirect(loginUrl);
  }
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