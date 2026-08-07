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

  const valid = await verifyPassword(parsed.data.password, user.passwordHash);
  if (!valid) return invalidCredentials;

  await createSession(user.id, user.role);
  redirect('/admin');
}

export async function logout(): Promise<void> {
  await deleteSession();
  redirect('/auth/login');
}
