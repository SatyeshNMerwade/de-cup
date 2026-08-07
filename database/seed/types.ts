/**
 * Shared shapes for the historical-data seed files.
 *
 * These reference players by display name (not DB id) because ids don't
 * exist until the seed script inserts them — the script resolves names to
 * ids via a lookup map built after the `players` insert.
 */

import { MatchResultType, MatchStage } from '@/types/domain/tournament';

export interface SeedLeagueMatch {
  matchNumber: number;
  playerOne: string;
  playerTwo: string;
  winner: string;
  winMargin: number | null;
  loseMargin: number | null;
  resultType: MatchResultType;
  remarks?: string;
  completedAt?: string;
  /** Season 1 group stage only. */
  groupName?: string;
}

/**
 * A completed playoff match. `playerOne`/`playerTwo` are intentionally
 * omitted — the seed script derives them from the standings engine (seed
 * position) or a fixed bracket rule, exactly like index.html computes them
 * at render time instead of hardcoding names.
 */
export interface SeedPlayoffResult {
  stage: MatchStage;
  winner: string;
  winMargin: number;
  loseMargin: number;
  completedAt?: string;
}

export interface SeedScheduledMatch {
  matchNumber: number;
  playerOne: string;
  playerTwo: string;
}

export interface SeedAward {
  player: string;
  name: string;
  category: 'AUTOMATIC' | 'MANUAL';
  source: 'SYSTEM' | 'MANUAL';
  description?: string;
}
