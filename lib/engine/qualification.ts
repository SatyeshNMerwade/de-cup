/**
 * Qualification engine.
 *
 * Reimplements index.html's qualification-percentage simulator as one
 * reusable, rule-driven function (mirrors lib/engine/standings.ts's style:
 * pure, no DB/React imports, takes plain match data in).
 *
 * Every possible outcome of a season's remaining table-stage matches is
 * enumerated exhaustively (2^remaining — bounded by real schedule sizes
 * here, at most 21 matches, and typically far fewer once the reveal
 * threshold callers use is hit), each weighted by the pair's all-time
 * head-to-head win probability, and classified qualified/eliminated/
 * contested using the same tiebreak order as the real standings table.
 *
 * This uses the more rigorous "uncertain margin" classification (index.html
 * called this classifyPlayerTie, used for its Season 3-4 rule set) uniformly
 * rather than also porting Season 2's cruder original version — a hypothetical
 * win with no known margin only proves a player's Win Margin is *at least*
 * their current total; a rival is only counted as definitely ahead when that
 * holds no matter how large the unresolved margin turns out to be.
 */

import { TieBreakerType } from '@/types/domain/rule';

export interface QualificationMatchInput {
  playerOneId: string;
  playerTwoId: string;
  winnerId: string;
  winMargin: number | null;
  loseMargin: number | null;
}

export interface RemainingMatchInput {
  playerOneId: string;
  playerTwoId: string;
}

export type PlayerClassification = 'qualified' | 'eliminated' | 'contested';

export interface ClassificationResult {
  classification: PlayerClassification;
  /** Only set for 'eliminated'. */
  reason?: string;
}

export function headToHeadWinProbability(
  a: string,
  b: string,
  allTimeMatches: QualificationMatchInput[],
): { probability: number; aWins: number; bWins: number } {
  let aWins = 0;
  let bWins = 0;
  allTimeMatches.forEach((m) => {
    const involved = (m.playerOneId === a && m.playerTwoId === b) || (m.playerOneId === b && m.playerTwoId === a);
    if (!involved) return;
    if (m.winnerId === a) aWins++;
    else if (m.winnerId === b) bWins++;
  });
  // Laplace smoothing: an unplayed pairing is 50/50, and a single lopsided
  // result isn't read as certainty for the rematch.
  const probability = (aWins + 1) / (aWins + bWins + 2);
  return { probability, aWins, bWins };
}

interface MarginInfo {
  winMargin: number;
  loseMargin: number;
  /** True once this player has a hypothetical win in `allMatches` with no known margin. */
  uncertain: boolean;
}

function computeTiedGroupMargins(
  tiedGroup: string[],
  allMatches: QualificationMatchInput[],
): Map<string, MarginInfo> {
  const margin = new Map<string, MarginInfo>();
  tiedGroup.forEach((id) => margin.set(id, { winMargin: 0, loseMargin: 0, uncertain: false }));

  allMatches.forEach((m) => {
    if (m.winMargin == null) {
      // Hypothetical match with an unknown margin: we know who won but not
      // by how much, so it can't contribute a real number to either side —
      // it only flags the winner's margin as not-yet-fully-known.
      const winnerEntry = margin.get(m.winnerId);
      if (winnerEntry) winnerEntry.uncertain = true;
      return;
    }
    const loserId = m.winnerId === m.playerOneId ? m.playerTwoId : m.playerOneId;
    const winnerEntry = margin.get(m.winnerId);
    if (winnerEntry) winnerEntry.winMargin += m.winMargin;
    const loserEntry = margin.get(loserId);
    if (loserEntry) loserEntry.loseMargin += m.loseMargin ?? 0;
  });

  return margin;
}

function headToHeadSubWins(a: string, b: string, allMatches: QualificationMatchInput[]): number {
  return allMatches.filter(
    (m) =>
      m.winnerId === a &&
      ((m.playerOneId === a && m.playerTwoId === b) || (m.playerOneId === b && m.playerTwoId === a)),
  ).length;
}

/** Full comparison once both players' margins are fully known (no uncertainty). */
function compareCertain(
  aId: string,
  bId: string,
  margins: Map<string, MarginInfo>,
  allMatches: QualificationMatchInput[],
  tieBreakerOrder: TieBreakerType[],
): 'a' | 'b' | 'tie' {
  const a = margins.get(aId)!;
  const b = margins.get(bId)!;
  for (const tieBreaker of tieBreakerOrder) {
    if (tieBreaker === TieBreakerType.WIN_MARGIN) {
      if (a.winMargin !== b.winMargin) return a.winMargin > b.winMargin ? 'a' : 'b';
    } else if (tieBreaker === TieBreakerType.LOSE_MARGIN) {
      if (a.loseMargin !== b.loseMargin) return a.loseMargin > b.loseMargin ? 'a' : 'b';
    } else if (tieBreaker === TieBreakerType.HEAD_TO_HEAD) {
      const aSub = headToHeadSubWins(aId, bId, allMatches);
      const bSub = headToHeadSubWins(bId, aId, allMatches);
      if (aSub !== bSub) return aSub > bSub ? 'a' : 'b';
    }
    // TOTAL_WINS: wins is always the primary boundary criterion above; no-op here.
  }
  return 'tie';
}

/**
 * 'a' — a definitely outranks b, no matter how any unresolved margin
 * resolves. 'b' — same, the other way. 'uncertain' — depends on it.
 * 'tie' — both fixed and genuinely level.
 *
 * The uncertain short-circuit only applies when Win Margin leads the
 * tiebreak order (true for every rule set that uses this engine today) —
 * that's the only criterion a still-open hypothetical win can affect here.
 */
function compare(
  aId: string,
  bId: string,
  margins: Map<string, MarginInfo>,
  allMatches: QualificationMatchInput[],
  tieBreakerOrder: TieBreakerType[],
): 'a' | 'b' | 'uncertain' | 'tie' {
  const a = margins.get(aId)!;
  const b = margins.get(bId)!;

  if (tieBreakerOrder[0] === TieBreakerType.WIN_MARGIN && (a.uncertain || b.uncertain)) {
    if (a.uncertain && b.uncertain) return 'uncertain';
    if (a.uncertain) return a.winMargin > b.winMargin ? 'a' : 'uncertain';
    return b.winMargin > a.winMargin ? 'b' : 'uncertain';
  }

  return compareCertain(aId, bId, margins, allMatches, tieBreakerOrder);
}

/**
 * Classifies every player for one hypothetical final win-tally.
 * `allMatches` mixes real completed matches (known margins) with this
 * scenario's hypothetical results (winMargin/loseMargin: null).
 */
export function classifyPlayers(
  playerIds: string[],
  winsMap: Record<string, number>,
  allMatches: QualificationMatchInput[],
  qualificationSlots: number,
  tieBreakerOrder: TieBreakerType[],
): Record<string, ClassificationResult> {
  const arr = playerIds.map((id) => ({ id, wins: winsMap[id] ?? 0 })).sort((a, b) => b.wins - a.wins);
  const boundaryWins = arr[qualificationSlots - 1].wins;

  const result: Record<string, ClassificationResult> = {};
  arr.forEach(({ id, wins }) => {
    if (wins > boundaryWins) result[id] = { classification: 'qualified' };
    else if (wins < boundaryWins) {
      result[id] = {
        classification: 'eliminated',
        reason: `finishes on ${wins} win${wins === 1 ? '' : 's'}, below the top-${qualificationSlots} cutoff of ${boundaryWins}`,
      };
    }
  });

  const aboveCount = arr.filter((x) => x.wins > boundaryWins).length;
  const spotsLeft = qualificationSlots - aboveCount;
  const tiedGroup = arr.filter((x) => x.wins === boundaryWins).map((x) => x.id);

  if (tiedGroup.length <= spotsLeft) {
    tiedGroup.forEach((id) => {
      result[id] = { classification: 'qualified' };
    });
    return result;
  }

  const margins = computeTiedGroupMargins(tiedGroup, allMatches);

  tiedGroup.forEach((player) => {
    let definitelyAbove = 0;
    let uncertainCount = 0;
    let betterRival: string | null = null;

    tiedGroup.forEach((rival) => {
      if (rival === player) return;
      const cmp = compare(rival, player, margins, allMatches, tieBreakerOrder);
      if (cmp === 'a') {
        definitelyAbove++;
        if (!betterRival) betterRival = rival;
      } else if (cmp === 'uncertain') {
        uncertainCount++;
      }
    });

    if (definitelyAbove >= spotsLeft) {
      let reason = 'level on wins with rivals for the last spot, but behind on tiebreakers';
      if (betterRival) {
        const pm = margins.get(player)!;
        const bm = margins.get(betterRival)!;
        if (pm.winMargin !== bm.winMargin) reason = `tied on wins, but Win Margin ${pm.winMargin} trails a rival's ${bm.winMargin}`;
        else if (pm.loseMargin !== bm.loseMargin) reason = `tied on wins and Win Margin, but Lose Margin ${pm.loseMargin} trails a rival's ${bm.loseMargin}`;
        else reason = `tied on wins, Win Margin, and Lose Margin with a rival, but loses the head-to-head tiebreaker`;
      }
      result[player] = { classification: 'eliminated', reason };
    } else if (definitelyAbove + uncertainCount < spotsLeft) {
      result[player] = { classification: 'qualified' };
    } else {
      result[player] = { classification: 'contested' };
    }
  });

  return result;
}

export interface QualificationOutlookInput {
  playerIds: string[];
  /** This season's completed table-stage (League/Group) matches. */
  completedMatches: QualificationMatchInput[];
  /** This season's not-yet-played table-stage matches. */
  remainingMatches: RemainingMatchInput[];
  /** Completed matches across every season, for head-to-head weighting. */
  allTimeMatches: QualificationMatchInput[];
  qualificationSlots: number;
  tieBreakerOrder: TieBreakerType[];
}

export interface OpponentOutlook {
  opponentId: string;
  winProbability: number;
  headToHead: { wins: number; losses: number };
}

export interface ScenarioOutcome {
  opponentId: string;
  won: boolean;
}

/**
 * One specific combination of this player's own remaining results (not just
 * a win *count* — which exact opponents they beat/lose to). qualified/
 * contested/eliminated/totalCombos are a plain, unweighted count of how the
 * *other* remaining matches (the ones not involving this player) could go —
 * deliberately not head-to-head-probability-weighted like floorPct/ceilingPct
 * above, since this is answering "how many of the ways could this go", not
 * "how likely is it".
 */
export interface QualificationScenario {
  outcomes: ScenarioOutcome[];
  ownWins: number;
  qualifiedCount: number;
  contestedCount: number;
  eliminatedCount: number;
  totalCombos: number;
}

export interface PlayerQualificationOutlook {
  playerId: string;
  currentWins: number;
  played: number;
  remainingCount: number;
  /** Share of simulated outcomes where this player qualifies outright. */
  floorPct: number;
  /** floorPct + every outcome where they're tied for the last spot(s). */
  ceilingPct: number;
  /** Midpoint of floor/ceiling — the headline number. */
  midPct: number;
  /** Fewest of their own remaining wins that locks qualification regardless of other results; null if not guaranteed even winning out. */
  guaranteedMinWins: number | null;
  /** If equal to remainingCount, they're mathematically eliminated already. */
  certainElimMaxWins: number | null;
  reason: string;
  opponents: OpponentOutlook[];
  /** Every combination of this player's own remaining results, most wins first. */
  scenarios: QualificationScenario[];
}

export function computeQualificationOutlook(
  input: QualificationOutlookInput,
): Record<string, PlayerQualificationOutlook> {
  const { playerIds, completedMatches, remainingMatches, allTimeMatches, qualificationSlots, tieBreakerOrder } = input;

  const currentWins: Record<string, number> = {};
  const played: Record<string, number> = {};
  playerIds.forEach((id) => {
    currentWins[id] = 0;
    played[id] = 0;
  });
  completedMatches.forEach((m) => {
    currentWins[m.winnerId] = (currentWins[m.winnerId] ?? 0) + 1;
    played[m.playerOneId] = (played[m.playerOneId] ?? 0) + 1;
    played[m.playerTwoId] = (played[m.playerTwoId] ?? 0) + 1;
  });

  const matchInfo = remainingMatches.map((m) => headToHeadWinProbability(m.playerOneId, m.playerTwoId, allTimeMatches));

  const ownSlots: Record<string, { idx: number; isP1: boolean }[]> = {};
  playerIds.forEach((id) => {
    ownSlots[id] = [];
    remainingMatches.forEach((m, idx) => {
      if (m.playerOneId === id) ownSlots[id].push({ idx, isP1: true });
      else if (m.playerTwoId === id) ownSlots[id].push({ idx, isP1: false });
    });
  });

  type Bucket = { total: number; qualified: number; contested: number; eliminated: number };
  const breakdown: Record<string, Record<number, Bucket>> = {};
  playerIds.forEach((id) => {
    breakdown[id] = {};
    for (let w = 0; w <= ownSlots[id].length; w++) {
      breakdown[id][w] = { total: 0, qualified: 0, contested: 0, eliminated: 0 };
    }
  });

  // Unweighted per-scenario tally, keyed by which *specific* own matches
  // were won (a bitmask over ownSlots[id], not just a win count) — this is
  // what the detailed scenario breakdown groups by, distinct from the
  // probability-weighted `breakdown` above.
  type ScenarioBucket = { total: number; qualified: number; contested: number; eliminated: number };
  const scenarioCounts: Record<string, Record<number, ScenarioBucket>> = {};
  playerIds.forEach((id) => {
    scenarioCounts[id] = {};
    const combos = 1 << ownSlots[id].length;
    for (let s = 0; s < combos; s++) {
      scenarioCounts[id][s] = { total: 0, qualified: 0, contested: 0, eliminated: 0 };
    }
  });

  const r = remainingMatches.length;
  const totalCombos = 1 << r;

  for (let mask = 0; mask < totalCombos; mask++) {
    const winsCombo: Record<string, number> = { ...currentWins };
    const maskMatches: QualificationMatchInput[] = [];
    let weight = 1;

    for (let i = 0; i < r; i++) {
      const m = remainingMatches[i];
      const bit = (mask >> i) & 1;
      const winnerId = bit ? m.playerOneId : m.playerTwoId;
      winsCombo[winnerId] = (winsCombo[winnerId] ?? 0) + 1;
      maskMatches.push({
        playerOneId: m.playerOneId,
        playerTwoId: m.playerTwoId,
        winnerId,
        winMargin: null,
        loseMargin: null,
      });
      weight *= bit ? matchInfo[i].probability : 1 - matchInfo[i].probability;
    }

    if (weight <= 0) continue;

    const allMatchesForMask = completedMatches.concat(maskMatches);
    const classification = classifyPlayers(playerIds, winsCombo, allMatchesForMask, qualificationSlots, tieBreakerOrder);

    playerIds.forEach((id) => {
      let ownWins = 0;
      let ownSubMask = 0;
      ownSlots[id].forEach(({ idx, isP1 }, slotIdx) => {
        const bit = (mask >> idx) & 1;
        const isWinner = isP1 ? bit === 1 : bit === 0;
        if (isWinner) {
          ownWins++;
          ownSubMask |= 1 << slotIdx;
        }
      });
      const bucket = breakdown[id][ownWins];
      bucket.total += weight;
      bucket[classification[id].classification] += weight;

      const scenarioBucket = scenarioCounts[id][ownSubMask];
      scenarioBucket.total += 1;
      scenarioBucket[classification[id].classification] += 1;
    });
  }

  const EPS = 1e-9;
  const result: Record<string, PlayerQualificationOutlook> = {};

  playerIds.forEach((id) => {
    let qualifiedWeight = 0;
    let contestedWeight = 0;
    let totalWeight = 0;
    let guaranteedMinWins: number | null = null;
    let certainElimMaxWins: number | null = null;

    const n = ownSlots[id].length;
    for (let w = 0; w <= n; w++) {
      const b = breakdown[id][w];
      qualifiedWeight += b.qualified;
      contestedWeight += b.contested;
      totalWeight += b.total;
      if (b.total > EPS) {
        if (guaranteedMinWins === null && Math.abs(b.qualified - b.total) < EPS) guaranteedMinWins = w;
        if (Math.abs(b.eliminated - b.total) < EPS) certainElimMaxWins = w;
      }
    }

    const floorPct = totalWeight > 0 ? Math.round((qualifiedWeight / totalWeight) * 100) : 0;
    const ceilingPct = totalWeight > 0 ? Math.round(((qualifiedWeight + contestedWeight) / totalWeight) * 100) : 0;
    const midPct = totalWeight > 0 ? Math.round(((qualifiedWeight + contestedWeight * 0.5) / totalWeight) * 100) : 0;

    let reason: string;
    if (guaranteedMinWins === 0) {
      reason = 'Already qualified — even losing every remaining match, the spot cannot be lost.';
    } else if (certainElimMaxWins === n) {
      reason = 'Already eliminated — even winning every remaining match is not enough.';
    } else if (guaranteedMinWins !== null) {
      reason = `Needs at least ${guaranteedMinWins} more win${guaranteedMinWins === 1 ? '' : 's'} from the ${n} remaining match${n === 1 ? '' : 'es'} to guarantee qualification; anything less depends on other results.`;
    } else {
      reason = 'Not guaranteed even by winning out — depends on how the other remaining matches go.';
    }

    const opponents: OpponentOutlook[] = ownSlots[id].map(({ idx, isP1 }) => {
      const m = remainingMatches[idx];
      const info = matchInfo[idx];
      const winProbability = Math.round((isP1 ? info.probability : 1 - info.probability) * 100);
      const opponentId = isP1 ? m.playerTwoId : m.playerOneId;
      const wins = isP1 ? info.aWins : info.bWins;
      const losses = isP1 ? info.bWins : info.aWins;
      return { opponentId, winProbability, headToHead: { wins, losses } };
    });

    const scenarios: QualificationScenario[] = [];
    const combos = 1 << n;
    for (let subMask = 0; subMask < combos; subMask++) {
      const bucket = scenarioCounts[id][subMask];
      const outcomes: ScenarioOutcome[] = ownSlots[id].map(({ idx, isP1 }, slotIdx) => {
        const m = remainingMatches[idx];
        const opponentId = isP1 ? m.playerTwoId : m.playerOneId;
        const won = ((subMask >> slotIdx) & 1) === 1;
        return { opponentId, won };
      });
      scenarios.push({
        outcomes,
        ownWins: outcomes.filter((o) => o.won).length,
        qualifiedCount: bucket.qualified,
        contestedCount: bucket.contested,
        eliminatedCount: bucket.eliminated,
        totalCombos: bucket.total,
      });
    }
    scenarios.sort((a, b) => b.ownWins - a.ownWins);

    result[id] = {
      playerId: id,
      currentWins: currentWins[id] ?? 0,
      played: played[id] ?? 0,
      remainingCount: n,
      floorPct,
      ceilingPct,
      midPct,
      guaranteedMinWins,
      certainElimMaxWins,
      reason,
      opponents,
      scenarios,
    };
  });

  return result;
}

export interface ScheduledMatchInput {
  matchNumber: number;
  playerOneId: string;
  playerTwoId: string;
}

/**
 * The first `matchNumber` (in schedule order, not completion order) at
 * which every player has appeared in at least 2 matches — the same
 * "everyoneHasPlayedTwice" reveal threshold the qualification outlook uses,
 * exposed as a specific number so a not-yet-open panel can say when it
 * opens instead of just disappearing. Precomputable from the fixed
 * round-robin schedule alone, no results needed. Null if the full schedule
 * never reaches it (too few matches for the player count).
 */
export function findQualificationRevealMatchNumber(
  scheduleMatches: ScheduledMatchInput[],
  playerIds: string[],
): number | null {
  const played = new Map<string, number>(playerIds.map((id) => [id, 0]));
  const ordered = scheduleMatches.slice().sort((a, b) => a.matchNumber - b.matchNumber);

  for (const m of ordered) {
    played.set(m.playerOneId, (played.get(m.playerOneId) ?? 0) + 1);
    played.set(m.playerTwoId, (played.get(m.playerTwoId) ?? 0) + 1);
    if (playerIds.every((id) => (played.get(id) ?? 0) >= 2)) return m.matchNumber;
  }
  return null;
}
