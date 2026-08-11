import { and, asc, desc, eq, lt } from 'drizzle-orm';

import { db } from '@/lib/db';
import { awards, seasons } from '@/database/schema';
import { TournamentState } from '@/types/domain/tournament';

export function listSeasons() {
  return db.query.seasons.findMany({
    orderBy: asc(seasons.seasonNumber),
    with: { ruleSet: true },
  });
}

export function getSeasonByNumber(seasonNumber: number) {
  return db.query.seasons.findFirst({
    where: eq(seasons.seasonNumber, seasonNumber),
    with: { ruleSet: true },
  });
}

export function getSeasonById(id: string) {
  return db.query.seasons.findFirst({
    where: eq(seasons.id, id),
    with: { ruleSet: true },
  });
}

/**
 * The reigning champion going into the given season — the Champion award
 * from the highest-numbered COMPLETED season before it. Null if there's no
 * predecessor (Season 1) or that predecessor has no recorded Champion.
 */
export async function getPreviousSeasonChampion(currentSeasonNumber: number): Promise<string | null> {
  const previous = await db.query.seasons.findFirst({
    where: and(lt(seasons.seasonNumber, currentSeasonNumber), eq(seasons.state, TournamentState.COMPLETED)),
    orderBy: desc(seasons.seasonNumber),
  });
  if (!previous) return null;

  const championAward = await db.query.awards.findFirst({
    where: and(eq(awards.seasonId, previous.id), eq(awards.name, 'Champion')),
    with: { player: true },
  });
  return championAward?.player.displayName ?? null;
}
