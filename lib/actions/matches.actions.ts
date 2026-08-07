'use server';

import { and, eq, sql } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';

import { db } from '@/lib/db';
import { matches } from '@/database/schema';
import { requireUser } from '@/lib/auth/dal';
import { advanceSeasonProgression } from '@/lib/services/season-progression.service';
import { MatchResultType, MatchStage, MatchStatus } from '@/types/domain/tournament';

/** Postgres unique_violation. See lib/actions/awards.actions.ts for the same check on the write path. */
function isUniqueViolation(err: unknown): boolean {
  return typeof err === 'object' && err !== null && 'code' in err && (err as { code?: string }).code === '23505';
}

const RecordMatchResultSchema = z.object({
  matchId: z.string().uuid(),
  seasonNumber: z.coerce.number().int().positive(),
  winnerId: z.string().uuid(),
  resultType: z.nativeEnum(MatchResultType),
  ballsLeft: z.coerce.number().int().min(0).optional(),
  remarks: z.string().trim().optional(),
});

export interface RecordMatchResultState {
  error?: string;
  success?: boolean;
  info?: string;
}

export async function recordMatchResult(
  _prevState: RecordMatchResultState | undefined,
  formData: FormData,
): Promise<RecordMatchResultState> {
  // Secure check: verifies against the DB, not just the session cookie.
  // Redirects to /auth/login if there's no valid, active-user session.
  await requireUser();

  const parsed = RecordMatchResultSchema.safeParse({
    matchId: formData.get('matchId'),
    seasonNumber: formData.get('seasonNumber'),
    winnerId: formData.get('winnerId'),
    resultType: formData.get('resultType'),
    ballsLeft: formData.get('ballsLeft') || undefined,
    remarks: formData.get('remarks') || undefined,
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? 'Invalid input.' };
  }
  const data = parsed.data;

  // Balls-left credits the margin the same way whether the match ended
  // normally or on an 8-ball foul — a foul can happen with 1 ball left on
  // the table or 5, and that difference is still a real win margin.
  if (data.ballsLeft == null) {
    return { error: 'Enter how many balls were left on the table.' };
  }
  const winMargin = data.ballsLeft;
  const loseMargin = -data.ballsLeft;

  const match = await db.query.matches.findFirst({ where: eq(matches.id, data.matchId) });
  if (!match) {
    return { error: 'Match not found.' };
  }
  if (match.status === MatchStatus.COMPLETED) {
    return { error: 'This match already has a recorded result.' };
  }
  if (data.winnerId !== match.playerOneId && data.winnerId !== match.playerTwoId) {
    return { error: 'Winner must be one of the two players in this match.' };
  }
  const loserId = data.winnerId === match.playerOneId ? match.playerTwoId : match.playerOneId;

  await db
    .update(matches)
    .set({
      winnerId: data.winnerId,
      loserId,
      winMargin,
      loseMargin,
      resultType: data.resultType,
      remarks: data.remarks ?? null,
      status: MatchStatus.COMPLETED,
      completedAt: new Date(),
    })
    .where(eq(matches.id, data.matchId));

  const progression = await advanceSeasonProgression(match.seasonId);

  revalidatePath(`/seasons/${data.seasonNumber}`);
  revalidatePath(`/admin/seasons/${data.seasonNumber}`);
  revalidatePath('/admin');
  revalidatePath('/stats');

  return { success: true, info: progression.message };
}

export interface EditMatchResultState {
  error?: string;
  success?: boolean;
}

/**
 * Corrects an already-recorded result. Scoped deliberately narrowly:
 * League-stage matches only, and only until every League match in the
 * season is complete — that's exactly the moment IPL playoff progression
 * (advanceSeasonProgression) starts building on the final standings, so
 * locking edits there means an edit can never invalidate anything already
 * generated downstream. Playoff-stage matches are never editable.
 */
export async function editMatchResult(
  _prevState: EditMatchResultState | undefined,
  formData: FormData,
): Promise<EditMatchResultState> {
  await requireUser();

  const parsed = RecordMatchResultSchema.safeParse({
    matchId: formData.get('matchId'),
    seasonNumber: formData.get('seasonNumber'),
    winnerId: formData.get('winnerId'),
    resultType: formData.get('resultType'),
    ballsLeft: formData.get('ballsLeft') || undefined,
    remarks: formData.get('remarks') || undefined,
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? 'Invalid input.' };
  }
  const data = parsed.data;

  if (data.ballsLeft == null) {
    return { error: 'Enter how many balls were left on the table.' };
  }
  const winMargin = data.ballsLeft;
  const loseMargin = -data.ballsLeft;

  const match = await db.query.matches.findFirst({ where: eq(matches.id, data.matchId) });
  if (!match) {
    return { error: 'Match not found.' };
  }
  if (match.stage !== MatchStage.LEAGUE) {
    return { error: 'Only League-stage matches can be edited.' };
  }
  if (match.status !== MatchStatus.COMPLETED) {
    return { error: "This match hasn't been recorded yet." };
  }
  if (data.winnerId !== match.playerOneId && data.winnerId !== match.playerTwoId) {
    return { error: 'Winner must be one of the two players in this match.' };
  }

  const leagueMatches = await db.query.matches.findMany({
    where: and(eq(matches.seasonId, match.seasonId), eq(matches.stage, MatchStage.LEAGUE)),
  });
  if (leagueMatches.every((m) => m.status === MatchStatus.COMPLETED)) {
    return { error: 'All League matches are complete — results are locked and can no longer be edited.' };
  }

  const loserId = data.winnerId === match.playerOneId ? match.playerTwoId : match.playerOneId;

  await db
    .update(matches)
    .set({
      winnerId: data.winnerId,
      loserId,
      winMargin,
      loseMargin,
      resultType: data.resultType,
      remarks: data.remarks ?? null,
    })
    .where(eq(matches.id, data.matchId));

  revalidatePath(`/seasons/${data.seasonNumber}`);
  revalidatePath(`/admin/seasons/${data.seasonNumber}`);
  revalidatePath('/admin');
  revalidatePath('/stats');

  return { success: true };
}

const CreateCustomMatchSchema = z.object({
  seasonId: z.string().uuid(),
  seasonNumber: z.coerce.number().int().positive(),
  stage: z.nativeEnum(MatchStage),
  playerOneId: z.string().uuid(),
  playerTwoId: z.string().uuid(),
});

export interface CreateCustomMatchState {
  error?: string;
  success?: boolean;
}

/**
 * Manual escape hatch for a single ad-hoc match — most notably a decider
 * (a LEAGUE-stage match between two players already tied for the last
 * qualification spot), since the only other match-creation path is
 * createSeason's bulk round-robin insert. Also useful as a general manual
 * override if automatic playoff progression ever needs a hand.
 */
export async function createCustomMatch(
  _prevState: CreateCustomMatchState | undefined,
  formData: FormData,
): Promise<CreateCustomMatchState> {
  await requireUser();

  const parsed = CreateCustomMatchSchema.safeParse({
    seasonId: formData.get('seasonId'),
    seasonNumber: formData.get('seasonNumber'),
    stage: formData.get('stage'),
    playerOneId: formData.get('playerOneId'),
    playerTwoId: formData.get('playerTwoId'),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? 'Invalid input.' };
  }
  const data = parsed.data;

  if (data.playerOneId === data.playerTwoId) {
    return { error: 'The two players must be different.' };
  }

  try {
    await db.transaction(async (tx) => {
      const [{ maxNumber }] = await tx
        .select({ maxNumber: sql<number>`coalesce(max(${matches.matchNumber}), 0)` })
        .from(matches)
        .where(eq(matches.seasonId, data.seasonId));

      await tx.insert(matches).values({
        seasonId: data.seasonId,
        matchNumber: maxNumber + 1,
        stage: data.stage,
        playerOneId: data.playerOneId,
        playerTwoId: data.playerTwoId,
        status: MatchStatus.SCHEDULED,
      });
    });
  } catch (err) {
    if (isUniqueViolation(err)) {
      return { error: 'Could not assign a match number — try again.' };
    }
    throw err;
  }

  revalidatePath(`/seasons/${data.seasonNumber}`);
  revalidatePath(`/admin/seasons/${data.seasonNumber}`);

  return { success: true };
}
