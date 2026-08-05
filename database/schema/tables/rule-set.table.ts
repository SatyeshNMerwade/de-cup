import { index, integer, jsonb, pgTable, text, uniqueIndex } from 'drizzle-orm/pg-core';

import type { RuleConfiguration } from '@/types/domain/rule';

import { idColumn, timestampColumns } from '../common';
import { TABLES } from '../constants';
import { playoffFormatEnum, tournamentFormatEnum } from '../enums';

export const ruleSets = pgTable(
  TABLES.RULE_SETS,
  {
    ...idColumn,

    name: text('name').notNull(),

    description: text('description'),

    version: integer('version').default(1).notNull(),

    tournamentFormat: tournamentFormatEnum('tournament_format').notNull(),

    playoffFormat: playoffFormatEnum('playoff_format').notNull(),

    rules: jsonb('rules').$type<RuleConfiguration>().notNull(),

    ...timestampColumns,
  },
  (table) => ({
    nameIdx: index('idx_rule_sets_name').on(table.name),

    versionIdx: index('idx_rule_sets_version').on(table.version),

    nameVersionUnique: uniqueIndex('uq_rule_sets_name_version').on(table.name, table.version),
  }),
);
