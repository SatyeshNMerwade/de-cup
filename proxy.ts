import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

import { decrypt, SESSION_COOKIE_NAME } from '@/lib/auth/session';

/**
 * Optimistic route protection: cookie-only check (no DB round trip), since
 * this runs on every request including prefetches. The real, DB-verified
 * check lives in lib/auth/dal.ts's requireUser(), called by every admin
 * page and every mutating Server Action.
 */
export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const isAdminRoute = pathname.startsWith('/admin');
  const isLoginRoute = pathname === '/auth/login';

  if (!isAdminRoute && !isLoginRoute) {
    return NextResponse.next();
  }

  const token = request.cookies.get(SESSION_COOKIE_NAME)?.value;
  const session = await decrypt(token);

  if (isAdminRoute && !session?.userId) {
    const loginUrl = new URL('/auth/login', request.url);
    loginUrl.searchParams.set('next', pathname);
    return NextResponse.redirect(loginUrl);
  }

  if (isLoginRoute && session?.userId) {
    return NextResponse.redirect(new URL('/admin', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/admin/:path*', '/auth/login'],
};
