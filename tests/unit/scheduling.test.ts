import { describe, expect, it } from 'vitest';

import { generateRoundRobinPairs } from '@/lib/engine/scheduling';

function assertValidRoundRobin(playerIds: string[]) {
  const pairs = generateRoundRobinPairs(playerIds);
  const expectedCount = (playerIds.length * (playerIds.length - 1)) / 2;
  expect(pairs).toHaveLength(expectedCount);

  // Every player appears in exactly (n-1) matches.
  const appearances = new Map<string, number>();
  playerIds.forEach((id) => appearances.set(id, 0));
  pairs.forEach((p) => {
    appearances.set(p.playerOneId, (appearances.get(p.playerOneId) ?? 0) + 1);
    appearances.set(p.playerTwoId, (appearances.get(p.playerTwoId) ?? 0) + 1);
  });
  appearances.forEach((count) => expect(count).toBe(playerIds.length - 1));

  // No duplicate or reversed pairs, and nobody plays themselves.
  const seen = new Set<string>();
  pairs.forEach((p) => {
    expect(p.playerOneId).not.toBe(p.playerTwoId);
    const key = [p.playerOneId, p.playerTwoId].sort().join('|');
    expect(seen.has(key)).toBe(false);
    seen.add(key);
  });

  return pairs;
}

describe('generateRoundRobinPairs', () => {
  it('generates a correct schedule for an even number of players', () => {
    assertValidRoundRobin(['A', 'B', 'C', 'D', 'E', 'F']); // 6 players -> 15 matches
  });

  it('generates a correct schedule for an odd number of players', () => {
    assertValidRoundRobin(['A', 'B', 'C', 'D', 'E', 'F', 'G']); // 7 players -> 21 matches
  });

  it('handles the smallest meaningful case', () => {
    const pairs = generateRoundRobinPairs(['A', 'B']);
    expect(pairs).toEqual([{ playerOneId: 'A', playerTwoId: 'B' }]);
  });

  it('returns no matches for fewer than 2 players', () => {
    expect(generateRoundRobinPairs([])).toEqual([]);
    expect(generateRoundRobinPairs(['A'])).toEqual([]);
  });
});
