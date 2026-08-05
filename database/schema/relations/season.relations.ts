import { relations } from 'drizzle-orm';

import { awards } from '../tables/award.table';
import { groups } from '../tables/group.table';
import { matches } from '../tables/match.table';
import { ruleSets } from '../tables/rule-set.table';
import { seasonRegistrations } from '../tables/season-registration.table';
import { seasons } from '../tables/season.table';

export const seasonRelations = relations(seasons, ({ one, many }) => ({
  ruleSet: one(ruleSets, {
    fields: [seasons.ruleSetId],
    references: [ruleSets.id],
  }),

  registrations: many(seasonRegistrations),

  groups: many(groups),

  matches: many(matches),

  awards: many(awards),
}));
