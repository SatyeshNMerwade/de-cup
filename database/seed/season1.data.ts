import { MatchResultType, MatchStage } from '@/types/domain/tournament';
import type { SeedAward, SeedLeagueMatch } from './types';

/**
 * Transcribed from index.html's GROUPS / state.matches (Season 1 script)
 * and the STATIC_RESULTS array. Season 1's rule set does not track Lose
 * Margin at all (enableLoseMargin: false), so it's left null throughout —
 * unlike later seasons, this was never a tracked concept in Season 1.
 */
export const SEASON1_GROUPS = {
  A: ['Shashwat', 'Varun', 'Satyesh'],
  B: ['Kishan', 'Sachin', 'Karthik'],
} as const;

export const SEASON1_GROUP_MATCHES: SeedLeagueMatch[] = [
  // Group B (match numbers 1-6)
  {
    matchNumber: 1,
    groupName: 'B',
    playerOne: 'Kishan',
    playerTwo: 'Sachin',
    winner: 'Kishan',
    winMargin: 0,
    loseMargin: null,
    resultType: MatchResultType.NORMAL,
  },
  {
    matchNumber: 2,
    groupName: 'B',
    playerOne: 'Kishan',
    playerTwo: 'Sachin',
    winner: 'Kishan',
    winMargin: 2,
    loseMargin: null,
    resultType: MatchResultType.NORMAL,
  },
  {
    matchNumber: 3,
    groupName: 'B',
    playerOne: 'Sachin',
    playerTwo: 'Karthik',
    winner: 'Sachin',
    winMargin: 2,
    loseMargin: null,
    resultType: MatchResultType.NORMAL,
  },
  {
    matchNumber: 4,
    groupName: 'B',
    playerOne: 'Sachin',
    playerTwo: 'Karthik',
    winner: 'Karthik',
    winMargin: 0,
    loseMargin: null,
    resultType: MatchResultType.NORMAL,
  },
  {
    matchNumber: 5,
    groupName: 'B',
    playerOne: 'Kishan',
    playerTwo: 'Karthik',
    winner: 'Kishan',
    winMargin: 4,
    loseMargin: null,
    resultType: MatchResultType.NORMAL,
  },
  {
    matchNumber: 6,
    groupName: 'B',
    playerOne: 'Kishan',
    playerTwo: 'Karthik',
    winner: 'Kishan',
    winMargin: 0,
    loseMargin: null,
    resultType: MatchResultType.EIGHT_BALL_FOUL,
    remarks: 'Opponent pocketed 8 ball',
  },
  // Group A (match numbers 7-12)
  {
    matchNumber: 7,
    groupName: 'A',
    playerOne: 'Shashwat',
    playerTwo: 'Varun',
    winner: 'Shashwat',
    winMargin: 3,
    loseMargin: null,
    resultType: MatchResultType.NORMAL,
  },
  {
    matchNumber: 8,
    groupName: 'A',
    playerOne: 'Shashwat',
    playerTwo: 'Varun',
    winner: 'Shashwat',
    winMargin: 2,
    loseMargin: null,
    resultType: MatchResultType.NORMAL,
  },
  {
    matchNumber: 9,
    groupName: 'A',
    playerOne: 'Shashwat',
    playerTwo: 'Satyesh',
    winner: 'Shashwat',
    winMargin: 2,
    loseMargin: null,
    resultType: MatchResultType.NORMAL,
  },
  {
    matchNumber: 10,
    groupName: 'A',
    playerOne: 'Shashwat',
    playerTwo: 'Satyesh',
    winner: 'Shashwat',
    winMargin: 3,
    loseMargin: null,
    resultType: MatchResultType.NORMAL,
  },
  {
    matchNumber: 11,
    groupName: 'A',
    playerOne: 'Varun',
    playerTwo: 'Satyesh',
    winner: 'Varun',
    winMargin: 0,
    loseMargin: null,
    resultType: MatchResultType.EIGHT_BALL_FOUL,
    remarks: 'Opponent pocketed 8 ball',
  },
  {
    matchNumber: 12,
    groupName: 'A',
    playerOne: 'Varun',
    playerTwo: 'Satyesh',
    winner: 'Varun',
    winMargin: 0,
    loseMargin: null,
    resultType: MatchResultType.EIGHT_BALL_FOUL,
    remarks: 'Opponent pocketed 8 ball',
  },
];

/**
 * Knockout bracket. Semifinal pairings are the site's a[0] vs b[1] / b[0]
 * vs a[1] rule applied to Group A/B standings (Shashwat/Kishan lead their
 * groups; Sachin takes Group B's #2 spot on the win-margin tiebreak over
 * Karthik). No ball margins are tracked at this stage in index.html.
 */
export const SEASON1_KNOCKOUT_MATCHES = [
  {
    matchNumber: 13,
    stage: MatchStage.SEMI_FINAL,
    playerOne: 'Shashwat',
    playerTwo: 'Sachin',
    winner: 'Shashwat',
  },
  {
    matchNumber: 14,
    stage: MatchStage.SEMI_FINAL,
    playerOne: 'Kishan',
    playerTwo: 'Varun',
    winner: 'Kishan',
  },
  {
    matchNumber: 15,
    stage: MatchStage.THIRD_PLACE,
    playerOne: 'Sachin',
    playerTwo: 'Varun',
    winner: 'Sachin',
  },
  {
    matchNumber: 16,
    stage: MatchStage.FINAL,
    playerOne: 'Shashwat',
    playerTwo: 'Kishan',
    winner: 'Kishan',
  },
] as const;

export const SEASON1_AWARDS: SeedAward[] = [
  { player: 'Kishan', name: 'Champion', category: 'AUTOMATIC', source: 'SYSTEM' },
  { player: 'Shashwat', name: 'Runner-Up', category: 'AUTOMATIC', source: 'SYSTEM' },
  { player: 'Sachin', name: 'Third Place', category: 'AUTOMATIC', source: 'SYSTEM' },
];
