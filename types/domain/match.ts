import { MatchResultType, MatchStage, MatchStatus } from './tournament';

export interface MatchDetails {
  id: string;

  seasonId: string;

  matchNumber: number;

  stage: MatchStage;

  groupId?: string;

  playerOneId: string;

  playerTwoId: string;

  scheduledAt?: Date;

  status: MatchStatus;
}

export interface MatchResult {
  matchId: string;

  winnerId: string;

  loserId: string;

  winMargin: number;

  loseMargin: number;

  resultType: MatchResultType;

  remarks?: string;

  completedAt: Date;
}

export interface Match {
  details: MatchDetails;

  result?: MatchResult;
}

export interface MatchSummary {
  matchId: string;

  matchNumber: number;

  stage: MatchStage;

  playerOneName: string;

  playerTwoName: string;

  winnerName?: string;

  completed: boolean;
}

export interface CreateMatchRequest {
  seasonId: string;

  matchNumber: number;

  stage: MatchStage;

  groupId?: string;

  playerOneId: string;

  playerTwoId: string;

  scheduledAt?: Date;
}

export interface CompleteMatchRequest {
  matchId: string;

  winnerId: string;

  winMargin: number;

  loseMargin: number;

  resultType: MatchResultType;

  remarks?: string;
}

export interface MatchContext {
  match: Match;

  seasonRulesId: string;
}

// types/match.ts

export interface MatchMetadata {
  tableNumber?: number;

  streamUrl?: string;

  notes?: string;

  walkover?: boolean;
}
