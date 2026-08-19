import { MatchResultType, MatchStage } from '@/types/domain/tournament';
import type { SeedAward, SeedLeagueMatch, SeedPlayoffResult } from './types';

/**
 * Transcribed from index.html's Season 2 SCHEDULE + STATIC_RESULTS. Match
 * numbers follow SCHEDULE's round order (STATIC_RESULTS itself is listed
 * unordered; the site resolves each entry to a match by player-pair, not
 * list position — verified by cross-checking every pairing below).
 *
 * Season 2's foul rule (RS2 v1): the recorded margin is the difference
 * between the two players' remaining balls, and it feeds winMargin/
 * loseMargin directly (can be negative) — unlike Seasons 3-4, a foul win
 * here is NOT zeroed out.
 */
export const SEASON2_PLAYERS = [
  'Kishan',
  'Shashwat',
  'Sachin',
  'Varun',
  'Karthik',
  'Satyesh',
] as const;

export const SEASON2_LEAGUE_MATCHES: SeedLeagueMatch[] = [
  { matchNumber: 1, playerOne: 'Shashwat', playerTwo: 'Satyesh', winner: 'Shashwat', winMargin: 0, loseMargin: 0, resultType: MatchResultType.NORMAL },
  { matchNumber: 2, playerOne: 'Kishan', playerTwo: 'Varun', winner: 'Kishan', winMargin: 1, loseMargin: -1, resultType: MatchResultType.NORMAL },
  { matchNumber: 3, playerOne: 'Shashwat', playerTwo: 'Varun', winner: 'Shashwat', winMargin: 0, loseMargin: 0, resultType: MatchResultType.NORMAL },
  { matchNumber: 4, playerOne: 'Sachin', playerTwo: 'Satyesh', winner: 'Satyesh', winMargin: 0, loseMargin: 0, resultType: MatchResultType.NORMAL },
  { matchNumber: 5, playerOne: 'Sachin', playerTwo: 'Karthik', winner: 'Sachin', winMargin: 0, loseMargin: 0, resultType: MatchResultType.NORMAL },
  {
    matchNumber: 6,
    playerOne: 'Karthik',
    playerTwo: 'Kishan',
    winner: 'Kishan',
    winMargin: 3,
    loseMargin: -3,
    resultType: MatchResultType.EIGHT_BALL_FOUL,
    remarks: 'Opponent pocketed 8 ball',
  },
  { matchNumber: 7, playerOne: 'Varun', playerTwo: 'Satyesh', winner: 'Satyesh', winMargin: 0, loseMargin: 0, resultType: MatchResultType.NORMAL },
  { matchNumber: 8, playerOne: 'Varun', playerTwo: 'Sachin', winner: 'Varun', winMargin: 1, loseMargin: -1, resultType: MatchResultType.NORMAL },
  { matchNumber: 9, playerOne: 'Varun', playerTwo: 'Karthik', winner: 'Varun', winMargin: 0, loseMargin: 0, resultType: MatchResultType.NORMAL },
  {
    matchNumber: 10,
    playerOne: 'Kishan',
    playerTwo: 'Sachin',
    winner: 'Sachin',
    // Mirrored-margin foul rule (RS2 v1): recorded as -2, feeding straight
    // into Sachin's winMargin and Kishan's loseMargin (+2), exactly as
    // index.html stores it.
    winMargin: -2,
    loseMargin: 2,
    resultType: MatchResultType.EIGHT_BALL_FOUL,
    remarks: 'Opponent pocketed 8 ball',
  },
  { matchNumber: 11, playerOne: 'Kishan', playerTwo: 'Satyesh', winner: 'Kishan', winMargin: 0, loseMargin: 0, resultType: MatchResultType.NORMAL },
  { matchNumber: 12, playerOne: 'Shashwat', playerTwo: 'Karthik', winner: 'Shashwat', winMargin: 0, loseMargin: 0, resultType: MatchResultType.NORMAL },
  { matchNumber: 13, playerOne: 'Kishan', playerTwo: 'Shashwat', winner: 'Kishan', winMargin: 1, loseMargin: -1, resultType: MatchResultType.NORMAL },
  { matchNumber: 14, playerOne: 'Shashwat', playerTwo: 'Sachin', winner: 'Shashwat', winMargin: 1, loseMargin: -1, resultType: MatchResultType.NORMAL },
  { matchNumber: 15, playerOne: 'Karthik', playerTwo: 'Satyesh', winner: 'Karthik', winMargin: 0, loseMargin: 0, resultType: MatchResultType.NORMAL },
];

/**
 * Playoff results only — participants are derived at seed time from the
 * standings engine (seed 1 vs 2 for Qualifier 1, seed 3 vs 4 for the
 * Eliminator, etc.), matching index.html's computePlayoffOutcomes().
 */
export const SEASON2_PLAYOFF_RESULTS: SeedPlayoffResult[] = [
  { stage: MatchStage.QUALIFIER_1, winner: 'Shashwat', winMargin: 0, loseMargin: 0 },
  { stage: MatchStage.ELIMINATOR, winner: 'Varun', winMargin: 0, loseMargin: 0 },
  { stage: MatchStage.QUALIFIER_2, winner: 'Varun', winMargin: 0, loseMargin: 0 },
  { stage: MatchStage.FINAL, winner: 'Shashwat', winMargin: 0, loseMargin: 0 },
];

export const SEASON2_AWARDS: SeedAward[] = [
  { player: 'Shashwat', name: 'Champion', category: 'AUTOMATIC', source: 'SYSTEM' },
  { player: 'Varun', name: 'Runner-Up', category: 'AUTOMATIC', source: 'SYSTEM' },
  { player: 'Kishan', name: 'Third Place', category: 'AUTOMATIC', source: 'SYSTEM' },
];
