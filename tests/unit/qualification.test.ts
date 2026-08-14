import { describe, expect, it } from 'vitest';

import {
  classifyPlayers,
  computeQualificationOutlook,
  findQualificationRevealMatchNumber,
  headToHeadWinProbability,
  type QualificationMatchInput,
} from '@/lib/engine/qualification';
import { TieBreakerType } from '@/types/domain/rule';

const TIEBREAK_ORDER = [TieBreakerType.WIN_MARGIN, TieBreakerType.LOSE_MARGIN, TieBreakerType.HEAD_TO_HEAD];

function match(
  playerOneId: string,
  playerTwoId: string,
  winnerId: string,
  winMargin: number | null = 1,
  loseMargin: number | null = -1,
): QualificationMatchInput {
  return { playerOneId, playerTwoId, winnerId, winMargin, loseMargin };
}

describe('headToHeadWinProbability', () => {
  it('is 50/50 for a pair with no history', () => {
    const { probability, aWins, bWins } = headToHeadWinProbability('A', 'B', []);
    expect(probability).toBe(0.5);
    expect(aWins).toBe(0);
    expect(bWins).toBe(0);
  });

  it('smooths a single lopsided result instead of reading it as certainty', () => {
    const all = [match('A', 'B', 'A')];
    const { probability } = headToHeadWinProbability('A', 'B', all);
    // (1+1)/(1+0+2) = 2/3, not 100%.
    expect(probability).toBeCloseTo(2 / 3);
  });

  it('is symmetric', () => {
    const all = [match('A', 'B', 'A'), match('A', 'B', 'A'), match('B', 'A', 'B')];
    const ab = headToHeadWinProbability('A', 'B', all);
    const ba = headToHeadWinProbability('B', 'A', all);
    expect(ab.probability + ba.probability).toBeCloseTo(1);
  });
});

describe('classifyPlayers', () => {
  const players = ['A', 'B', 'C', 'D', 'E', 'F'];

  it('qualifies players clear of the cutoff and lets a tied pair both in when there is room', () => {
    const winsMap = { A: 5, B: 4, C: 3, D: 3, E: 2, F: 1 };
    const result = classifyPlayers(players, winsMap, [], 4, TIEBREAK_ORDER);
    expect(result.A.classification).toBe('qualified');
    expect(result.B.classification).toBe('qualified');
    // C and D are tied on the boundary (3 wins) with exactly 2 spots left (4 - 2 above) — both fit.
    expect(result.C.classification).toBe('qualified');
    expect(result.D.classification).toBe('qualified');
    expect(result.E.classification).toBe('eliminated');
    expect(result.F.classification).toBe('eliminated');
    expect(result.E.reason).toContain('below the top-4 cutoff');
  });

  it('breaks a boundary tie by Win Margin when both are fully known', () => {
    const winsMap = { A: 4, B: 3, C: 3, D: 1, E: 1, F: 1 };
    const all: QualificationMatchInput[] = [
      match('B', 'X', 'B', 5, -5),
      match('C', 'X', 'C', 2, -2),
    ];
    // slots=2: boundary = 2nd highest wins = 3 (B and C tied), spotsLeft = 2-1(A)=1 for 2 tied players.
    const result = classifyPlayers(players, winsMap, all, 2, TIEBREAK_ORDER);
    expect(result.A.classification).toBe('qualified');
    expect(result.B.classification).toBe('qualified');
    expect(result.C.classification).toBe('eliminated');
    expect(result.C.reason).toContain('Win Margin');
  });

  it('marks both sides "contested" when one player\'s margin is still uncertain and could go either way', () => {
    const winsMap = { A: 4, B: 3, C: 3, D: 1, E: 1, F: 1 };
    const all: QualificationMatchInput[] = [
      // B's win margin is not yet known (a still-hypothetical result).
      match('B', 'X', 'B', null, null),
      match('C', 'X', 'C', 5, -5),
    ];
    const result = classifyPlayers(players, winsMap, all, 2, TIEBREAK_ORDER);
    expect(result.A.classification).toBe('qualified');
    expect(result.B.classification).toBe('contested');
    expect(result.C.classification).toBe('contested');
  });

  it('still resolves an uncertain player outright if their known margin already clears the rival', () => {
    const winsMap = { A: 4, B: 3, C: 3, D: 1, E: 1, F: 1 };
    const all: QualificationMatchInput[] = [
      match('B', 'X', 'B', 10, -10), // known portion already ahead of C
      match('B', 'Y', 'B', null, null), // plus an unresolved win on top
      match('C', 'X', 'C', 5, -5),
    ];
    const result = classifyPlayers(players, winsMap, all, 2, TIEBREAK_ORDER);
    expect(result.B.classification).toBe('qualified');
    expect(result.C.classification).toBe('eliminated');
  });
});

describe('computeQualificationOutlook', () => {
  it('locks in players already unreachable by the field and eliminates those who can never catch up', () => {
    const completedMatches: QualificationMatchInput[] = [
      match('A', 'C', 'A'),
      match('A', 'D', 'A'),
      match('B', 'C', 'B'),
      match('B', 'D', 'B'),
    ];
    // Only A and B have a match left to play; C and D are done at 0 wins forever.
    const remainingMatches = [{ playerOneId: 'A', playerTwoId: 'B' }];

    const outlook = computeQualificationOutlook({
      playerIds: ['A', 'B', 'C', 'D'],
      completedMatches,
      remainingMatches,
      allTimeMatches: completedMatches,
      qualificationSlots: 2,
      tieBreakerOrder: TIEBREAK_ORDER,
    });

    expect(outlook.A.floorPct).toBe(100);
    expect(outlook.A.midPct).toBe(100);
    expect(outlook.A.guaranteedMinWins).toBe(0);
    expect(outlook.A.reason).toContain('Already qualified');

    expect(outlook.B.floorPct).toBe(100);

    expect(outlook.C.floorPct).toBe(0);
    expect(outlook.C.ceilingPct).toBe(0);
    expect(outlook.C.certainElimMaxWins).toBe(0);
    expect(outlook.C.reason).toContain('Already eliminated');
    expect(outlook.D.floorPct).toBe(0);
  });

  it('splits probability between two players contesting the last spot based on head-to-head history', () => {
    // A is locked in on 3 wins with nothing left to play. B and C are tied on
    // 2 wins each with one match left — against each other — for the last spot.
    const completedMatches: QualificationMatchInput[] = [
      match('A', 'D', 'A'),
      match('A', 'E', 'A'),
      match('A', 'F', 'A'),
      match('B', 'D', 'B'),
      match('B', 'E', 'B'),
      match('C', 'D', 'C'),
      match('C', 'E', 'C'),
    ];
    const remainingMatches = [{ playerOneId: 'B', playerTwoId: 'C' }];

    const outlook = computeQualificationOutlook({
      playerIds: ['A', 'B', 'C', 'D', 'E', 'F'],
      completedMatches,
      remainingMatches,
      allTimeMatches: completedMatches,
      qualificationSlots: 2,
      tieBreakerOrder: TIEBREAK_ORDER,
    });

    expect(outlook.A.floorPct).toBe(100);
    // Whoever wins B vs C finishes level with A at 3 wins with exactly 2
    // spots to fill, so that branch resolves as a clean "qualified" (not
    // merely "ahead on this one match") — no contested weight either way,
    // so floor/ceiling/mid all land on the coin-flip 50%.
    expect(outlook.B.floorPct).toBe(50);
    expect(outlook.B.ceilingPct).toBe(50);
    expect(outlook.B.midPct).toBe(50);
    expect(outlook.C.floorPct).toBe(50);
    expect(outlook.C.midPct).toBe(50);
    // Winning their head-to-head guarantees B's spot; losing guarantees elimination.
    expect(outlook.B.guaranteedMinWins).toBe(1);
    expect(outlook.B.certainElimMaxWins).toBe(0);

    // B's only remaining match is against C, and it's the *only* remaining
    // match in the whole field — so "the other matches" have exactly one
    // way to go: no way at all (totalCombos === 1) for either of B's own
    // scenarios, matching the reference screenshot's "1/1 (100%)" pattern.
    expect(outlook.B.scenarios).toHaveLength(2);
    const [winScenario, loseScenario] = outlook.B.scenarios;
    expect(winScenario.ownWins).toBe(1);
    expect(winScenario.outcomes).toEqual([{ opponentId: 'C', won: true }]);
    expect(winScenario.totalCombos).toBe(1);
    expect(winScenario.qualifiedCount).toBe(1);
    expect(winScenario.eliminatedCount).toBe(0);
    expect(loseScenario.ownWins).toBe(0);
    expect(loseScenario.outcomes).toEqual([{ opponentId: 'C', won: false }]);
    expect(loseScenario.totalCombos).toBe(1);
    expect(loseScenario.eliminatedCount).toBe(1);
    expect(loseScenario.qualifiedCount).toBe(0);
  });

  it('breaks down every specific combination of a player\'s own remaining matches, not just a win count', () => {
    // D has two remaining matches (vs A, vs B) and they're the *only*
    // remaining matches in the field, so every scenario's "other matches"
    // denominator is 1 — but which specific opponent D beats/loses to
    // still changes the outcome (a 1-win tie with A plays out differently
    // than a 1-win tie with B), which a win-count-only bucket would blur.
    const completedMatches: QualificationMatchInput[] = [match('A', 'C', 'A'), match('B', 'C', 'B')];
    const remainingMatches = [
      { playerOneId: 'D', playerTwoId: 'A' },
      { playerOneId: 'D', playerTwoId: 'B' },
    ];

    const outlook = computeQualificationOutlook({
      playerIds: ['A', 'B', 'C', 'D'],
      completedMatches,
      remainingMatches,
      allTimeMatches: completedMatches,
      qualificationSlots: 2,
      tieBreakerOrder: TIEBREAK_ORDER,
    });

    expect(outlook.D.scenarios).toHaveLength(4);
    const [winBoth, beatsAOnly, beatsBOnly, loseBoth] = outlook.D.scenarios;

    // Beats both — clearly ahead of the boundary, no tiebreak needed.
    expect(winBoth.ownWins).toBe(2);
    expect(winBoth.outcomes).toEqual([
      { opponentId: 'A', won: true },
      { opponentId: 'B', won: true },
    ]);
    expect(winBoth).toMatchObject({ qualifiedCount: 1, contestedCount: 0, eliminatedCount: 0, totalCombos: 1 });

    // Loses both — clearly behind, no tiebreak needed either.
    expect(loseBoth.ownWins).toBe(0);
    expect(loseBoth.outcomes).toEqual([
      { opponentId: 'A', won: false },
      { opponentId: 'B', won: false },
    ]);
    expect(loseBoth).toMatchObject({ qualifiedCount: 0, contestedCount: 0, eliminatedCount: 1, totalCombos: 1 });

    // A single win ties D with whichever rival it beat, on a still-open Win
    // Margin (D's hypothetical win has no known margin) — genuinely
    // contested, not qualified or eliminated outright.
    expect(beatsAOnly.ownWins).toBe(1);
    expect(beatsAOnly.outcomes).toEqual([
      { opponentId: 'A', won: true },
      { opponentId: 'B', won: false },
    ]);
    expect(beatsAOnly).toMatchObject({ qualifiedCount: 0, contestedCount: 1, eliminatedCount: 0, totalCombos: 1 });

    expect(beatsBOnly.ownWins).toBe(1);
    expect(beatsBOnly.outcomes).toEqual([
      { opponentId: 'A', won: false },
      { opponentId: 'B', won: true },
    ]);
    expect(beatsBOnly).toMatchObject({ qualifiedCount: 0, contestedCount: 1, eliminatedCount: 0, totalCombos: 1 });
  });
});

describe('findQualificationRevealMatchNumber', () => {
  it('finds the first scheduled match at which every player has reached 2 played', () => {
    const schedule = [
      { matchNumber: 1, playerOneId: 'A', playerTwoId: 'B' },
      { matchNumber: 2, playerOneId: 'C', playerTwoId: 'D' },
      { matchNumber: 3, playerOneId: 'A', playerTwoId: 'C' },
      { matchNumber: 4, playerOneId: 'B', playerTwoId: 'D' },
    ];
    // After match 1: A=1,B=1. After 2: C=1,D=1. After 3: A=2,C=2 (B,D still 1).
    // After 4: B=2,D=2 — that's the first point everyone has >= 2.
    expect(findQualificationRevealMatchNumber(schedule, ['A', 'B', 'C', 'D'])).toBe(4);
  });

  it('is order-independent of array input order — it sorts by matchNumber itself', () => {
    const schedule = [
      { matchNumber: 3, playerOneId: 'A', playerTwoId: 'C' },
      { matchNumber: 1, playerOneId: 'A', playerTwoId: 'B' },
      { matchNumber: 4, playerOneId: 'B', playerTwoId: 'D' },
      { matchNumber: 2, playerOneId: 'C', playerTwoId: 'D' },
    ];
    expect(findQualificationRevealMatchNumber(schedule, ['A', 'B', 'C', 'D'])).toBe(4);
  });

  it('returns null when the schedule never reaches the threshold', () => {
    const schedule = [{ matchNumber: 1, playerOneId: 'A', playerTwoId: 'B' }];
    expect(findQualificationRevealMatchNumber(schedule, ['A', 'B', 'C'])).toBeNull();
  });
});
