import { and, asc, eq, notInArray } from 'drizzle-orm';

import { db } from '@/lib/db';
import { matches } from '@/database/schema';
import { MatchStage, MatchStatus } from '@/types/domain/tournament';

export function listMatchesBySeason(seasonId: string) {
  return db.query.matches.findMany({
    where: eq(matches.seasonId, seasonId),
    orderBy: asc(matches.matchNumber),
    with: {
      playerOne: true,
      playerTwo: true,
      winner: true,
      loser: true,
      group: true,
    },
  });
}

/** A season's knockout/playoff-stage matches only (excludes GROUP/LEAGUE table-stage matches). */
export function listPlayoffMatchesBySeason(seasonId: string) {
  return db.query.matches.findMany({
    where: and(
      eq(matches.seasonId, seasonId),
      notInArray(matches.stage, [MatchStage.GROUP, MatchStage.LEAGUE]),
    ),
    orderBy: asc(matches.matchNumber),
    with: {
      playerOne: true,
      playerTwo: true,
      winner: true,
      loser: true,
    },
  });
}

export type PlayoffMatch = Awaited<ReturnType<typeof listPlayoffMatchesBySeason>>[number];

/**
 * Completed matches across every season — just the fields the qualification
 * engine's head-to-head weighting needs (all-time, not per-season).
 */
export function listAllCompletedMatches() {
  return db
    .select({
      playerOneId: matches.playerOneId,
      playerTwoId: matches.playerTwoId,
      winnerId: matches.winnerId,
    })
    .from(matches)
    .where(eq(matches.status, MatchStatus.COMPLETED));
}

/**
 * The full career match log: every completed match across every season,
 * with season + player names attached, in chronological order (season
 * number, then match number) — the same ordering index.html's
 * buildAllTimeLog() produces by concatenating S1 through S4 in order.
 */
export async function listCareerMatchLog() {
  const rows = await db.query.matches.findMany({
    where: eq(matches.status, MatchStatus.COMPLETED),
    with: {
      season: true,
      playerOne: true,
      playerTwo: true,
      winner: true,
      loser: true,
    },
  });

  return rows.sort((a, b) => a.season.seasonNumber - b.season.seasonNumber || a.matchNumber - b.matchNumber);
}

export type CareerMatch = Awaited<ReturnType<typeof listCareerMatchLog>>[number];
