import { and, eq, notInArray } from 'drizzle-orm';

import { db } from '@/lib/db';
import { seasons, matches } from '@/database/schema';
import {
  computeCareerStats,
  computeHeadToHeadGrid,
  type CareerMatchInput,
  type HeadToHeadCell,
  type PlayerCareerStats,
} from '@/lib/engine/statistics';
import { headToHeadWinProbability, type QualificationMatchInput } from '@/lib/engine/qualification';
import { formatStageLabel } from '@/lib/helpers/format.helper';
import { MatchStage, MatchStatus, MatchResultType, TournamentState } from '@/types/domain/tournament';

import { listCareerMatchLog, type CareerMatch } from './matches.service';

export interface StatsHighlight {
  label: string;
  value: string;
  detail: string;
}

export interface PlayerStatsView extends PlayerCareerStats {
  displayName: string;
  biggestWinOpponentName: string | null;
}

export interface MatchHistoryEntry {
  seasonNumber: number;
  seasonName: string;
  stage: string;
  opponentName: string;
  won: boolean;
  margin: number | null;
  isEightBallFoul: boolean;
  remarks: string | null;
}

export interface RemainingMatchEntry {
  opponentName: string;
  winProbability: number;
  headToHead: { wins: number; losses: number };
}

export interface PlayerProfileView {
  playerId: string;
  displayName: string;
  matchHistory: MatchHistoryEntry[];
  remainingMatches: RemainingMatchEntry[];
}

export interface HeadToHeadGridView {
  playerIds: string[];
  names: Record<string, string>;
  grid: Record<string, Record<string, HeadToHeadCell>>;
  biggestRivalry: { aName: string; bName: string; meetings: number; record: string }[];
}

export interface StatsPageData {
  players: PlayerStatsView[];
  highlights: StatsHighlight[];
  headToHead: HeadToHeadGridView;
  profiles: PlayerProfileView[];
}

function joinNames(names: string[]): string {
  if (names.length === 0) return '—';
  if (names.length === 1) return names[0];
  if (names.length === 2) return `${names[0]} & ${names[1]}`;
  return `${names.slice(0, -1).join(', ')} & ${names[names.length - 1]}`;
}

function toEngineInput(m: CareerMatch): CareerMatchInput {
  return {
    seasonNumber: m.season.seasonNumber,
    seasonName: m.season.name,
    stage: formatStageLabel(m.stage),
    playerOneId: m.playerOneId,
    playerTwoId: m.playerTwoId,
    winnerId: m.winnerId as string,
    winMargin: m.winMargin,
    isEightBallFoul: m.resultType === MatchResultType.EIGHT_BALL_FOUL,
  };
}

export async function getStatsPageData(): Promise<StatsPageData | null> {
  const log = await listCareerMatchLog();
  if (log.length === 0) return null;

  const nameById = new Map<string, string>();
  log.forEach((m) => {
    nameById.set(m.playerOneId, m.playerOne.displayName);
    nameById.set(m.playerTwoId, m.playerTwo.displayName);
  });
  const playerIds = Array.from(nameById.keys());

  const engineMatches = log.map(toEngineInput);
  const careerStats = computeCareerStats(playerIds, engineMatches);
  const headToHeadGrid = computeHeadToHeadGrid(playerIds, engineMatches);

  const players: PlayerStatsView[] = playerIds.map((id) => {
    const s = careerStats[id];
    return {
      ...s,
      displayName: nameById.get(id) ?? id,
      biggestWinOpponentName: s.biggestWin ? (nameById.get(s.biggestWin.opponentId) ?? null) : null,
    };
  });

  // ---- Highlights ----
  const maxStreak = players.reduce((max, p) => Math.max(max, p.longestWinStreak), 0);
  const streakLeaders = maxStreak > 0 ? players.filter((p) => p.longestWinStreak === maxStreak) : [];

  const maxWinPct = players.reduce((max, p) => Math.max(max, p.winPct), -Infinity);
  const winPctLeaders = players.filter((p) => p.winPct === maxWinPct);

  const foulCandidates = players.filter((p) => p.eightBallFoulsCommitted > 0);
  const maxFouls = foulCandidates.reduce((max, p) => Math.max(max, p.eightBallFoulsCommitted), 0);
  const foulLeaders = foulCandidates.filter((p) => p.eightBallFoulsCommitted === maxFouls);

  let maxMargin: number | null = null;
  players.forEach((p) => {
    if (p.biggestWin && (maxMargin === null || p.biggestWin.margin > maxMargin)) maxMargin = p.biggestWin.margin;
  });
  const dominantWinners = maxMargin === null ? [] : players.filter((p) => p.biggestWin?.margin === maxMargin);

  const highlights: StatsHighlight[] = [
    {
      label: 'Longest Win Streak',
      value: joinNames(streakLeaders.map((p) => p.displayName)),
      detail: streakLeaders.length ? `${maxStreak} win${maxStreak === 1 ? '' : 's'} in a row` : 'No wins yet',
    },
    {
      label: 'Best Win %',
      value: joinNames(winPctLeaders.map((p) => p.displayName)),
      detail: `${maxWinPct}% (${winPctLeaders.map((p) => `${p.wins}-${p.losses}`).join(', ')})`,
    },
    {
      label: 'Most Dominant Win',
      value: joinNames(dominantWinners.map((p) => p.displayName)),
      detail: dominantWinners.length
        ? dominantWinners
            .map((p) => `${p.biggestWin?.margin} ball(s) left vs ${p.biggestWinOpponentName} (${p.biggestWin?.stage})`)
            .join('; ')
        : 'No data yet',
    },
    {
      label: '8-Ball Blunders',
      value: joinNames(foulLeaders.map((p) => p.displayName)),
      detail: foulLeaders.length
        ? `Lost ${maxFouls} match${maxFouls === 1 ? '' : 'es'} by pocketing the 8-ball`
        : 'No blunders yet',
    },
  ];

  // ---- Rivalry ----
  let maxMeetings = 0;
  const pairs: { a: string; b: string; meetings: number; aWins: number; bWins: number }[] = [];
  for (let i = 0; i < playerIds.length; i++) {
    for (let j = i + 1; j < playerIds.length; j++) {
      const a = playerIds[i];
      const b = playerIds[j];
      const cell = headToHeadGrid[a][b];
      const meetings = cell.wins + cell.losses;
      if (meetings > 0) pairs.push({ a, b, meetings, aWins: cell.wins, bWins: cell.losses });
      maxMeetings = Math.max(maxMeetings, meetings);
    }
  }
  const biggestRivalry = pairs
    .filter((p) => p.meetings === maxMeetings && maxMeetings > 0)
    .map((p) => ({
      aName: nameById.get(p.a) ?? p.a,
      bName: nameById.get(p.b) ?? p.b,
      meetings: p.meetings,
      record: `${p.aWins}-${p.bWins}`,
    }));

  // ---- Player profiles ----
  const activeSeason = await db.query.seasons.findFirst({
    where: eq(seasons.state, TournamentState.ACTIVE),
  });

  const fetchRemainingMatches = (seasonId: string) =>
    db.query.matches.findMany({
      where: and(
        eq(matches.seasonId, seasonId),
        notInArray(matches.status, [MatchStatus.COMPLETED]),
        eq(matches.stage, MatchStage.LEAGUE),
      ),
      with: { playerOne: true, playerTwo: true },
    });

  const remainingBySeason = activeSeason ? await fetchRemainingMatches(activeSeason.id) : [];

  // headToHeadWinProbability only reads playerOneId/playerTwoId/winnerId, so the
  // engine's CareerMatchInput rows already satisfy QualificationMatchInput's shape.
  const allTimeInput: QualificationMatchInput[] = engineMatches.map((em) => ({
    playerOneId: em.playerOneId,
    playerTwoId: em.playerTwoId,
    winnerId: em.winnerId,
    winMargin: null,
    loseMargin: null,
  }));

  const profiles: PlayerProfileView[] = playerIds.map((id) => {
    const playerMatches = log.filter((m) => m.playerOneId === id || m.playerTwoId === id);
    const matchHistory: MatchHistoryEntry[] = playerMatches
      .slice()
      .reverse()
      .map((m) => {
        const opponent = m.playerOneId === id ? m.playerTwo : m.playerOne;
        return {
          seasonNumber: m.season.seasonNumber,
          seasonName: m.season.name,
          stage: formatStageLabel(m.stage),
          opponentName: opponent.displayName,
          won: m.winnerId === id,
          // Always the winner's margin, regardless of which player's row
          // this is — matches index.html's convention of showing the same
          // one "balls left" number from either side rather than a
          // separately-signed loseMargin (which would read oddly, e.g.
          // "-2 balls left", on the losing player's own history row).
          margin: m.winMargin,
          isEightBallFoul: m.resultType === MatchResultType.EIGHT_BALL_FOUL,
          remarks: m.remarks,
        };
      });

    const remainingMatches: RemainingMatchEntry[] = remainingBySeason
      .filter((m) => m.playerOneId === id || m.playerTwoId === id)
      .map((m) => {
        const opponent = m.playerOneId === id ? m.playerTwo : m.playerOne;
        // headToHeadWinProbability(a, b, ...) returns P(a wins) plus a's/b's
        // wins in that order — pass `id` first so the result is always
        // framed from this player's own perspective.
        const { probability, aWins, bWins } = headToHeadWinProbability(id, opponent.id, allTimeInput);
        const winProbability = Math.round(probability * 100);
        return { opponentName: opponent.displayName, winProbability, headToHead: { wins: aWins, losses: bWins } };
      });

    return {
      playerId: id,
      displayName: nameById.get(id) ?? id,
      matchHistory,
      remainingMatches,
    };
  });

  return {
    players,
    highlights,
    headToHead: { playerIds, names: Object.fromEntries(nameById), grid: headToHeadGrid, biggestRivalry },
    profiles,
  };
}
