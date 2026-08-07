/**
 * IPL-format playoff progression engine.
 *
 * Pure and framework-independent (mirrors standings.ts/qualification.ts's
 * style): given the top-4 league seeds and whatever playoff-stage matches
 * already exist, decides what's ready to be created next. No DB/React
 * imports — the caller is responsible for fetching current state and
 * persisting whatever this returns.
 *
 * Stage flow: seed1 vs seed2 (Qualifier 1) and seed3 vs seed4 (Eliminator)
 * play simultaneously; Qualifier 1's loser faces the Eliminator's winner in
 * Qualifier 2; Qualifier 1's winner waits for Qualifier 2's winner in the
 * Final; Qualifier 2's loser takes Third Place.
 */

import { MatchStage } from '@/types/domain/tournament';

export interface IplSeeds {
  seed1: string;
  seed2: string;
  seed3: string;
  seed4: string;
}

export interface PlayoffMatchResult {
  stage: MatchStage;
  playerOneId: string;
  playerTwoId: string;
  winnerId: string | null;
}

export interface NextPlayoffMatch {
  stage: MatchStage;
  playerOneId: string;
  playerTwoId: string;
}

export interface IplOutcome {
  championId: string;
  runnerUpId: string;
  thirdPlaceId: string;
}

function otherPlayer(m: { playerOneId: string; playerTwoId: string }, playerId: string): string {
  return m.playerOneId === playerId ? m.playerTwoId : m.playerOneId;
}

/**
 * Returns the 0-2 playoff matches that should be created next, given the
 * top-4 seeds and whichever playoff-stage matches already exist. Empty
 * once nothing new is ready yet, or the playoffs are fully resolved.
 */
export function determineNextIplMatches(seeds: IplSeeds, existing: PlayoffMatchResult[]): NextPlayoffMatch[] {
  const q1 = existing.find((m) => m.stage === MatchStage.QUALIFIER_1);
  const eliminator = existing.find((m) => m.stage === MatchStage.ELIMINATOR);

  if (!q1 && !eliminator) {
    return [
      { stage: MatchStage.QUALIFIER_1, playerOneId: seeds.seed1, playerTwoId: seeds.seed2 },
      { stage: MatchStage.ELIMINATOR, playerOneId: seeds.seed3, playerTwoId: seeds.seed4 },
    ];
  }

  const q2 = existing.find((m) => m.stage === MatchStage.QUALIFIER_2);
  if (!q2 && q1?.winnerId && eliminator?.winnerId) {
    return [
      {
        stage: MatchStage.QUALIFIER_2,
        playerOneId: otherPlayer(q1, q1.winnerId),
        playerTwoId: eliminator.winnerId,
      },
    ];
  }

  const final = existing.find((m) => m.stage === MatchStage.FINAL);
  if (!final && q1?.winnerId && q2?.winnerId) {
    return [{ stage: MatchStage.FINAL, playerOneId: q1.winnerId, playerTwoId: q2.winnerId }];
  }

  return [];
}

/** Once the Final and Qualifier 2 both have winners, resolves Champion/Runner-Up/Third Place. Otherwise null. */
export function determineIplOutcome(existing: PlayoffMatchResult[]): IplOutcome | null {
  const q2 = existing.find((m) => m.stage === MatchStage.QUALIFIER_2);
  const final = existing.find((m) => m.stage === MatchStage.FINAL);
  if (!q2?.winnerId || !final?.winnerId) return null;

  return {
    championId: final.winnerId,
    runnerUpId: otherPlayer(final, final.winnerId),
    thirdPlaceId: otherPlayer(q2, q2.winnerId),
  };
}
