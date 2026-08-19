import { pgEnum } from 'drizzle-orm/pg-core';

import {
  AwardCategory,
  MatchResultType,
  MatchStatus,
  PlayoffFormat,
  TournamentFormat,
  TournamentState,
} from '@/types/domain/tournament';

import { PlayerStatus } from '@/types/domain/player';

import { RegistrationStatus } from '@/types/domain/season';

import { MatchStage } from '@/types/domain/tournament';
import { AwardSource } from '@/types/domain/award';
import { UserRole } from '@/types/domain/user';

export const playerStatusEnum = pgEnum(
  'player_status',
  Object.values(PlayerStatus) as [string, ...string[]],
);

export const tournamentStateEnum = pgEnum(
  'tournament_state',
  Object.values(TournamentState) as [string, ...string[]],
);

export const tournamentFormatEnum = pgEnum(
  'tournament_format',
  Object.values(TournamentFormat) as [string, ...string[]],
);

export const playoffFormatEnum = pgEnum(
  'playoff_format',
  Object.values(PlayoffFormat) as [string, ...string[]],
);

export const matchStatusEnum = pgEnum(
  'match_status',
  Object.values(MatchStatus) as [string, ...string[]],
);

export const matchResultTypeEnum = pgEnum(
  'match_result_type',
  Object.values(MatchResultType) as [string, ...string[]],
);

export const registrationStatusEnum = pgEnum(
  'registration_status',
  Object.values(RegistrationStatus) as [string, ...string[]],
);

export const awardCategoryEnum = pgEnum(
  'award_category',
  Object.values(AwardCategory) as [string, ...string[]],
);

export const awardSourceEnum = pgEnum(
  'award_source',
  Object.values(AwardSource) as [string, ...string[]],
);

export const matchStageEnum = pgEnum(
  'match_stage',
  Object.values(MatchStage) as [string, ...string[]],
);

export const userRoleEnum = pgEnum('user_role', Object.values(UserRole) as [string, ...string[]]);
