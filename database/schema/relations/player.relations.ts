import { relations } from 'drizzle-orm';

import { awards } from '../tables/award.table';
import { matches } from '../tables/match.table';
import { players } from '../tables/player.table';
import { seasonRegistrations } from '../tables/season-registration.table';

export const playerRelations = relations(players, ({ many }) => ({
  registrations: many(seasonRegistrations),

  awards: many(awards),

  playerOneMatches: many(matches, {
    relationName: 'player_one_matches',
  }),

  playerTwoMatches: many(matches, {
    relationName: 'player_two_matches',
  }),

  wonMatches: many(matches, {
    relationName: 'winner_matches',
  }),

  lostMatches: many(matches, {
    relationName: 'loser_matches',
  }),
}));
