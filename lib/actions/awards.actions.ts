'use server';

import { eq } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';

import { db } from '@/lib/db';
import { awards } from '@/database/schema';
import { requireUser } from '@/lib/auth/dal';
import { AwardCategory } from '@/types/domain/tournament';
import { AwardSource } from '@/types/domain/award';

const AddManualAwardSchema = z.object({
  seasonId: z.string().uuid(),
  seasonNumber: z.coerce.number().int().positive(),
  playerId: z.string().uuid(),
  name: z.string().trim().min(1, 'Award name is required.'),
  description: z.string().trim().optional(),
});

export interface AwardActionState {
  error?: string;
  success?: boolean;
}

/** Postgres unique_violation. See lib/db/client.ts — the `postgres` driver surfaces this as `err.code`. */
function isUniqueViolation(err: unknown): boolean {
  return typeof err === 'object' && err !== null && 'code' in err && (err as { code?: string }).code === '23505';
}

export async function addManualAward(
  _prevState: AwardActionState | undefined,
  formData: FormData,
): Promise<AwardActionState> {
  await requireUser();

  const parsed = AddManualAwardSchema.safeParse({
    seasonId: formData.get('seasonId'),
    seasonNumber: formData.get('seasonNumber'),
    playerId: formData.get('playerId'),
    name: formData.get('name'),
    description: formData.get('description') || undefined,
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? 'Invalid input.' };
  }
  const data = parsed.data;

  try {
    await db.insert(awards).values({
      seasonId: data.seasonId,
      playerId: data.playerId,
      name: data.name,
      description: data.description ?? null,
      category: AwardCategory.MANUAL,
      source: AwardSource.MANUAL,
    });
  } catch (err) {
    if (isUniqueViolation(err)) {
      return { error: 'This player already has an award with that name for this season.' };
    }
    throw err;
  }

  revalidatePath(`/seasons/${data.seasonNumber}`);
  revalidatePath(`/admin/seasons/${data.seasonNumber}`);

  return { success: true };
}

const DeleteAwardSchema = z.object({
  awardId: z.string().uuid(),
  seasonNumber: z.coerce.number().int().positive(),
});

export async function deleteAward(formData: FormData): Promise<void> {
  await requireUser();

  const parsed = DeleteAwardSchema.safeParse({
    awardId: formData.get('awardId'),
    seasonNumber: formData.get('seasonNumber'),
  });
  if (!parsed.success) return;

  await db.delete(awards).where(eq(awards.id, parsed.data.awardId));

  revalidatePath(`/seasons/${parsed.data.seasonNumber}`);
  revalidatePath(`/admin/seasons/${parsed.data.seasonNumber}`);
}
