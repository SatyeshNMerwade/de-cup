'use server';

import { eq } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';

import { db } from '@/lib/db';
import { players } from '@/database/schema';
import { requireUser } from '@/lib/auth/dal';
import { PlayerStatus } from '@/types/domain/player';

export interface PlayerActionState {
  error?: string;
  success?: boolean;
}

function isForeignKeyViolation(err: unknown): boolean {
  return typeof err === 'object' && err !== null && 'code' in err && (err as { code?: string }).code === '23503';
}

const CreatePlayerSchema = z.object({
  displayName: z.string().trim().min(1, 'Name is required.'),
  shortName: z.string().trim().optional(),
});

export async function createPlayer(
  _prevState: PlayerActionState | undefined,
  formData: FormData,
): Promise<PlayerActionState> {
  await requireUser();

  const parsed = CreatePlayerSchema.safeParse({
    displayName: formData.get('displayName'),
    shortName: formData.get('shortName') || undefined,
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? 'Invalid input.' };
  }

  await db.insert(players).values({
    displayName: parsed.data.displayName,
    shortName: parsed.data.shortName ?? null,
    status: PlayerStatus.ACTIVE,
  });

  revalidatePath('/admin/players');
  return { success: true };
}

async function setPlayerStatus(formData: FormData, status: PlayerStatus): Promise<void> {
  await requireUser();
  const playerId = z.string().uuid().safeParse(formData.get('playerId'));
  if (!playerId.success) return;

  await db.update(players).set({ status }).where(eq(players.id, playerId.data));
  revalidatePath('/admin/players');
}

export async function deactivatePlayer(formData: FormData): Promise<void> {
  await setPlayerStatus(formData, PlayerStatus.INACTIVE);
}

export async function reactivatePlayer(formData: FormData): Promise<void> {
  await setPlayerStatus(formData, PlayerStatus.ACTIVE);
}

export async function deletePlayer(
  _prevState: PlayerActionState | undefined,
  formData: FormData,
): Promise<PlayerActionState> {
  await requireUser();

  const playerId = z.string().uuid().safeParse(formData.get('playerId'));
  if (!playerId.success) {
    return { error: 'Invalid player.' };
  }

  try {
    await db.delete(players).where(eq(players.id, playerId.data));
  } catch (err) {
    if (isForeignKeyViolation(err)) {
      return {
        error: 'This player has registrations, matches, or awards on record and can\'t be deleted — deactivate them instead.',
      };
    }
    throw err;
  }

  revalidatePath('/admin/players');
  return { success: true };
}
