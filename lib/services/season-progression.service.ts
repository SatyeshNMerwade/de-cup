import { eq, sql } from 'drizzle-orm';

import { db } from '@/lib/db';
import { awards, matches, seasons } from '@/database/schema';
import {
  determineIplOutcome,
  determineNextIplMatches,
  type IplSeeds,
  type PlayoffMatchResult,
} from '@/lib/engine/playoffs';
import { computeStandings, isBoundaryUnresolved, type StandingsMatchInput } from '@/lib/engine/standings';
import { formatStageLabel } from '@/lib/helpers/format.helper';
import { AwardSource } from '@/types/domain/award';
import { AwardCategory, MatchStage, MatchStatus, PlayoffFormat, TournamentState } from '@/types/domain/tournament';

import { listMatchesBySeason } from './matches.service';
import { listRegistrationsBySeason } from './registrations.service';
import { getSeasonById } from './seasons.service';

/** Postgres unique_violation — see lib/actions/awards.actions.ts for the same check on the write path. */
function isUniqueViolation(err: unknown): boolean {
  return typeof err === 'object' && err !== null && 'code' in err && (err as { code?: string }).code === '23505';
}

async function insertPlayoffMatches(
  seasonId: string,
  newMatches: { stage: MatchStage; playerOneId: string; playerTwoId: string }[],
): Promise<void> {
  await db.transaction(async (tx) => {
    const [{ maxNumber }] = await tx
      .select({ maxNumber: sql<number>`coalesce(max(${matches.matchNumber}), 0)` })
      .from(matches)
      .where(eq(matches.seasonId, seasonId));

    await tx.insert(matches).values(
      newMatches.map((m, index) => ({
        seasonId,
        matchNumber: maxNumber + index + 1,
        stage: m.stage,
        playerOneId: m.playerOneId,
        playerTwoId: m.playerTwoId,
        status: MatchStatus.SCHEDULED,
      })),
    );
  });
}

async function finalizeSeason(
  seasonId: string,
  outcome: { championId: string; runnerUpId: string; thirdPlaceId: string },
): Promise<void> {
  try {
    await db.insert(awards).values([
      {
        seasonId,
        playerId: outcome.championId,
        name: 'Champion',
        category: AwardCategory.AUTOMATIC,
        source: AwardSource.SYSTEM,
      },
      {
        seasonId,
        playerId: outcome.runnerUpId,
        name: 'Runner-Up',
        category: AwardCategory.AUTOMATIC,
        source: AwardSource.SYSTEM,
      },
      {
        seasonId,
        playerId: outcome.thirdPlaceId,
        name: 'Third Place',
        category: AwardCategory.AUTOMATIC,
        source: AwardSource.SYSTEM,
      },
    ]);
  } catch (err) {
    if (!isUniqueViolation(err)) throw err;
  }

  await db.update(seasons).set({ state: TournamentState.COMPLETED }).where(eq(seasons.id, seasonId));
}

export interface ProgressionResult {
  message?: string;
}

/**
 * Call after any match in a season is recorded. Cheap no-op checks when
 * nothing's ready yet; scoped to IPL playoff format (every season since
 * Season 1 has used it — KNOCKOUT stays manual). In order: waits for the
 * League to fully complete, refuses to start playoffs while the
 * qualification cutoff is a genuine tie (surfacing who's tied so the admin
 * can record a decider — just another League match between them), creates
 * Qualifier 1 + Eliminator, then Qualifier 2, then the Final as each
 * feeder match completes, and finally the Champion/Runner-Up/Third-Place
 * awards plus marking the season COMPLETED once the Final is done.
 */
export async function advanceSeasonProgression(seasonId: string): Promise<ProgressionResult> {
  const season = await getSeasonById(seasonId);
  if (!season || season.playoffFormat !== PlayoffFormat.IPL) return {};

  const [registrations, seasonMatches] = await Promise.all([
    listRegistrationsBySeason(seasonId),
    listMatchesBySeason(seasonId),
  ]);
  const displayName = (playerId: string) =>
    registrations.find((r) => r.playerId === playerId)?.player.displayName ?? playerId;

  const leagueMatches = seasonMatches.filter((m) => m.stage === MatchStage.LEAGUE);
  const leagueComplete = leagueMatches.length > 0 && leagueMatches.every((m) => m.status === MatchStatus.COMPLETED);
  if (!leagueComplete) return {};

  const tieBreakerOrder = season.ruleSet.rules.tieBreakers.order;
  const qualificationSlots = season.ruleSet.rules.qualification.qualificationSlots;
  const playerIds = registrations.map((r) => r.playerId);
  if (playerIds.length < qualificationSlots) return {};

  const leagueInputs: StandingsMatchInput[] = leagueMatches
    .filter((m) => m.winnerId)
    .map((m) => ({
      playerOneId: m.playerOneId,
      playerTwoId: m.playerTwoId,
      winnerId: m.winnerId as string,
      winMargin: m.winMargin,
      loseMargin: m.loseMargin,
    }));
  const standings = computeStandings(playerIds, leagueInputs, tieBreakerOrder);

  const playoffMatches = seasonMatches.filter((m) => m.stage !== MatchStage.LEAGUE && m.stage !== MatchStage.GROUP);

  if (
    playoffMatches.length === 0 &&
    isBoundaryUnresolved(standings, qualificationSlots - 1, leagueInputs, tieBreakerOrder)
  ) {
    const a = standings[qualificationSlots - 1];
    const b = standings[qualificationSlots];
    return {
      message: `${displayName(a.playerId)} and ${displayName(b.playerId)} are tied for the last qualification spot — record a decider (League match) between them before playoffs can start.`,
    };
  }

  const seeds: IplSeeds = {
    seed1: standings[0].playerId,
    seed2: standings[1].playerId,
    seed3: standings[2].playerId,
    seed4: standings[3].playerId,
  };
  const existing: PlayoffMatchResult[] = playoffMatches.map((m) => ({
    stage: m.stage as MatchStage,
    playerOneId: m.playerOneId,
    playerTwoId: m.playerTwoId,
    winnerId: m.winnerId,
  }));

  const nextMatches = determineNextIplMatches(seeds, existing);
  if (nextMatches.length > 0) {
    await insertPlayoffMatches(seasonId, nextMatches);
    const label = playoffMatches.length === 0 ? 'Playoffs started' : 'Next match created';
    const description = nextMatches
      .map((m) => `${displayName(m.playerOneId)} vs ${displayName(m.playerTwoId)} (${formatStageLabel(m.stage)})`)
      .join(', ');
    return { message: `${label}: ${description}.` };
  }

  if (season.state === TournamentState.COMPLETED) return {};

  const outcome = determineIplOutcome(existing);
  if (!outcome) return {};

  await finalizeSeason(seasonId, outcome);
  return {
    message: `Season complete — Champion: ${displayName(outcome.championId)}, Runner-up: ${displayName(outcome.runnerUpId)}, Third place: ${displayName(outcome.thirdPlaceId)}.`,
  };
}
