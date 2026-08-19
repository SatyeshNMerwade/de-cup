/**
 * Round-robin schedule generation.
 *
 * Every player plays every other player exactly once. Unlike the classic
 * "circle method" (which groups matches into simultaneous rounds for
 * real-world day-by-day scheduling), matches here are recorded one at a
 * time and there's no date/session field on a match — so all that's
 * actually needed is the full set of unique pairs, in a simple, stable
 * order.
 */

export interface RoundRobinPair {
  playerOneId: string;
  playerTwoId: string;
}

export function generateRoundRobinPairs(playerIds: string[]): RoundRobinPair[] {
  const pairs: RoundRobinPair[] = [];
  for (let i = 0; i < playerIds.length; i++) {
    for (let j = i + 1; j < playerIds.length; j++) {
      pairs.push({ playerOneId: playerIds[i], playerTwoId: playerIds[j] });
    }
  }
  return pairs;
}
