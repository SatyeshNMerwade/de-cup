import { relations } from 'drizzle-orm';

import { groups } from '../tables/group.table';
import { matches } from '../tables/match.table';
import { players } from '../tables/player.table';
import { seasons } from '../tables/season.table';

export const matchRelations = relations(matches, ({ one }) => ({
  season: one(seasons, {
    fields: [matches.seasonId],
    references: [seasons.id],
  }),

  group: one(groups, {
    fields: [matches.groupId],
    references: [groups.id],
  }),

  playerOne: one(players, {
    fields: [matches.playerOneId],
    references: [players.id],
    relationName: 'player_one_matches',
  }),

  playerTwo: one(players, {
    fields: [matches.playerTwoId],
    references: [players.id],
    relationName: 'player_two_matches',
  }),

  winner: one(players, {
    fields: [matches.winnerId],
    references: [players.id],
    relationName: 'winner_matches',
  }),

  loser: one(players, {
    fields: [matches.loserId],
    references: [players.id],
    relationName: 'loser_matches',
  }),

  tossWinner: one(players, {
    fields: [matches.tossWinnerId],
    references: [players.id],
    relationName: 'toss_winner_matches',
  }),

  firstBreaker: one(players, {
    fields: [matches.firstBreakerId],
    references: [players.id],
    relationName: 'first_breaker_matches',
  }),
}));
