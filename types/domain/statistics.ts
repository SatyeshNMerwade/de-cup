export interface CareerStatistics {
  playerId: string;

  seasonsPlayed: number;

  matchesPlayed: number;

  wins: number;

  losses: number;

  winPercentage: number;

  totalWinMargin: number;

  totalLoseMargin: number;

  championships: number;

  runnersUp: number;
}

export interface SeasonStatistics {
  seasonId: string;

  playerId: string;

  matchesPlayed: number;

  wins: number;

  losses: number;

  winPercentage: number;

  winMargin: number;

  loseMargin: number;
}
