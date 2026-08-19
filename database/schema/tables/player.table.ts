import { index, pgTable, text } from 'drizzle-orm/pg-core';

import { idColumn, timestampColumns } from '../common';
import { TABLES } from '../constants';
import { playerStatusEnum } from '../enums';

export const players = pgTable(
  TABLES.PLAYERS,
  {
    ...idColumn,

    displayName: text('display_name').notNull(),

    shortName: text('short_name'),

    avatarUrl: text('avatar_url'),

    status: playerStatusEnum('status').default('ACTIVE').notNull(),

    ...timestampColumns,
  },
  (table) => ({
    displayNameIdx: index('idx_players_display_name').on(table.displayName),

    shortNameIdx: index('idx_players_short_name').on(table.shortName),
  }),
);
