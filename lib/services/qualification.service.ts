import {
  computeQualificationOutlook,
  findQualificationRevealMatchNumber,
  type PlayerQualificationOutlook,
  type QualificationMatchInput,
  type QualificationScenario,
} from '@/lib/engine/qualification';
import { computeStandings, describeBoundaryMarginGap } from '@/lib/engine/standings';
import { MatchStage, MatchStatus, TournamentFormat } from '@/types/domain/tournament';

import { listAllCompletedMatches, listMatchesBySeason } from './matches.service';
import { listRegistrationsBySeason } from './registrations.service';
import { getSeasonById } from './seasons.service';

export interface RivalThresholdView {
  rivalId: string;
  rivalName: string;
  criterion: 'WIN_MARGIN' | 'LOSE_MARGIN';
  aheadValue: number;
  behindValue: number;
  threshold: number;
  isAhead: boolean;
}

export interface QualificationOutlookView extends PlayerQualificationOutlook {
  displayName: string;
  opponents: (PlayerQualificationOutlook['opponents'][number] & { opponentName: string })[];
  /** Only set for the two players currently tied on wins at the qualification cutoff. */
  rivalThreshold?: RivalThresholdView;
}

interface QualificationInputs {
  playerIds: string[];
  nameById: Map<string, string>;
  qualificationSlots: number;
  tieBreakerOrder: ReturnType<typeof getTieBreakerOrder>;
  tableMatches: Awaited<ReturnType<typeof listMatchesBySeason>>;
  completed: Awaited<ReturnType<typeof listMatchesBySeason>>;
  remaining: Awaited<ReturnType<typeof listMatchesBySeason>>;
  completedMatches: QualificationMatchInput[];
  remainingMatches: { playerOneId: string; playerTwoId: string }[];
  allTimeMatches: QualificationMatchInput[];
}

function getTieBreakerOrder(season: NonNullable<Awaited<ReturnType<typeof getSeasonById>>>) {
  return season.ruleSet.rules.tieBreakers.order;
}

/**
 * Shared fetch + shape used by both the percentage panel and the scenario
 * breakdown — season lookup, registrations, the League-stage match split,
 * and the plain-object shapes the pure engine functions take. Returns null
 * when there's nothing to compute at all: not a League-format season.
 */
async function loadQualificationInputs(seasonId: string): Promise<QualificationInputs | null> {
  const season = await getSeasonById(seasonId);
  if (!season || season.tournamentFormat !== TournamentFormat.LEAGUE) return null;

  const [registrations, seasonMatches, allTimeCompleted] = await Promise.all([
    listRegistrationsBySeason(seasonId),
    listMatchesBySeason(seasonId),
    listAllCompletedMatches(),
  ]);

  const playerIds = registrations.map((r) => r.playerId);
  const nameById = new Map(registrations.map((r) => [r.playerId, r.player.displayName]));

  const tableMatches = seasonMatches.filter((m) => m.stage === MatchStage.LEAGUE);
  const completed = tableMatches.filter((m) => m.status === MatchStatus.COMPLETED && m.winnerId);
  const remaining = tableMatches.filter((m) => m.status !== MatchStatus.COMPLETED);

  const completedMatches: QualificationMatchInput[] = completed.map((m) => ({
    playerOneId: m.playerOneId,
    playerTwoId: m.playerTwoId,
    winnerId: m.winnerId as string,
    winMargin: m.winMargin,
    loseMargin: m.loseMargin,
  }));
  const remainingMatches = remaining.map((m) => ({ playerOneId: m.playerOneId, playerTwoId: m.playerTwoId }));

  const allTimeMatches: QualificationMatchInput[] = allTimeCompleted
    .filter((m) => m.winnerId)
    .map((m) => ({
      playerOneId: m.playerOneId,
      playerTwoId: m.playerTwoId,
      winnerId: m.winnerId as string,
      winMargin: null,
      loseMargin: null,
    }));

  return {
    playerIds,
    nameById,
    qualificationSlots: season.ruleSet.rules.qualification.qualificationSlots,
    tieBreakerOrder: getTieBreakerOrder(season),
    tableMatches,
    completed,
    remaining,
    completedMatches,
    remainingMatches,
    allTimeMatches,
  };
}

function buildOutlookViews(
  inputs: QualificationInputs,
  outlook: Record<string, PlayerQualificationOutlook>,
): QualificationOutlookView[] {
  const { playerIds, nameById, qualificationSlots, tieBreakerOrder, completedMatches } = inputs;

  const standings = computeStandings(playerIds, completedMatches, tieBreakerOrder);
  const boundaryGap = describeBoundaryMarginGap(standings, qualificationSlots - 1, completedMatches, tieBreakerOrder);

  return playerIds.map((id) => {
    const entry = outlook[id];

    let rivalThreshold: RivalThresholdView | undefined;
    if (boundaryGap && (id === boundaryGap.aheadPlayerId || id === boundaryGap.behindPlayerId)) {
      const isAhead = id === boundaryGap.aheadPlayerId;
      const rivalId = isAhead ? boundaryGap.behindPlayerId : boundaryGap.aheadPlayerId;
      rivalThreshold = {
        rivalId,
        rivalName: nameById.get(rivalId) ?? rivalId,
        criterion: boundaryGap.criterion,
        aheadValue: boundaryGap.aheadValue,
        behindValue: boundaryGap.behindValue,
        threshold: boundaryGap.threshold,
        isAhead,
      };
    }

    return {
      ...entry,
      displayName: nameById.get(id) ?? id,
      opponents: entry.opponents.map((o) => ({ ...o, opponentName: nameById.get(o.opponentId) ?? o.opponentId })),
      rivalThreshold,
    };
  });
}

/**
 * Qualification outlook for a League-format season's remaining table-stage
 * matches. Returns null when there's nothing to show: Group-format seasons
 * (index.html never built this for Season 1's simpler 3-player groups), the
 * league is already over, or not every player has played at least 2
 * matches yet (the same reveal threshold index.html used for Season 2,
 * generalized instead of three different hardcoded per-season numbers).
 *
 * Also feeds the League table's Q/E badges (lib/services/standings.service.ts)
 * — that dependency is why this function's existing behavior/signature is
 * left untouched here; see getQualificationDisplay for the newer two-section
 * (percentage + scenario) view with its own, more permissive reveal rules.
 */
export async function getQualificationOutlook(seasonId: string): Promise<QualificationOutlookView[] | null> {
  const inputs = await loadQualificationInputs(seasonId);
  if (!inputs) return null;
  if (inputs.remaining.length === 0) return null;

  const playedCount = new Map<string, number>();
  inputs.completed.forEach((m) => {
    playedCount.set(m.playerOneId, (playedCount.get(m.playerOneId) ?? 0) + 1);
    playedCount.set(m.playerTwoId, (playedCount.get(m.playerTwoId) ?? 0) + 1);
  });
  const everyoneHasPlayedTwice = inputs.playerIds.every((id) => (playedCount.get(id) ?? 0) >= 2);
  if (!everyoneHasPlayedTwice) return null;

  const outlook = computeQualificationOutlook({
    playerIds: inputs.playerIds,
    completedMatches: inputs.completedMatches,
    remainingMatches: inputs.remainingMatches,
    allTimeMatches: inputs.allTimeMatches,
    qualificationSlots: inputs.qualificationSlots,
    tieBreakerOrder: inputs.tieBreakerOrder,
  });

  return buildOutlookViews(inputs, outlook);
}

export type QualificationPercentageDisplay =
  | { available: true; outlook: QualificationOutlookView[] }
  | { available: false; reason: 'not-applicable' }
  | { available: false; reason: 'locked'; opensAtMatchNumber: number | null };

export interface ScenarioOutcomeView {
  opponentName: string;
  won: boolean;
}

export interface QualificationScenarioView extends Omit<QualificationScenario, 'outcomes'> {
  outcomes: ScenarioOutcomeView[];
}

export interface QualificationScenarioPlayerView {
  playerId: string;
  displayName: string;
  currentRank: number;
  currentWins: number;
  played: number;
  remainingCount: number;
  floorPct: number;
  ceilingPct: number;
  midPct: number;
  reason: string;
  opponents: (PlayerQualificationOutlook['opponents'][number] & { opponentName: string })[];
  rivalThreshold?: RivalThresholdView;
  scenarios: QualificationScenarioView[];
}

export type QualificationScenarioDisplay =
  | { available: true; players: QualificationScenarioPlayerView[] }
  | { available: false; reason: 'not-applicable' }
  | { available: false; reason: 'locked'; opensAtMatchNumber: number | null };

export interface QualificationDisplayView {
  percentage: QualificationPercentageDisplay;
  scenario: QualificationScenarioDisplay;
}

/**
 * Scenario's real reveal gate: every player must have 2 or fewer of their
 * own matches left. With 4+ remaining, a player's own-scenario breakdown
 * has 2^4=16+ rows to reason about — genuinely confusing, and mostly
 * academic detail this early. At <=2 remaining there are at most 4 own
 * scenarios, which is the point the panel becomes a readable "here's
 * exactly what has to happen" instead of a probability dump.
 */
const SCENARIO_MAX_REMAINING_PER_PLAYER = 2;

/**
 * computeQualificationOutlook enumerates every 2^remaining combination of
 * results across the whole season — necessarily expensive once remaining is
 * large (measured ~11s at remaining=20 in dev). SCENARIO_MAX_REMAINING_PER_PLAYER
 * already keeps this low for realistic league sizes (every player at <=2
 * remaining bounds the season-wide total to roughly the player count), but
 * this stays as a hard safety net for unusually large fields.
 */
const SCENARIO_MAX_REMAINING = 16;

/**
 * The two newer qualification sections (Percentage + Scenario) — each with
 * its own, more permissive reveal condition than getQualificationOutlook's
 * "everyone has played twice" gate, so both can independently report
 * *when* they'll open instead of just staying hidden.
 */
export async function getQualificationDisplay(seasonId: string): Promise<QualificationDisplayView> {
  const notApplicable = {
    percentage: { available: false, reason: 'not-applicable' },
    scenario: { available: false, reason: 'not-applicable' },
  } as const;

  const inputs = await loadQualificationInputs(seasonId);
  if (!inputs || inputs.remaining.length === 0) return notApplicable;

  const playedCount = new Map<string, number>();
  inputs.completed.forEach((m) => {
    playedCount.set(m.playerOneId, (playedCount.get(m.playerOneId) ?? 0) + 1);
    playedCount.set(m.playerTwoId, (playedCount.get(m.playerTwoId) ?? 0) + 1);
  });
  const everyoneHasPlayedTwice = inputs.playerIds.every((id) => (playedCount.get(id) ?? 0) >= 2);

  const remainingCountByPlayer = new Map<string, number>();
  inputs.remaining.forEach((m) => {
    remainingCountByPlayer.set(m.playerOneId, (remainingCountByPlayer.get(m.playerOneId) ?? 0) + 1);
    remainingCountByPlayer.set(m.playerTwoId, (remainingCountByPlayer.get(m.playerTwoId) ?? 0) + 1);
  });
  const everyonePlayerHasFewRemaining = inputs.playerIds.every(
    (id) => (remainingCountByPlayer.get(id) ?? 0) <= SCENARIO_MAX_REMAINING_PER_PLAYER,
  );
  // Scenario needs Percentage's own bar met too (it reuses Percentage's
  // outlook computation), plus the enumeration's hard safety cap for
  // unusually large fields — see SCENARIO_MAX_REMAINING above.
  const scenarioReady =
    everyoneHasPlayedTwice && everyonePlayerHasFewRemaining && inputs.remaining.length <= SCENARIO_MAX_REMAINING;

  const everyoneTwiceMatchNumber = findQualificationRevealMatchNumber(inputs.tableMatches, inputs.playerIds);
  const perfCapMatchNumber = Math.max(1, inputs.tableMatches.length - SCENARIO_MAX_REMAINING);
  const scenarioOpensAtMatchNumber =
    everyoneTwiceMatchNumber == null ? null : Math.max(everyoneTwiceMatchNumber, perfCapMatchNumber);

  const lockedPercentage = (): QualificationPercentageDisplay => ({
    available: false,
    reason: 'locked',
    opensAtMatchNumber: everyoneTwiceMatchNumber,
  });
  const lockedScenario = (): QualificationScenarioDisplay => ({
    available: false,
    reason: 'locked',
    opensAtMatchNumber: scenarioOpensAtMatchNumber,
  });

  // scenarioReady now implies everyoneHasPlayedTwice, so this single check
  // covers both — skip the expensive enumeration entirely until Percentage's
  // own bar is met, same perf-conscious intent as before.
  if (!everyoneHasPlayedTwice) {
    return { percentage: lockedPercentage(), scenario: lockedScenario() };
  }

  const outlook = computeQualificationOutlook({
    playerIds: inputs.playerIds,
    completedMatches: inputs.completedMatches,
    remainingMatches: inputs.remainingMatches,
    allTimeMatches: inputs.allTimeMatches,
    qualificationSlots: inputs.qualificationSlots,
    tieBreakerOrder: inputs.tieBreakerOrder,
  });
  const outlookViews = buildOutlookViews(inputs, outlook);
  const outlookById = new Map(outlookViews.map((v) => [v.playerId, v]));

  const percentage: QualificationPercentageDisplay = { available: true, outlook: outlookViews };

  const scenario: QualificationScenarioDisplay = scenarioReady
    ? { available: true, players: buildScenarioPlayerViews(inputs, outlookById) }
    : lockedScenario();

  return { percentage, scenario };
}

function buildScenarioPlayerViews(
  inputs: QualificationInputs,
  outlookById: Map<string, QualificationOutlookView>,
): QualificationScenarioPlayerView[] {
  const { playerIds, nameById, completedMatches, tieBreakerOrder } = inputs;
  const standings = computeStandings(playerIds, completedMatches, tieBreakerOrder);
  const rankById = new Map(standings.map((s, i) => [s.playerId, i + 1]));

  return playerIds.map((id) => {
    const entry = outlookById.get(id);
    if (!entry) {
      throw new Error(`Qualification outlook missing for player ${id}`);
    }

    return {
      playerId: id,
      displayName: nameById.get(id) ?? id,
      currentRank: rankById.get(id) ?? playerIds.length,
      currentWins: entry.currentWins,
      played: entry.played,
      remainingCount: entry.remainingCount,
      floorPct: entry.floorPct,
      ceilingPct: entry.ceilingPct,
      midPct: entry.midPct,
      reason: entry.reason,
      opponents: entry.opponents,
      rivalThreshold: entry.rivalThreshold,
      scenarios: entry.scenarios.map((s) => ({
        ...s,
        outcomes: s.outcomes.map((o) => ({ opponentName: nameById.get(o.opponentId) ?? o.opponentId, won: o.won })),
      })),
    };
  });
}
