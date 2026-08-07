import { describe, expect, it } from 'vitest';

import {
  computeStandings,
  describeBoundaryMarginGap,
  isBoundaryUnresolved,
  type StandingsMatchInput,
} from '@/lib/engine/standings';
import { TieBreakerType } from '@/types/domain/rule';

const TIEBREAK_ORDER = [TieBreakerType.WIN_MARGIN, TieBreakerType.LOSE_MARGIN, TieBreakerType.HEAD_TO_HEAD];

function match(
  playerOneId: string,
  playerTwoId: string,
  winnerId: string,
  winMargin = 1,
  loseMargin = -1,
): StandingsMatchInput {
  return { playerOneId, playerTwoId, winnerId, winMargin, loseMargin };
}

describe('isBoundaryUnresolved', () => {
  it('is false when the cutoff is clean', () => {
    // A: 2 wins, B: 1 win, C: 0 wins — 4/5-style cutoff at index 0 isn't tied.
    const matches = [match('A', 'B', 'A'), match('A', 'C', 'A'), match('B', 'C', 'B')];
    const standings = computeStandings(['A', 'B', 'C'], matches, TIEBREAK_ORDER);
    expect(isBoundaryUnresolved(standings, 0, matches, TIEBREAK_ORDER)).toBe(false);
  });

  it('is true when the cutoff itself is tied on every tiebreaker', () => {
    // B and C both finish 1-1 with identical win/lose margin and no head-to-head — genuinely tied for 2nd.
    const matches = [
      match('A', 'B', 'A', 5, -5),
      match('A', 'C', 'A', 5, -5),
      match('B', 'D', 'B', 3, -3),
      match('C', 'D', 'C', 3, -3),
    ];
    const standings = computeStandings(['A', 'B', 'C', 'D'], matches, TIEBREAK_ORDER);
    // A is clear 1st; B/C are tied for the 2nd spot (index 1 vs 2).
    expect(isBoundaryUnresolved(standings, 1, matches, TIEBREAK_ORDER)).toBe(true);
  });

  it('ignores a tie elsewhere in the table that does not touch the boundary', () => {
    // B and C tie for 2nd/3rd (both below the boundary at index 0), but A is a clear, unrivaled 1st.
    const matches = [
      match('A', 'B', 'A', 5, -5),
      match('A', 'C', 'A', 5, -5),
      match('B', 'D', 'B', 3, -3),
      match('C', 'D', 'C', 3, -3),
    ];
    const standings = computeStandings(['A', 'B', 'C', 'D'], matches, TIEBREAK_ORDER);
    expect(isBoundaryUnresolved(standings, 0, matches, TIEBREAK_ORDER)).toBe(false);
  });

  it('is false when the index is out of range', () => {
    const matches = [match('A', 'B', 'A')];
    const standings = computeStandings(['A', 'B'], matches, TIEBREAK_ORDER);
    expect(isBoundaryUnresolved(standings, 5, matches, TIEBREAK_ORDER)).toBe(false);
  });
});

describe('describeBoundaryMarginGap', () => {
  it('is null when the boundary is separated by wins, not a tie', () => {
    const matches = [match('A', 'B', 'A'), match('A', 'C', 'A'), match('B', 'C', 'B')];
    const standings = computeStandings(['A', 'B', 'C'], matches, TIEBREAK_ORDER);
    expect(describeBoundaryMarginGap(standings, 0, matches, TIEBREAK_ORDER)).toBeNull();
  });

  it('names the rival and quantifies a Win Margin gap when tied on wins', () => {
    const matches = [
      match('A', 'B', 'A', 10, -10),
      match('A', 'C', 'A', 10, -10),
      match('B', 'D', 'B', 5, -5),
      match('C', 'D', 'C', 3, -3),
    ];
    const standings = computeStandings(['A', 'B', 'C', 'D'], matches, TIEBREAK_ORDER);
    const gap = describeBoundaryMarginGap(standings, 1, matches, TIEBREAK_ORDER);
    expect(gap).toEqual({
      aheadPlayerId: 'B',
      behindPlayerId: 'C',
      criterion: TieBreakerType.WIN_MARGIN,
      aheadValue: 5,
      behindValue: 3,
      threshold: 3,
    });
  });

  it('falls through to Lose Margin once Win Margin ties', () => {
    const matches = [
      match('A', 'B', 'A', 10, -10),
      match('A', 'C', 'A', 10, -6),
      match('B', 'D', 'B', 5, -5),
      match('C', 'E', 'C', 5, -5),
    ];
    const standings = computeStandings(['A', 'B', 'C', 'D', 'E'], matches, TIEBREAK_ORDER);
    const gap = describeBoundaryMarginGap(standings, 1, matches, TIEBREAK_ORDER);
    expect(gap).toEqual({
      aheadPlayerId: 'C',
      behindPlayerId: 'B',
      criterion: TieBreakerType.LOSE_MARGIN,
      aheadValue: -6,
      behindValue: -10,
      threshold: 5,
    });
  });

  it('is null when Head-to-Head is what decides it, not a margin', () => {
    const matches = [
      match('B', 'C', 'B', 5, -5),
      match('A', 'B', 'A', 3, -5),
      match('C', 'D', 'C', 5, -5),
      match('A', 'E', 'A', 1, -1),
    ];
    const standings = computeStandings(['A', 'B', 'C', 'D', 'E'], matches, TIEBREAK_ORDER);
    const gap = describeBoundaryMarginGap(standings, 1, matches, TIEBREAK_ORDER);
    expect(gap).toBeNull();
  });

  it('is null when the pair is still fully tied (needs a decider)', () => {
    const matches = [
      match('A', 'B', 'A', 5, -5),
      match('A', 'C', 'A', 5, -5),
      match('B', 'D', 'B', 3, -3),
      match('C', 'D', 'C', 3, -3),
    ];
    const standings = computeStandings(['A', 'B', 'C', 'D'], matches, TIEBREAK_ORDER);
    expect(describeBoundaryMarginGap(standings, 1, matches, TIEBREAK_ORDER)).toBeNull();
  });

  it('is null when the index is out of range', () => {
    const matches = [match('A', 'B', 'A')];
    const standings = computeStandings(['A', 'B'], matches, TIEBREAK_ORDER);
    expect(describeBoundaryMarginGap(standings, 5, matches, TIEBREAK_ORDER)).toBeNull();
  });
});
