/**
 * DE Cup Tournament Domain Types
 *
 * This file contains the core enums that define the
 * tournament structure.
 *
 * NOTE:
 * Do NOT add database-specific types here.
 * Do NOT add React-specific types here.
 */

export enum TournamentFormat {
  GROUP = 'GROUP',

  LEAGUE = 'LEAGUE',
}

export enum PlayoffFormat {
  NONE = 'NONE',

  KNOCKOUT = 'KNOCKOUT',

  IPL = 'IPL',
}

export enum TournamentState {
  DRAFT = 'DRAFT',
  ACTIVE = 'ACTIVE',
  COMPLETED = 'COMPLETED',
  ARCHIVED = 'ARCHIVED',
}

export enum MatchStage {
  GROUP = 'GROUP',

  LEAGUE = 'LEAGUE',

  QUALIFIER_1 = 'QUALIFIER_1',

  ELIMINATOR = 'ELIMINATOR',

  QUALIFIER_2 = 'QUALIFIER_2',

  SEMI_FINAL = 'SEMI_FINAL',

  THIRD_PLACE = 'THIRD_PLACE',

  FINAL = 'FINAL',
}

export enum MatchStatus {
  SCHEDULED = 'SCHEDULED',

  COMPLETED = 'COMPLETED',

  LOCKED = 'LOCKED',
}

export enum MatchResultType {
  NORMAL = 'NORMAL',

  EIGHT_BALL_FOUL = 'EIGHT_BALL_FOUL',

  FOUL = 'FOUL',
}

export enum AwardCategory {
  AUTOMATIC = 'AUTOMATIC',

  MANUAL = 'MANUAL',
}
