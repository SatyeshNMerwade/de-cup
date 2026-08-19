import { describe, expect, it } from 'vitest';

import { computeCareerStats, computeHeadToHeadGrid, type CareerMatchInput } from '@/lib/engine/statistics';

function m(
  winnerId: string,
  loserId: string,
  overrides: Partial<CareerMatchInput> = {},
): CareerMatchInput {
  return {
    seasonNumber: 1,
    seasonName: 'Season 1',
    stage: 'League',
    playerOneId: winnerId,
    playerTwoId: loserId,
    winnerId,
    winMargin: 1,
    isEightBallFoul: false,
    ...overrides,
  };
}

describe('computeCareerStats', () => {
  it('tracks longest and current win streaks in chronological order', () => {
    // A: W, W, L, W, W, W — longest streak is the trailing run of 3.
    const matches = [
      m('A', 'X'),
      m('A', 'X'),
      m('X', 'A'),
      m('A', 'X'),
      m('A', 'X'),
      m('A', 'X'),
    ];
    const stats = computeCareerStats(['A', 'X'], matches);
    expect(stats.A.longestWinStreak).toBe(3);
    expect(stats.A.currentStreak).toEqual({ type: 'W', count: 3 });
    // X's current streak is a loss run of 3 (after their one win in match 3).
    expect(stats.X.currentStreak).toEqual({ type: 'L', count: 3 });
  });

  it('picks the biggest win by margin and averages only wins with a known margin', () => {
    const matches = [
      m('A', 'X', { winMargin: 3 }),
      m('A', 'X', { winMargin: 7 }),
      m('A', 'X', { winMargin: null }), // unknown margin — excluded from average and biggest-win
    ];
    const stats = computeCareerStats(['A', 'X'], matches);
    expect(stats.A.wins).toBe(3);
    expect(stats.A.biggestWin).toEqual({ opponentId: 'X', margin: 7, seasonNumber: 1, stage: 'League' });
    expect(stats.A.avgWinMargin).toBe(5); // (3+7)/2, the null-margin win excluded
  });

  it('counts 8-ball fouls for both the committing loser and the winner who benefited', () => {
    const matches = [
      m('A', 'X', { isEightBallFoul: true, winMargin: 0 }),
      m('A', 'X', { isEightBallFoul: true, winMargin: 0 }),
      m('X', 'A'),
    ];
    const stats = computeCareerStats(['A', 'X'], matches);
    expect(stats.X.eightBallFoulsCommitted).toBe(2);
    expect(stats.A.eightBallFoulsWon).toBe(2);
    expect(stats.A.eightBallFoulsCommitted).toBe(0);
  });

  it('computes win percentage from played matches', () => {
    const matches = [m('A', 'X'), m('A', 'X'), m('X', 'A')];
    const stats = computeCareerStats(['A', 'X'], matches);
    expect(stats.A.played).toBe(3);
    expect(stats.A.winPct).toBe(67); // 2/3 rounded
  });

  it('tracks recent form as the last 5 results, oldest first', () => {
    // A: W,W,L,W,W,W,L — 7 matches, form should keep only the trailing 5.
    const matches = [m('A', 'X'), m('A', 'X'), m('X', 'A'), m('A', 'X'), m('A', 'X'), m('A', 'X'), m('X', 'A')];
    const stats = computeCareerStats(['A', 'X'], matches);
    expect(stats.A.recentForm).toEqual(['L', 'W', 'W', 'W', 'L']);
    expect(stats.X.recentForm).toEqual(['W', 'L', 'L', 'L', 'W']);
  });

  it('does not cap recent form below 5 matches played', () => {
    const matches = [m('A', 'X'), m('X', 'A')];
    const stats = computeCareerStats(['A', 'X'], matches);
    expect(stats.A.recentForm).toEqual(['W', 'L']);
  });
});

describe('computeHeadToHeadGrid', () => {
  it('builds a symmetric record from each player\'s perspective', () => {
    const matches = [m('A', 'B'), m('A', 'B'), m('B', 'A')];
    const grid = computeHeadToHeadGrid(['A', 'B', 'C'], matches);
    expect(grid.A.B).toEqual({ wins: 2, losses: 1 });
    expect(grid.B.A).toEqual({ wins: 1, losses: 2 });
    expect(grid.A.C).toEqual({ wins: 0, losses: 0 });
    expect(grid.C).toBeDefined();
  });
});
