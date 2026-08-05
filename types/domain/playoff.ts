import { MatchStage } from './domain/tournament';

export interface PlayoffMatch {
  matchId: string;

  seasonId: string;

  stage: MatchStage;

  playerOneId?: string;

  playerTwoId?: string;

  winnerId?: string;

  sourceMatchOne?: string;

  sourceMatchTwo?: string;
}

export interface PlayoffBracket {
  seasonId: string;

  matches: PlayoffMatch[];
}
