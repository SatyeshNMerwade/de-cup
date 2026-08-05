import { relations } from 'drizzle-orm';

import { awards } from '../tables/award.table';
import { players } from '../tables/player.table';
import { seasons } from '../tables/season.table';

export const awardRelations = relations(awards, ({ one }) => ({
  season: one(seasons, {
    fields: [awards.seasonId],
    references: [seasons.id],
  }),

  player: one(players, {
    fields: [awards.playerId],
    references: [players.id],
  }),
}));
