import { index, integer, pgTable, text, uuid, uniqueIndex } from 'drizzle-orm/pg-core';

import { TABLES } from '../constants';
import { idColumn, timestampColumns } from '../common';
import { seasons } from './season.table';
import { FK_CASCADE } from './foreign-keys';

export const groups = pgTable(
  TABLES.GROUPS,
  {
    ...idColumn,

    seasonId: uuid('season_id')
      .notNull()
      .references(() => seasons.id, FK_CASCADE),

    name: text('name').notNull(),

    displayOrder: integer('display_order').notNull(),

    ...timestampColumns,
  },
  (table) => ({
    seasonIdx: index('idx_groups_season').on(table.seasonId),

    seasonGroupUnique: uniqueIndex('uq_groups_season_name').on(table.seasonId, table.name),

    displayOrderIdx: index('idx_groups_display_order').on(table.displayOrder),
  }),
);
