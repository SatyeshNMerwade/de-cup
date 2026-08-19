import { relations } from 'drizzle-orm';

import { ruleSets } from '../tables/rule-set.table';
import { seasons } from '../tables/season.table';

export const ruleSetRelations = relations(ruleSets, ({ many }) => ({
  seasons: many(seasons),
}));
