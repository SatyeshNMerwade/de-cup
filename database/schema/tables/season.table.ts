import { boolean, date, index, integer, pgTable, text, uuid } from 'drizzle-orm/pg-core';
import { uniqueIndex } from 'drizzle-orm/pg-core';

import { idColumn, timestampColumns } from '../common';
import { TABLES } from '../constants';
import { playoffFormatEnum, tournamentFormatEnum, tournamentStateEnum } from '../enums';
import { ruleSets } from './rule-set.table';
import { FK_RESTRICT } from './foreign-keys';

export const seasons = pgTable(
  TABLES.SEASONS,
  {
    ...idColumn,

    seasonNumber: integer('season_number').notNull(),

    name: text('name').notNull(),

    description: text('description'),

    tournamentFormat: tournamentFormatEnum('tournament_format').notNull(),

    playoffFormat: playoffFormatEnum('playoff_format').notNull(),

    ruleSetId: uuid('rule_set_id')
      .notNull()
      .references(() => ruleSets.id, FK_RESTRICT),

    state: tournamentStateEnum('state').default('DRAFT').notNull(),

    isPublished: boolean('is_published').default(false).notNull(),

    startDate: date('start_date'),

    endDate: date('end_date'),

    ...timestampColumns,
  },
  (table) => ({
    seasonNumberIdx: index('idx_seasons_number').on(table.seasonNumber),

    seasonNumberUnique: uniqueIndex('uq_seasons_number').on(table.seasonNumber),

    ruleSetIdx: index('idx_seasons_rule_set').on(table.ruleSetId),

    stateIdx: index('idx_seasons_state').on(table.state),
  }),
);
