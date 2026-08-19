import { index, integer, jsonb, pgTable, text, uuid, timestamp } from 'drizzle-orm/pg-core';
import { uniqueIndex } from 'drizzle-orm/pg-core';

import { TABLES } from '../constants';
import { idColumn, timestampColumns } from '../common';
import { matchResultTypeEnum, matchStageEnum, matchStatusEnum } from '../enums';
import { seasons } from './season.table';
import { groups } from './group.table';
import { players } from './player.table';
import { FK_CASCADE, FK_RESTRICT, FK_SET_NULL } from './foreign-keys';
import { MatchMetadata } from '@/types/domain/match';

export const matches = pgTable(
  TABLES.MATCHES,
  {
    ...idColumn,

    seasonId: uuid('season_id')
      .notNull()
      .references(() => seasons.id, FK_CASCADE),

    groupId: uuid('group_id').references(() => groups.id, FK_SET_NULL),

    matchNumber: integer('match_number').notNull(),

    stage: matchStageEnum('stage').notNull(),

    playerOneId: uuid('player_one_id')
      .notNull()
      .references(() => players.id, FK_RESTRICT),

    playerTwoId: uuid('player_two_id')
      .notNull()
      .references(() => players.id, FK_RESTRICT),

    winnerId: uuid('winner_id').references(() => players.id, FK_RESTRICT),

    loserId: uuid('loser_id').references(() => players.id, FK_RESTRICT),

    tossWinnerId: uuid('toss_winner_id').references(() => players.id, FK_RESTRICT),

    firstBreakerId: uuid('first_breaker_id').references(() => players.id, FK_RESTRICT),

    winMargin: integer('win_margin'),

    loseMargin: integer('lose_margin'),

    resultType: matchResultTypeEnum('result_type'),

    status: matchStatusEnum('status').default('SCHEDULED').notNull(),

    remarks: text('remarks'),

    metadata: jsonb('metadata').$type<MatchMetadata>(),

    completedAt: timestamp('completed_at', {
      withTimezone: true,
    }),

    createdBy: uuid('created_by'),

    lockedAt: timestamp('locked_at', {
      withTimezone: true,
    }),

    ...timestampColumns,
  },
  (table) => ({
    seasonIdx: index('idx_matches_season').on(table.seasonId),

    matchNumberIdx: index('idx_matches_number').on(table.seasonId, table.matchNumber),

    stageIdx: index('idx_matches_stage').on(table.stage),

    statusIdx: index('idx_matches_status').on(table.status),

    playerOneIdx: index('idx_matches_player_one').on(table.playerOneId),

    playerTwoIdx: index('idx_matches_player_two').on(table.playerTwoId),

    seasonMatchUnique: uniqueIndex('uq_matches_season_match_number').on(
      table.seasonId,
      table.matchNumber,
    ),
  }),
);
