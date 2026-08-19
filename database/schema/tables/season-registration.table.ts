import { index, integer, pgTable, uuid } from 'drizzle-orm/pg-core';
import { uniqueIndex } from 'drizzle-orm/pg-core';

import { TABLES } from '../constants';
import { idColumn, timestampColumns } from '../common';
import { registrationStatusEnum } from '../enums';
import { seasons } from './season.table';
import { players } from './player.table';
import { groups } from './group.table';
import { FK_CASCADE, FK_RESTRICT, FK_SET_NULL } from './foreign-keys';

export const seasonRegistrations = pgTable(
  TABLES.SEASON_REGISTRATIONS,
  {
    ...idColumn,

    seasonId: uuid('season_id')
      .notNull()
      .references(() => seasons.id, FK_CASCADE),

    playerId: uuid('player_id')
      .notNull()
      .references(() => players.id, FK_RESTRICT),

    groupId: uuid('group_id').references(() => groups.id, FK_SET_NULL),

    seed: integer('seed'),

    registrationStatus: registrationStatusEnum('registration_status')
      .notNull()
      .default('REGISTERED'),

    ...timestampColumns,
  },
  (table) => ({
    seasonIdx: index('idx_registration_season').on(table.seasonId),

    seasonPlayerUnique: uniqueIndex('uq_registration_season_player').on(
      table.seasonId,
      table.playerId,
    ),

    registrationStatusIdx: index('idx_registration_status').on(table.registrationStatus),

    playerIdx: index('idx_registration_player').on(table.playerId),

    groupIdx: index('idx_registration_group').on(table.groupId),
  }),
);
