import 'server-only';

import { cache } from 'react';
import { cookies } from 'next/headers';
import { notFound, redirect } from 'next/navigation';
import { eq } from 'drizzle-orm';

import { db } from '@/lib/db';
import { users } from '@/database/schema';
import { UserRole } from '@/types/domain/user';

import { decrypt, SESSION_COOKIE_NAME } from './session';

/**
 * Optimistic check: decrypts the session cookie only, no DB round-trip.
 * Returns null instead of redirecting — callers decide what to do.
 */
export const verifySession = cache(async () => {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;
  const session = await decrypt(token);
  if (!session?.userId) return null;
  return { userId: session.userId, role: session.role };
});

/**
 * Secure check: re-fetches the user from the DB so a deactivated account
 * or changed role can't ride out an already-issued session token. Use this
 * (not verifySession) before any mutation.
 */
export const getCurrentUser = cache(async () => {
  const session = await verifySession();
  if (!session) return null;

  const user = await db.query.users.findFirst({
    where: eq(users.id, session.userId),
    columns: {
      id: true,
      username: true,
      displayName: true,
      role: true,
      isActive: true,
    },
  });

  if (!user || !user.isActive) return null;
  return user;
});

/** Redirects to /auth/login if there's no valid, active-user session. */
export const requireUser = cache(async () => {
  const user = await getCurrentUser();
  if (!user) {
    redirect('/auth/login');
  }
  return user;
});

/**
 * Same as requireUser, plus a role check for user-management routes. Renders
 * as a plain 404 rather than a distinct "forbidden" page — consistent with
 * this app's existing vague-on-purpose security style (see login()'s
 * deliberately generic error message), and doesn't confirm to a curious
 * regular admin that a users page even exists.
 */
export const requireSuperAdmin = cache(async () => {
  const user = await requireUser();
  if (user.role !== UserRole.SUPER_ADMIN) {
    notFound();
  }
  return user;
});
