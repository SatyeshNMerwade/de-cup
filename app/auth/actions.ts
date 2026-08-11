'use server';

import { eq } from 'drizzle-orm';
import { redirect } from 'next/navigation';
import { z } from 'zod';

import { db } from '@/lib/db';
import { users } from '@/database/schema';
import { verifyPassword } from '@/lib/auth/password';
import { createSession, deleteSession } from '@/lib/auth/session';

const LoginSchema = z.object({
  username: z.string().trim().min(1, 'Username is required.'),
  password: z.string().min(1, 'Password is required.'),
});

export interface LoginState {
  error?: string;
}

const MAX_FAILED_ATTEMPTS = 5;
const LOCKOUT_DURATION_MS = 15 * 60 * 1000;

export async function login(_prevState: LoginState | undefined, formData: FormData): Promise<LoginState> {
  const parsed = LoginSchema.safeParse({
    username: formData.get('username'),
    password: formData.get('password'),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? 'Invalid input.' };
  }

  // Deliberately vague on failure — don't reveal whether the username exists.
  const invalidCredentials: LoginState = { error: 'Invalid username or password.' };

  const user = await db.query.users.findFirst({ where: eq(users.username, parsed.data.username) });
  if (!user || !user.isActive) return invalidCredentials;

  // Only reachable after 5 real wrong guesses in a row — no per-attempt
  // enumeration signal, but worth a distinct message once actually locked
  // so the legitimate admin isn't left guessing why a correct password fails.
  if (user.lockedUntil && user.lockedUntil.getTime() > Date.now()) {
    return { error: 'Too many failed attempts — try again in a few minutes.' };
  }

  const valid = await verifyPassword(parsed.data.password, user.passwordHash);
  if (!valid) {
    const attempts = user.failedLoginAttempts + 1;
    const lockedOut = attempts >= MAX_FAILED_ATTEMPTS;
    await db
      .update(users)
      .set({
        failedLoginAttempts: lockedOut ? 0 : attempts,
        lockedUntil: lockedOut ? new Date(Date.now() + LOCKOUT_DURATION_MS) : null,
      })
      .where(eq(users.id, user.id));
    return invalidCredentials;
  }

  await db.update(users).set({ failedLoginAttempts: 0, lockedUntil: null }).where(eq(users.id, user.id));
  await createSession(user.id, user.role);
  redirect('/admin');
}

export async function logout(): Promise<void> {
  await deleteSession();
  redirect('/');
}
