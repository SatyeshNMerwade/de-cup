import { describe, expect, it } from 'vitest';

import {
  determineIplOutcome,
  determineNextIplMatches,
  type IplSeeds,
  type PlayoffMatchResult,
} from '@/lib/engine/playoffs';
import { MatchStage } from '@/types/domain/tournament';

const SEEDS: IplSeeds = { seed1: 'A', seed2: 'B', seed3: 'C', seed4: 'D' };

function playoffMatch(stage: MatchStage, playerOneId: string, playerTwoId: string, winnerId: string | null = null): PlayoffMatchResult {
  return { stage, playerOneId, playerTwoId, winnerId };
}

describe('determineNextIplMatches', () => {
  it('creates Qualifier 1 and Eliminator when nothing exists yet', () => {
    const next = determineNextIplMatches(SEEDS, []);
    expect(next).toEqual([
      { stage: MatchStage.QUALIFIER_1, playerOneId: 'A', playerTwoId: 'B' },
      { stage: MatchStage.ELIMINATOR, playerOneId: 'C', playerTwoId: 'D' },
    ]);
  });

  it('waits for both first-round matches to have a winner', () => {
    const existing = [
      playoffMatch(MatchStage.QUALIFIER_1, 'A', 'B', 'A'),
      playoffMatch(MatchStage.ELIMINATOR, 'C', 'D'),
    ];
    expect(determineNextIplMatches(SEEDS, existing)).toEqual([]);
  });

  it('creates Qualifier 2 (Q1 loser vs Eliminator winner) once both first-round matches finish', () => {
    const existing = [
      playoffMatch(MatchStage.QUALIFIER_1, 'A', 'B', 'A'),
      playoffMatch(MatchStage.ELIMINATOR, 'C', 'D', 'D'),
    ];
    expect(determineNextIplMatches(SEEDS, existing)).toEqual([
      { stage: MatchStage.QUALIFIER_2, playerOneId: 'B', playerTwoId: 'D' },
    ]);
  });

  it('creates the Final (Q1 winner vs Q2 winner) once Qualifier 2 finishes', () => {
    const existing = [
      playoffMatch(MatchStage.QUALIFIER_1, 'A', 'B', 'A'),
      playoffMatch(MatchStage.ELIMINATOR, 'C', 'D', 'D'),
      playoffMatch(MatchStage.QUALIFIER_2, 'B', 'D', 'D'),
    ];
    expect(determineNextIplMatches(SEEDS, existing)).toEqual([
      { stage: MatchStage.FINAL, playerOneId: 'A', playerTwoId: 'D' },
    ]);
  });

  it('creates nothing once the Final exists', () => {
    const existing = [
      playoffMatch(MatchStage.QUALIFIER_1, 'A', 'B', 'A'),
      playoffMatch(MatchStage.ELIMINATOR, 'C', 'D', 'D'),
      playoffMatch(MatchStage.QUALIFIER_2, 'B', 'D', 'D'),
      playoffMatch(MatchStage.FINAL, 'A', 'D'),
    ];
    expect(determineNextIplMatches(SEEDS, existing)).toEqual([]);
  });
});

describe('determineIplOutcome', () => {
  it('is null until the Final has a winner', () => {
    const existing = [
      playoffMatch(MatchStage.QUALIFIER_1, 'A', 'B', 'A'),
      playoffMatch(MatchStage.ELIMINATOR, 'C', 'D', 'D'),
      playoffMatch(MatchStage.QUALIFIER_2, 'B', 'D', 'D'),
      playoffMatch(MatchStage.FINAL, 'A', 'D'),
    ];
    expect(determineIplOutcome(existing)).toBeNull();
  });

  it('resolves champion/runner-up/third-place once the Final is complete', () => {
    const existing = [
      playoffMatch(MatchStage.QUALIFIER_1, 'A', 'B', 'A'),
      playoffMatch(MatchStage.ELIMINATOR, 'C', 'D', 'D'),
      playoffMatch(MatchStage.QUALIFIER_2, 'B', 'D', 'D'),
      playoffMatch(MatchStage.FINAL, 'A', 'D', 'A'),
    ];
    expect(determineIplOutcome(existing)).toEqual({
      championId: 'A',
      runnerUpId: 'D',
      thirdPlaceId: 'B',
    });
  });
});
