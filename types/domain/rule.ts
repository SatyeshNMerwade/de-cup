/**
 * DE Cup Rule Domain Types
 *
 * Defines how a season is played.
 *
 * These are business rules and are completely
 * independent of the database and UI.
 */

import { MatchStage, PlayoffFormat, TournamentFormat } from './tournament';

export enum TieBreakerType {
  HEAD_TO_HEAD = 'HEAD_TO_HEAD',

  WIN_MARGIN = 'WIN_MARGIN',

  LOSE_MARGIN = 'LOSE_MARGIN',

  TOTAL_WINS = 'TOTAL_WINS',
}

export interface ScoringRules {
  pointsPerWin: number;

  allowDraws: boolean;

  enableWinMargin: boolean;

  enableLoseMargin: boolean;
}

export interface QualificationRules {
  qualificationSlots: number;

  enableQualificationPercentage: boolean;

  enableQualificationScenario: boolean;
}

export interface TieBreakerRules {
  order: TieBreakerType[];
}

export interface PlayoffRules {
  enabled: boolean;

  playoffFormat: PlayoffFormat;

  qualificationSlots: number;
}

export interface StageRules {
  stages: MatchStage[];
}

export interface RuleConfiguration {
  scoring: ScoringRules;

  qualification: QualificationRules;

  tieBreakers: TieBreakerRules;

  playoffs: PlayoffRules;

  stages: StageRules;
}

export interface RuleSet {
  id: string;

  name: string;

  description?: string;

  version: number;

  tournamentFormat: TournamentFormat;

  playoffFormat: PlayoffFormat;

  rules: RuleConfiguration;
}
