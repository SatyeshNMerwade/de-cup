import { MatchResultType, MatchStage } from '@/types/domain/tournament';
import type { SeedAward, SeedLeagueMatch, SeedPlayoffResult } from './types';

/**
 * Transcribed from index.html's Season 3 SCHEDULE + STATIC_RESULTS.
 *
 * Season 3's foul rule (RS2 v2, shared with Season 4): a foul win records
 * winMargin 0 (the win doesn't get credit for balls left), and the foul
 * loss takes a fixed loseMargin penalty (-1 by default, matching
 * index.html's `foulPenalty ?? -1`) rather than mirroring the raw
 * balls-left value. The one foul match below (#7) shows "1 ball(s) left"
 * on the site purely as a display artifact of the loser's own remaining
 * balls — it does not feed the standings, per index.html's computeRawStats.
 */
export const SEASON3_PLAYERS = [
  'Kishan',
  'Shashwat',
  'Sachin',
  'Varun',
  'Karthik',
  'Satyesh',
] as const;

export const SEASON3_LEAGUE_MATCHES: SeedLeagueMatch[] = [
  { matchNumber: 1, playerOne: 'Satyesh', playerTwo: 'Kishan', winner: 'Kishan', winMargin: 5, loseMargin: -5, resultType: MatchResultType.NORMAL },
  { matchNumber: 2, playerOne: 'Shashwat', playerTwo: 'Karthik', winner: 'Shashwat', winMargin: 5, loseMargin: -5, resultType: MatchResultType.NORMAL },
  { matchNumber: 3, playerOne: 'Sachin', playerTwo: 'Varun', winner: 'Sachin', winMargin: 1, loseMargin: -1, resultType: MatchResultType.NORMAL },
  { matchNumber: 4, playerOne: 'Satyesh', playerTwo: 'Karthik', winner: 'Satyesh', winMargin: 1, loseMargin: -1, resultType: MatchResultType.NORMAL },
  { matchNumber: 5, playerOne: 'Kishan', playerTwo: 'Varun', winner: 'Kishan', winMargin: 1, loseMargin: -1, resultType: MatchResultType.NORMAL },
  { matchNumber: 6, playerOne: 'Shashwat', playerTwo: 'Sachin', winner: 'Shashwat', winMargin: 1, loseMargin: -1, resultType: MatchResultType.NORMAL },
  {
    matchNumber: 7,
    playerOne: 'Satyesh',
    playerTwo: 'Shashwat',
    winner: 'Satyesh',
    // Foul win: winMargin recorded as 0, not the displayed "1 ball left".
    winMargin: 0,
    loseMargin: -1,
    resultType: MatchResultType.EIGHT_BALL_FOUL,
    remarks: 'Opponent pocketed 8 ball',
  },
  { matchNumber: 8, playerOne: 'Sachin', playerTwo: 'Kishan', winner: 'Kishan', winMargin: 4, loseMargin: -4, resultType: MatchResultType.NORMAL },
  { matchNumber: 9, playerOne: 'Varun', playerTwo: 'Karthik', winner: 'Varun', winMargin: 2, loseMargin: -2, resultType: MatchResultType.NORMAL },
  { matchNumber: 10, playerOne: 'Sachin', playerTwo: 'Satyesh', winner: 'Sachin', winMargin: 0, loseMargin: 0, resultType: MatchResultType.NORMAL },
  { matchNumber: 11, playerOne: 'Shashwat', playerTwo: 'Varun', winner: 'Shashwat', winMargin: 0, loseMargin: 0, resultType: MatchResultType.NORMAL },
  { matchNumber: 12, playerOne: 'Karthik', playerTwo: 'Kishan', winner: 'Karthik', winMargin: 1, loseMargin: -1, resultType: MatchResultType.NORMAL },
  { matchNumber: 13, playerOne: 'Satyesh', playerTwo: 'Varun', winner: 'Varun', winMargin: 2, loseMargin: -2, resultType: MatchResultType.NORMAL },
  { matchNumber: 14, playerOne: 'Karthik', playerTwo: 'Sachin', winner: 'Karthik', winMargin: 4, loseMargin: -4, resultType: MatchResultType.NORMAL },
  { matchNumber: 15, playerOne: 'Kishan', playerTwo: 'Shashwat', winner: 'Shashwat', winMargin: 2, loseMargin: -2, resultType: MatchResultType.NORMAL },
];

export const SEASON3_PLAYOFF_RESULTS: SeedPlayoffResult[] = [
  { stage: MatchStage.QUALIFIER_1, winner: 'Shashwat', winMargin: 0, loseMargin: 0 },
  { stage: MatchStage.ELIMINATOR, winner: 'Varun', winMargin: 0, loseMargin: 0 },
  { stage: MatchStage.QUALIFIER_2, winner: 'Varun', winMargin: 0, loseMargin: 0 },
  { stage: MatchStage.FINAL, winner: 'Varun', winMargin: 0, loseMargin: 0 },
];

export const SEASON3_AWARDS: SeedAward[] = [
  { player: 'Varun', name: 'Champion', category: 'AUTOMATIC', source: 'SYSTEM' },
  { player: 'Shashwat', name: 'Runner-Up', category: 'AUTOMATIC', source: 'SYSTEM' },
  { player: 'Kishan', name: 'Third Place', category: 'AUTOMATIC', source: 'SYSTEM' },
  {
    player: 'Satyesh',
    name: 'Fair Play',
    category: 'MANUAL',
    source: 'MANUAL',
    description:
      "For a moment of true sportsmanship, forgiving a foul against Varun in their league match rather than taking the point.",
  },
];
