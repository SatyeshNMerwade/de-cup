import type { SeedScheduledMatch } from './types';

/**
 * Transcribed from index.html's Season 4 SCHEDULE. STATIC_RESULTS is still
 * empty on the site as of this seed (league in progress, nothing played
 * yet), so every match here is seeded as SCHEDULED with no result.
 */
export const SEASON4_PLAYERS = [
  'Kishan',
  'Shashwat',
  'Sachin',
  'Varun',
  'Karthik',
  'Satyesh',
  'Sughosh',
] as const;

export const SEASON4_SCHEDULED_MATCHES: SeedScheduledMatch[] = [
  { matchNumber: 1, playerOne: 'Shashwat', playerTwo: 'Sachin' },
  { matchNumber: 2, playerOne: 'Karthik', playerTwo: 'Sughosh' },
  { matchNumber: 3, playerOne: 'Varun', playerTwo: 'Satyesh' },
  { matchNumber: 4, playerOne: 'Kishan', playerTwo: 'Varun' },
  { matchNumber: 5, playerOne: 'Satyesh', playerTwo: 'Sughosh' },
  { matchNumber: 6, playerOne: 'Varun', playerTwo: 'Karthik' },
  { matchNumber: 7, playerOne: 'Kishan', playerTwo: 'Shashwat' },
  { matchNumber: 8, playerOne: 'Kishan', playerTwo: 'Sachin' },
  { matchNumber: 9, playerOne: 'Sachin', playerTwo: 'Varun' },
  { matchNumber: 10, playerOne: 'Kishan', playerTwo: 'Karthik' },
  { matchNumber: 11, playerOne: 'Shashwat', playerTwo: 'Sughosh' },
  { matchNumber: 12, playerOne: 'Shashwat', playerTwo: 'Satyesh' },
  { matchNumber: 13, playerOne: 'Shashwat', playerTwo: 'Karthik' },
  { matchNumber: 14, playerOne: 'Kishan', playerTwo: 'Satyesh' },
  { matchNumber: 15, playerOne: 'Sachin', playerTwo: 'Sughosh' },
  { matchNumber: 16, playerOne: 'Varun', playerTwo: 'Sughosh' },
  { matchNumber: 17, playerOne: 'Sachin', playerTwo: 'Satyesh' },
  { matchNumber: 18, playerOne: 'Kishan', playerTwo: 'Sughosh' },
  { matchNumber: 19, playerOne: 'Shashwat', playerTwo: 'Varun' },
  { matchNumber: 20, playerOne: 'Karthik', playerTwo: 'Satyesh' },
  { matchNumber: 21, playerOne: 'Sachin', playerTwo: 'Karthik' },
];
