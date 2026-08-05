export interface Standing {
  playerId: string;

  played: number;

  won: number;

  lost: number;

  points: number;

  winMargin: number;

  loseMargin: number;

  position: number;
}

export interface LeagueTable {
  seasonId: string;

  standings: Standing[];
}
