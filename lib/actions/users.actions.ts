'use server';

import { eq } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';

import { db } from '@/lib/db';
import { users } from '@/database/schema';
import { requireSuperAdmin } from '@/lib/auth/dal';
import { hashPassword } from '@/lib/auth/password';
import { UserRole } from '@/types/domain/user';

export interface UserActionState {
  error?: string;
  success?: boolean;
}

/** Postgres unique_violation. See lib/actions/awards.actions.ts for the same check on the write path. */
function isUniqueViolation(err: unknown): boolean {
  return typeof err === 'object' && err !== null && 'code' in err && (err as { code?: string }).code === '23505';
}

const CreateUserSchema = z.object({
  username: z.string().trim().min(1, 'Username is required.'),
  displayName: z.string().trim().min(1, 'Display name is required.'),
  password: z.string().min(8, 'Password must be at least 8 characters.'),
  role: z.nativeEnum(UserRole),
});

export async function createUser(
  _prevState: UserActionState | undefined,
  formData: FormData,
): Promise<UserActionState> {
  await requireSuperAdmin();

  const parsed = CreateUserSchema.safeParse({
    username: formData.get('username'),
    displayName: formData.get('displayName'),
    password: formData.get('password'),
    role: formData.get('role'),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? 'Invalid input.' };
  }
  const data = parsed.data;

  try {
    const passwordHash = await hashPassword(data.password);
    await db.insert(users).values({
      username: data.username,
      displayName: data.displayName,
      passwordHash,
      role: data.role,
      isActive: true,
    });
  } catch (err) {
    if (isUniqueViolation(err)) {
      return { error: `Username "${data.username}" is already taken.` };
    }
    throw err;
  }

  revalidatePath('/admin/users');
  return { success: true };
}

async function setUserStatus(formData: FormData, isActive: boolean): Promise<void> {
  const caller = await requireSuperAdmin();
  const userId = z.string().uuid().safeParse(formData.get('userId'));
  if (!userId.success) return;
  if (userId.data === caller.id) return; // can't deactivate yourself

  await db.update(users).set({ isActive }).where(eq(users.id, userId.data));
  revalidatePath('/admin/users');
}

export async function deactivateUser(formData: FormData): Promise<void> {
  await setUserStatus(formData, false);
}

export async function reactivateUser(formData: FormData): Promise<void> {
  await setUserStatus(formData, true);
}

export async function deleteUser(
  _prevState: UserActionState | undefined,
  formData: FormData,
): Promise<UserActionState> {
  const caller = await requireSuperAdmin();

  const userId = z.string().uuid().safeParse(formData.get('userId'));
  if (!userId.success) {
    return { error: 'Invalid user.' };
  }
  if (userId.data === caller.id) {
    return { error: "You can't delete your own account." };
  }

  await db.delete(users).where(eq(users.id, userId.data));

  revalidatePath('/admin/users');
  return { success: true };
}

const ResetPasswordSchema = z.object({
  userId: z.string().uuid(),
  password: z.string().min(8, 'Password must be at least 8 characters.'),
});

export async function resetUserPassword(
  _prevState: UserActionState | undefined,
  formData: FormData,
): Promise<UserActionState> {
  await requireSuperAdmin();

  const parsed = ResetPasswordSchema.safeParse({
    userId: formData.get('userId'),
    password: formData.get('password'),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? 'Invalid input.' };
  }

  const passwordHash = await hashPassword(parsed.data.password);
  await db
    .update(users)
    .set({ passwordHash, failedLoginAttempts: 0, lockedUntil: null })
    .where(eq(users.id, parsed.data.userId));

  revalidatePath('/admin/users');
  return { success: true };
}
