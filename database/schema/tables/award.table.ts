import { index, pgTable, text, uuid, uniqueIndex } from 'drizzle-orm/pg-core';

import { TABLES } from '../constants';
import { idColumn, timestampColumns } from '../common';
import { awardCategoryEnum, awardSourceEnum } from '../enums';
import { seasons } from './season.table';
import { players } from './player.table';
import { FK_CASCADE, FK_RESTRICT } from './foreign-keys';

export const awards = pgTable(
  TABLES.AWARDS,
  {
    ...idColumn,

    seasonId: uuid('season_id')
      .notNull()
      .references(() => seasons.id, FK_CASCADE),

    playerId: uuid('player_id')
      .notNull()
      .references(() => players.id, FK_RESTRICT),

    name: text('name').notNull(),

    category: awardCategoryEnum('category').notNull(),

    description: text('description'),

    source: awardSourceEnum('source').default('SYSTEM').notNull(),

    ...timestampColumns,
  },
  (table) => ({
    seasonIdx: index('idx_awards_season').on(table.seasonId),

    playerIdx: index('idx_awards_player').on(table.playerId),

    seasonPlayerAwardUnique: uniqueIndex('uq_awards_season_player_name').on(
      table.seasonId,
      table.playerId,
      table.name,
    ),

    categoryIdx: index('idx_awards_category').on(table.category),
  }),
);
