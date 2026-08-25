import { and, eq } from 'drizzle-orm';

import { db } from '@/lib/db';
import { matches, seasonRegistrations } from '@/database/schema';
import { computeStandings, type StandingsMatchInput } from '@/lib/engine/standings';
import { MatchStage, MatchStatus, TournamentFormat, MatchResultType } from '@/types/domain/tournament';

import { getQualificationOutlook } from './qualification.service';
import { getSeasonById } from './seasons.service';

export type QualificationStatus = 'qualified' | 'eliminated' | 'contested' | null;

export interface PlayerMatchHistoryEntry {
  matchNumber: number;
  opponentName: string;
  won: boolean;
  ballsLeft: number;
  resultType: MatchResultType | null;
}

export interface PlayerPendingMatchEntry {
  opponentName: string;
}

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
  /** wins * the season's rule-set pointsPerWin (2 for League + IPL, 1 for Group + Knockout). */
  points: number;
  /**
   * League format only (null for Group format). 'qualified'/'eliminated' once
   * that's mathematically locked in — from the final table once the League
   * stage is over, or from the qualification engine's guaranteed-floor/
   * certain-elimination numbers while it's still in progress. 'contested'
   * means still genuinely open; null also covers "too early to say"
   * (getQualificationOutlook's own reveal threshold).
   */
  qualificationStatus: QualificationStatus;
  /** This player's completed table-stage matches, oldest first. */
  matchHistory: PlayerMatchHistoryEntry[];
  /** Opponents this player hasn't yet played in the table stage — order carries no scheduling meaning. */
  pendingMatches: PlayerPendingMatchEntry[];
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
  const pending = tableMatches.filter((m) => m.status !== MatchStatus.COMPLETED);

  const inputs: StandingsMatchInput[] = completed.map((m) => ({
    playerOneId: m.playerOneId,
    playerTwoId: m.playerTwoId,
    winnerId: m.winnerId as string,
    winMargin: m.winMargin,
    loseMargin: m.loseMargin,
  }));

  const tieBreakerOrder = season.ruleSet.rules.tieBreakers.order;
  const pointsPerWin = season.ruleSet.rules.scoring.pointsPerWin;
  const standings = computeStandings(playerIds, inputs, tieBreakerOrder);

  const matchHistoryById = new Map<string, PlayerMatchHistoryEntry[]>(playerIds.map((id) => [id, []]));
  completed
    .slice()
    .sort((a, b) => a.matchNumber - b.matchNumber)
    .forEach((m) => {
      const ballsLeft = Math.abs(m.winMargin ?? 0);
      const playerOneWon = m.winnerId === m.playerOneId;
      matchHistoryById.get(m.playerOneId)?.push({
        matchNumber: m.matchNumber,
        opponentName: nameById.get(m.playerTwoId) ?? m.playerTwoId,
        won: playerOneWon,
        ballsLeft,
        resultType: m.resultType as MatchResultType | null,
      });
      matchHistoryById.get(m.playerTwoId)?.push({
        matchNumber: m.matchNumber,
        opponentName: nameById.get(m.playerOneId) ?? m.playerOneId,
        won: !playerOneWon,
        ballsLeft,
        resultType: m.resultType as MatchResultType | null,
      });
    });

  const pendingMatchesById = new Map<string, PlayerPendingMatchEntry[]>(playerIds.map((id) => [id, []]));
  pending.forEach((m) => {
    pendingMatchesById.get(m.playerOneId)?.push({ opponentName: nameById.get(m.playerTwoId) ?? m.playerTwoId });
    pendingMatchesById.get(m.playerTwoId)?.push({ opponentName: nameById.get(m.playerOneId) ?? m.playerOneId });
  });

  const qualificationStatusById = new Map<string, QualificationStatus>();
  if (season.tournamentFormat === TournamentFormat.LEAGUE && !options?.groupId) {
    if (tableMatches.length > 0 && completed.length === tableMatches.length) {
      // League stage over — the table is final, so rank vs. cutoff decides it outright.
      const slots = season.ruleSet.rules.qualification.qualificationSlots;
      standings.forEach((s, i) => {
        qualificationStatusById.set(s.playerId, i < slots ? 'qualified' : 'eliminated');
      });
    } else {
      const outlook = await getQualificationOutlook(seasonId);
      outlook?.forEach((o) => {
        let status: QualificationStatus = 'contested';
        if (o.guaranteedMinWins === 0) status = 'qualified';
        else if (o.certainElimMaxWins === o.remainingCount) status = 'eliminated';
        qualificationStatusById.set(o.playerId, status);
      });
    }
  }

  return standings.map((s) => ({
    ...s,
    displayName: nameById.get(s.playerId) ?? s.playerId,
    points: s.wins * pointsPerWin,
    qualificationStatus: qualificationStatusById.get(s.playerId) ?? null,
    matchHistory: matchHistoryById.get(s.playerId) ?? [],
    pendingMatches: pendingMatchesById.get(s.playerId) ?? [],
  }));
}
