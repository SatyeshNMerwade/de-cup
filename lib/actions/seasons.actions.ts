'use server';

import { and, count, eq } from 'drizzle-orm';
import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';

import { db } from '@/lib/db';
import { seasons, seasonRegistrations, matches, ruleSets } from '@/database/schema';
import { requireUser } from '@/lib/auth/dal';
import { generateRoundRobinPairs } from '@/lib/engine/scheduling';
import { RegistrationStatus } from '@/types/domain/season';
import { MatchStage, MatchStatus, TournamentFormat, TournamentState } from '@/types/domain/tournament';

export interface SeasonActionState {
  error?: string;
  success?: boolean;
}

function isUniqueViolation(err: unknown): boolean {
  return typeof err === 'object' && err !== null && 'code' in err && (err as { code?: string }).code === '23505';
}

const CreateSeasonSchema = z.object({
  seasonNumber: z.coerce.number().int().positive(),
  name: z.string().trim().min(1, 'Season name is required.'),
  ruleSetId: z.string().uuid(),
  playerIds: z.array(z.string().uuid()).min(2, 'Select at least 2 players.'),
});

/**
 * Creates a season, its registrations, and a full round-robin League
 * schedule (lib/engine/scheduling.ts) in one transaction. Scoped to
 * League-format rule sets only — Group format (only ever used by Season 1)
 * would need groups assigned and a round robin generated per group, which
 * isn't built here.
 */
export async function createSeason(
  _prevState: SeasonActionState | undefined,
  formData: FormData,
): Promise<SeasonActionState> {
  await requireUser();

  const parsed = CreateSeasonSchema.safeParse({
    seasonNumber: formData.get('seasonNumber'),
    name: formData.get('name'),
    ruleSetId: formData.get('ruleSetId'),
    playerIds: formData.getAll('playerIds'),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? 'Invalid input.' };
  }
  const data = parsed.data;

  const ruleSet = await db.query.ruleSets.findFirst({ where: eq(ruleSets.id, data.ruleSetId) });
  if (!ruleSet) {
    return { error: 'Rule set not found.' };
  }
  if (ruleSet.tournamentFormat !== TournamentFormat.LEAGUE) {
    return { error: 'Season creation currently only supports League-format rule sets.' };
  }

  const pairs = generateRoundRobinPairs(data.playerIds);
  let createdSeasonNumber: number | null = null;

  try {
    await db.transaction(async (tx) => {
      const [season] = await tx
        .insert(seasons)
        .values({
          seasonNumber: data.seasonNumber,
          name: data.name,
          tournamentFormat: ruleSet.tournamentFormat,
          playoffFormat: ruleSet.playoffFormat,
          ruleSetId: ruleSet.id,
          state: TournamentState.ACTIVE,
          isPublished: true,
        })
        .returning();

      await tx.insert(seasonRegistrations).values(
        data.playerIds.map((playerId) => ({
          seasonId: season.id,
          playerId,
          registrationStatus: RegistrationStatus.REGISTERED,
        })),
      );

      await tx.insert(matches).values(
        pairs.map((pair, index) => ({
          seasonId: season.id,
          matchNumber: index + 1,
          stage: MatchStage.LEAGUE,
          playerOneId: pair.playerOneId,
          playerTwoId: pair.playerTwoId,
          status: MatchStatus.SCHEDULED,
        })),
      );

      createdSeasonNumber = season.seasonNumber;
    });
  } catch (err) {
    if (isUniqueViolation(err)) {
      return { error: `Season number ${data.seasonNumber} already exists.` };
    }
    throw err;
  }

  revalidatePath('/admin');
  revalidatePath('/');
  redirect(`/admin/seasons/${createdSeasonNumber}`);
}

const DeleteSeasonSchema = z.object({ seasonId: z.string().uuid() });

/** Only permitted when the season has zero recorded results — cascades otherwise take real history with them. */
export async function deleteSeason(
  _prevState: SeasonActionState | undefined,
  formData: FormData,
): Promise<SeasonActionState> {
  await requireUser();

  const parsed = DeleteSeasonSchema.safeParse({ seasonId: formData.get('seasonId') });
  if (!parsed.success) {
    return { error: 'Invalid season.' };
  }

  const [{ completedCount }] = await db
    .select({ completedCount: count() })
    .from(matches)
    .where(and(eq(matches.seasonId, parsed.data.seasonId), eq(matches.status, MatchStatus.COMPLETED)));

  if (completedCount > 0) {
    return { error: 'This season has recorded results and can\'t be deleted.' };
  }

  await db.delete(seasons).where(eq(seasons.id, parsed.data.seasonId));

  revalidatePath('/admin');
  revalidatePath('/');
  redirect('/admin');
}
