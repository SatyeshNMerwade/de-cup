/**
 * DE Cup Season Domain Types
 *
 * Defines season-related interfaces used throughout the application.
 *
 * IMPORTANT:
 * This file is framework independent.
 * No React, Drizzle or API-specific types belong here.
 */

import { TournamentFormat, PlayoffFormat, TournamentState } from './tournament';

export enum RegistrationStatus {
  REGISTERED = 'REGISTERED',

  WITHDRAWN = 'WITHDRAWN',
}

export interface Season {
  id: string;

  seasonNumber: number;

  name: string;

  description?: string;

  tournamentFormat: TournamentFormat;

  playoffFormat: PlayoffFormat;

  displayOrder: number;

  ruleSetId: string;

  state: TournamentState;

  startDate?: Date;

  endDate?: Date;

  createdAt: Date;

  updatedAt: Date;
}

export interface SeasonRegistration {
  id: string;

  seasonId: string;

  playerId: string;

  seed?: number;

  registrationStatus: RegistrationStatus;

  registeredAt: Date;
}

export interface SeasonSummary {
  seasonId: string;

  seasonNumber: number;

  totalPlayers: number;

  totalMatches: number;

  completedMatches: number;

  pendingMatches: number;

  state: TournamentState;
}

export interface CreateSeasonRequest {
  seasonNumber: number;

  name: string;

  description?: string;

  tournamentFormat: TournamentFormat;

  playoffFormat: PlayoffFormat;

  ruleSetId: string;
}

export interface UpdateSeasonRequest {
  name?: string;

  description?: string;

  state?: TournamentState;

  startDate?: Date;

  endDate?: Date;

  ruleSetId?: string;
}
