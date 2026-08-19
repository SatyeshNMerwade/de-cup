/**
 * Standings & tiebreak engine.
 *
 * Reimplements the comparator that index.html hand-rolled separately for
 * every season (Season 1: wins -> ballsLeft; Seasons 2-4: wins -> winMargin
 * -> loseMargin -> head-to-head) as one reusable, rule-driven function.
 *
 * Pure and framework-independent: takes plain match results in, returns a
 * ranked table out. No DB or React imports.
 */

import { TieBreakerType } from '@/types/domain/rule';

export interface StandingsMatchInput {
  playerOneId: string;
  playerTwoId: string;
  winnerId: string;
  winMargin: number | null;
  loseMargin: number | null;
}

export interface StandingsEntry {
  playerId: string;
  played: number;
  wins: number;
  losses: number;
  winMargin: number;
  loseMargin: number;
  /** True once this entry is tied with a neighbor after every configured tiebreaker is applied. */
  needsDecider: boolean;
  /** Last 5 results this season, oldest first. */
  recentForm: ('W' | 'L')[];
}

function computeRawEntries(
  playerIds: string[],
  matches: StandingsMatchInput[],
): Map<string, StandingsEntry> {
  const entries = new Map<string, StandingsEntry>();

  playerIds.forEach((playerId) => {
    entries.set(playerId, {
      playerId,
      played: 0,
      wins: 0,
      losses: 0,
      winMargin: 0,
      loseMargin: 0,
      needsDecider: false,
      recentForm: [],
    });
  });

  matches.forEach((match) => {
    const loserId = match.winnerId === match.playerOneId ? match.playerTwoId : match.playerOneId;

    const winner = entries.get(match.winnerId);
    const loser = entries.get(loserId);

    if (!winner || !loser) {
      throw new Error(
        `Standings match references a player not in playerIds: ${match.winnerId} / ${loserId}`,
      );
    }

    winner.played += 1;
    winner.wins += 1;
    winner.winMargin += match.winMargin ?? 0;
    winner.recentForm.push('W');
    if (winner.recentForm.length > 5) winner.recentForm.shift();

    loser.played += 1;
    loser.losses += 1;
    loser.loseMargin += match.loseMargin ?? 0;
    loser.recentForm.push('L');
    if (loser.recentForm.length > 5) loser.recentForm.shift();
  });

  return entries;
}

/** Head-to-head wins for `a` against `b`, from this same match list only. */
function headToHeadWins(a: string, b: string, matches: StandingsMatchInput[]): number {
  return matches.filter(
    (m) =>
      m.winnerId === a && (m.playerOneId === b || m.playerTwoId === b) &&
      (m.playerOneId === a || m.playerTwoId === a),
  ).length;
}

function compareEntries(
  a: StandingsEntry,
  b: StandingsEntry,
  matches: StandingsMatchInput[],
  tieBreakerOrder: TieBreakerType[],
): number {
  if (b.wins !== a.wins) return b.wins - a.wins;

  for (const tieBreaker of tieBreakerOrder) {
    switch (tieBreaker) {
      case TieBreakerType.WIN_MARGIN:
        if (b.winMargin !== a.winMargin) return b.winMargin - a.winMargin;
        break;
      case TieBreakerType.LOSE_MARGIN:
        if (b.loseMargin !== a.loseMargin) return b.loseMargin - a.loseMargin;
        break;
      case TieBreakerType.HEAD_TO_HEAD: {
        const aWins = headToHeadWins(a.playerId, b.playerId, matches);
        const bWins = headToHeadWins(b.playerId, a.playerId, matches);
        if (aWins !== bWins) return bWins - aWins;
        break;
      }
      case TieBreakerType.TOTAL_WINS:
        // Wins is always the primary key above; nothing further to break here.
        break;
    }
  }

  return 0;
}

/**
 * Ranks players by wins, then by the given tiebreak order, mirroring
 * index.html's sortStandings(). Entries still tied after every configured
 * tiebreaker is applied are flagged `needsDecider` (adjacent ties only,
 * matching the site's decider-match behavior).
 */
export function computeStandings(
  playerIds: string[],
  matches: StandingsMatchInput[],
  tieBreakerOrder: TieBreakerType[],
): StandingsEntry[] {
  const entries = Array.from(computeRawEntries(playerIds, matches).values());

  const sorted = entries.sort((a, b) => compareEntries(a, b, matches, tieBreakerOrder));

  for (let i = 0; i < sorted.length - 1; i++) {
    if (compareEntries(sorted[i], sorted[i + 1], matches, tieBreakerOrder) === 0) {
      sorted[i].needsDecider = true;
      sorted[i + 1].needsDecider = true;
    }
  }

  return sorted;
}

/**
 * True only when the qualification cutoff itself is unresolved — the
 * entries at `standings[boundaryIndex]` and `standings[boundaryIndex + 1]`
 * are still tied after every configured tiebreaker. Distinct from a given
 * entry's `needsDecider` flag, which fires on *any* adjacent tie in the
 * table (e.g. 2nd vs 3rd), not specifically the one that blocks knowing
 * who qualifies.
 */
export function isBoundaryUnresolved(
  standings: StandingsEntry[],
  boundaryIndex: number,
  matches: StandingsMatchInput[],
  tieBreakerOrder: TieBreakerType[],
): boolean {
  const a = standings[boundaryIndex];
  const b = standings[boundaryIndex + 1];
  if (!a || !b) return false;
  return compareEntries(a, b, matches, tieBreakerOrder) === 0;
}

export interface BoundaryMarginGap {
  aheadPlayerId: string;
  behindPlayerId: string;
  criterion: TieBreakerType.WIN_MARGIN | TieBreakerType.LOSE_MARGIN;
  aheadValue: number;
  behindValue: number;
  /** Minimum net swing the trailing player needs from their remaining matches to move ahead, assuming the leader's numbers hold. */
  threshold: number;
}

function marginGap(
  a: StandingsEntry,
  b: StandingsEntry,
  criterion: TieBreakerType.WIN_MARGIN | TieBreakerType.LOSE_MARGIN,
  aValue: number,
  bValue: number,
): BoundaryMarginGap {
  const ahead = aValue > bValue ? a : b;
  const behind = aValue > bValue ? b : a;
  const aheadValue = Math.max(aValue, bValue);
  const behindValue = Math.min(aValue, bValue);
  return {
    aheadPlayerId: ahead.playerId,
    behindPlayerId: behind.playerId,
    criterion,
    aheadValue,
    behindValue,
    threshold: aheadValue - behindValue + 1,
  };
}

/**
 * Names the rival and quantifies the gap at the qualification boundary —
 * but only for the case that reduces to a clean number: the pair is tied
 * on wins, and a Win Margin or Lose Margin comparison is what separates
 * them today. Returns null when they differ on wins (the existing
 * guaranteed-wins messaging already covers that), when Head-to-Head is
 * what decides it (not a margin — "beat them directly" isn't this kind of
 * threshold), or when they're still fully tied (needs a decider match).
 */
export function describeBoundaryMarginGap(
  standings: StandingsEntry[],
  boundaryIndex: number,
  matches: StandingsMatchInput[],
  tieBreakerOrder: TieBreakerType[],
): BoundaryMarginGap | null {
  const a = standings[boundaryIndex];
  const b = standings[boundaryIndex + 1];
  if (!a || !b) return null;
  if (a.wins !== b.wins) return null;

  for (const tieBreaker of tieBreakerOrder) {
    switch (tieBreaker) {
      case TieBreakerType.WIN_MARGIN:
        if (a.winMargin !== b.winMargin) return marginGap(a, b, TieBreakerType.WIN_MARGIN, a.winMargin, b.winMargin);
        break;
      case TieBreakerType.LOSE_MARGIN:
        if (a.loseMargin !== b.loseMargin) return marginGap(a, b, TieBreakerType.LOSE_MARGIN, a.loseMargin, b.loseMargin);
        break;
      case TieBreakerType.HEAD_TO_HEAD: {
        const aWins = headToHeadWins(a.playerId, b.playerId, matches);
        const bWins = headToHeadWins(b.playerId, a.playerId, matches);
        if (aWins !== bWins) return null;
        break;
      }
      case TieBreakerType.TOTAL_WINS:
        break;
    }
  }

  return null;
}
