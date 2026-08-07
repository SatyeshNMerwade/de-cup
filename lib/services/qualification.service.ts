import {
  computeQualificationOutlook,
  type PlayerQualificationOutlook,
  type QualificationMatchInput,
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

/**
 * Qualification outlook for a League-format season's remaining table-stage
 * matches. Returns null when there's nothing to show: Group-format seasons
 * (index.html never built this for Season 1's simpler 3-player groups), the
 * league is already over, or not every player has played at least 2
 * matches yet (the same reveal threshold index.html used for Season 2,
 * generalized instead of three different hardcoded per-season numbers).
 */
export async function getQualificationOutlook(seasonId: string): Promise<QualificationOutlookView[] | null> {
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

  if (remaining.length === 0) return null;

  const playedCount = new Map<string, number>();
  completed.forEach((m) => {
    playedCount.set(m.playerOneId, (playedCount.get(m.playerOneId) ?? 0) + 1);
    playedCount.set(m.playerTwoId, (playedCount.get(m.playerTwoId) ?? 0) + 1);
  });
  const everyoneHasPlayedTwice = playerIds.every((id) => (playedCount.get(id) ?? 0) >= 2);
  if (!everyoneHasPlayedTwice) return null;

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

  const qualificationSlots = season.ruleSet.rules.qualification.qualificationSlots;
  const tieBreakerOrder = season.ruleSet.rules.tieBreakers.order;

  const outlook = computeQualificationOutlook({
    playerIds,
    completedMatches,
    remainingMatches,
    allTimeMatches,
    qualificationSlots,
    tieBreakerOrder,
  });

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
