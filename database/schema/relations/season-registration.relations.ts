import { relations } from 'drizzle-orm';

import { groups } from '../tables/group.table';
import { players } from '../tables/player.table';
import { seasonRegistrations } from '../tables/season-registration.table';
import { seasons } from '../tables/season.table';

export const seasonRegistrationRelations = relations(seasonRegistrations, ({ one }) => ({
  season: one(seasons, {
    fields: [seasonRegistrations.seasonId],
    references: [seasons.id],
  }),

  player: one(players, {
    fields: [seasonRegistrations.playerId],
    references: [players.id],
  }),

  group: one(groups, {
    fields: [seasonRegistrations.groupId],
    references: [groups.id],
  }),
}));
