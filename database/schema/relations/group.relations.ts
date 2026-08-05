import { relations } from 'drizzle-orm';

import { groups } from '../tables/group.table';
import { matches } from '../tables/match.table';
import { seasonRegistrations } from '../tables/season-registration.table';
import { seasons } from '../tables/season.table';

export const groupRelations = relations(groups, ({ one, many }) => ({
  season: one(seasons, {
    fields: [groups.seasonId],
    references: [seasons.id],
  }),

  registrations: many(seasonRegistrations),

  matches: many(matches),
}));
