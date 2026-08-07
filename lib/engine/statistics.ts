/**
 * Career statistics engine.
 *
 * Reimplements index.html's Stats module (Overview + Rivalry tabs) as pure
 * functions over a chronologically-ordered all-time match log — same style
 * as lib/engine/standings.ts and lib/engine/qualification.ts: no DB/React
 * imports, plain data in, plain data out.
 *
 * One deliberate deviation from the original: index.html's stats used each
 * match's raw *displayed* balls-left number for avg-margin/biggest-win,
 * including foul-decided matches where that number is just flavor text.
 * This engine uses the stored winMargin instead (0 for a foul win, per the
 * seeding decision in database/seed/*) — a foul win simply doesn't
 * contribute to average/biggest-win, rather than contributing a
 * standings-inconsistent flavor number. 8-ball-blunder counts are
 * unaffected either way, since those come from the foul flag, not a margin.
 */

export interface CareerMatchInput {
  seasonNumber: number;
  seasonName: string;
  stage: string;
  playerOneId: string;
  playerTwoId: string;
  winnerId: string;
  winMargin: number | null;
  isEightBallFoul: boolean;
}

export interface BiggestWin {
  opponentId: string;
  margin: number;
  seasonNumber: number;
  stage: string;
}

export interface CurrentStreak {
  type: 'W' | 'L' | null;
  count: number;
}

export interface PlayerCareerStats {
  playerId: string;
  played: number;
  wins: number;
  losses: number;
  winPct: number;
  avgWinMargin: number;
  biggestWin: BiggestWin | null;
  eightBallFoulsCommitted: number;
  eightBallFoulsWon: number;
  longestWinStreak: number;
  currentStreak: CurrentStreak;
}

/** `matches` must already be in chronological order (oldest first). */
export function computeCareerStats(
  playerIds: string[],
  matches: CareerMatchInput[],
): Record<string, PlayerCareerStats> {
  const stats: Record<string, PlayerCareerStats> = {};
  const winMarginSum: Record<string, number> = {};
  const winMarginCount: Record<string, number> = {};
  const streakRun: Record<string, CurrentStreak> = {};

  playerIds.forEach((id) => {
    stats[id] = {
      playerId: id,
      played: 0,
      wins: 0,
      losses: 0,
      winPct: 0,
      avgWinMargin: 0,
      biggestWin: null,
      eightBallFoulsCommitted: 0,
      eightBallFoulsWon: 0,
      longestWinStreak: 0,
      currentStreak: { type: null, count: 0 },
    };
    winMarginSum[id] = 0;
    winMarginCount[id] = 0;
    streakRun[id] = { type: null, count: 0 };
  });

  matches.forEach((m) => {
    const loserId = m.winnerId === m.playerOneId ? m.playerTwoId : m.playerOneId;

    [m.playerOneId, m.playerTwoId].forEach((id) => {
      const s = stats[id];
      if (!s) return;
      s.played += 1;
      const isWin = id === m.winnerId;
      const run = streakRun[id];
      if (run.type === (isWin ? 'W' : 'L')) run.count += 1;
      else {
        run.type = isWin ? 'W' : 'L';
        run.count = 1;
      }
      if (isWin) s.longestWinStreak = Math.max(s.longestWinStreak, run.count);
    });

    const winner = stats[m.winnerId];
    const loser = stats[loserId];
    if (winner) winner.wins += 1;
    if (loser) loser.losses += 1;

    if (winner && m.winMargin != null) {
      winMarginSum[m.winnerId] += m.winMargin;
      winMarginCount[m.winnerId] += 1;
      if (!winner.biggestWin || m.winMargin > winner.biggestWin.margin) {
        winner.biggestWin = {
          opponentId: loserId,
          margin: m.winMargin,
          seasonNumber: m.seasonNumber,
          stage: m.stage,
        };
      }
    }

    if (m.isEightBallFoul) {
      if (loser) loser.eightBallFoulsCommitted += 1;
      if (winner) winner.eightBallFoulsWon += 1;
    }
  });

  playerIds.forEach((id) => {
    const s = stats[id];
    s.winPct = s.played > 0 ? Math.round((s.wins / s.played) * 100) : 0;
    s.avgWinMargin = winMarginCount[id] > 0 ? Math.round((winMarginSum[id] / winMarginCount[id]) * 10) / 10 : 0;
    s.currentStreak = { ...streakRun[id] };
  });

  return stats;
}

export interface HeadToHeadCell {
  wins: number;
  losses: number;
}

export function computeHeadToHeadGrid(
  playerIds: string[],
  matches: CareerMatchInput[],
): Record<string, Record<string, HeadToHeadCell>> {
  const grid: Record<string, Record<string, HeadToHeadCell>> = {};
  playerIds.forEach((a) => {
    grid[a] = {};
    playerIds.forEach((b) => {
      if (a !== b) grid[a][b] = { wins: 0, losses: 0 };
    });
  });

  matches.forEach((m) => {
    const loserId = m.winnerId === m.playerOneId ? m.playerTwoId : m.playerOneId;
    if (grid[m.winnerId]?.[loserId]) grid[m.winnerId][loserId].wins += 1;
    if (grid[loserId]?.[m.winnerId]) grid[loserId][m.winnerId].losses += 1;
  });

  return grid;
}
