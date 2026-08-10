import { and, eq } from 'drizzle-orm';

import { db } from '@/lib/db';
import { matches, seasonRegistrations } from '@/database/schema';
import { computeStandings, type StandingsMatchInput } from '@/lib/engine/standings';
import { MatchStage, MatchStatus, TournamentFormat } from '@/types/domain/tournament';

import { getSeasonById } from './seasons.service';

export interface StandingsEntryView {
  playerId: string;
  displayName: string;
  played: number;
  wins: number;
  losses: number;
  winMargin: number;
  loseMargin: number;
  needsDecider: boolean;
  recentForm: ('W' | 'L')[];
}

/**
 * Standings for a season's table stage (Group or League, per the season's
 * tournamentFormat) — not the knockout/playoff bracket. Pass `groupId` to
 * scope to a single Season 1-style group; omit it for a league season.
 */
export async function getSeasonStandings(
  seasonId: string,
  options?: { groupId?: string },
): Promise<StandingsEntryView[]> {
  const season = await getSeasonById(seasonId);
  if (!season) throw new Error(`Season not found: ${seasonId}`);

  const registrations = await db.query.seasonRegistrations.findMany({
    where: options?.groupId
      ? and(eq(seasonRegistrations.seasonId, seasonId), eq(seasonRegistrations.groupId, options.groupId))
      : eq(seasonRegistrations.seasonId, seasonId),
    with: { player: true },
  });
  const playerIds = registrations.map((r) => r.playerId);
  const nameById = new Map(registrations.map((r) => [r.playerId, r.player.displayName]));

  const tableStage = season.tournamentFormat === TournamentFormat.GROUP ? MatchStage.GROUP : MatchStage.LEAGUE;
  const tableMatches = await db.query.matches.findMany({
    where: options?.groupId
      ? and(eq(matches.seasonId, seasonId), eq(matches.stage, tableStage), eq(matches.groupId, options.groupId))
      : and(eq(matches.seasonId, seasonId), eq(matches.stage, tableStage)),
  });
  const completed = tableMatches.filter((m) => m.status === MatchStatus.COMPLETED && m.winnerId);

  const inputs: StandingsMatchInput[] = completed.map((m) => ({
    playerOneId: m.playerOneId,
    playerTwoId: m.playerTwoId,
    winnerId: m.winnerId as string,
    winMargin: m.winMargin,
    loseMargin: m.loseMargin,
  }));

  const tieBreakerOrder = season.ruleSet.rules.tieBreakers.order;
  const standings = computeStandings(playerIds, inputs, tieBreakerOrder);

  return standings.map((s) => ({
    ...s,
    displayName: nameById.get(s.playerId) ?? s.playerId,
  }));
}
