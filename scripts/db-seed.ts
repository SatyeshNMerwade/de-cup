/**
 * Seeds Neon with the full historical record from index.html: all 4
 * seasons' players, rule sets, groups, registrations, matches, and awards.
 *
 * Playoff pairings for Seasons 1-3 are derived from the standings engine
 * (lib/engine/standings.ts) rather than hand-typed, exactly like
 * index.html computes them at render time — this run also prints each
 * season's computed standings so they can be checked against the site.
 *
 * Usage:
 *   npx tsx scripts/db-seed.ts            seed (fails if data already exists)
 *   npx tsx scripts/db-seed.ts --reset     truncate the tournament tables first, then seed
 */

import { config } from 'dotenv';
config({ path: '.env.local' });

import postgres from 'postgres';
import { drizzle } from 'drizzle-orm/postgres-js';
import { sql } from 'drizzle-orm';

import { players } from '../database/schema/tables/player.table';
import { ruleSets } from '../database/schema/tables/rule-set.table';
import { seasons } from '../database/schema/tables/season.table';
import { groups } from '../database/schema/tables/group.table';
import { seasonRegistrations } from '../database/schema/tables/season-registration.table';
import { matches } from '../database/schema/tables/match.table';
import { awards } from '../database/schema/tables/award.table';

import { PLAYERS_DATA } from '../database/seed/players.data';
import { RULE_SETS_DATA } from '../database/seed/rule-sets.data';
import {
  SEASON1_GROUPS,
  SEASON1_GROUP_MATCHES,
  SEASON1_KNOCKOUT_MATCHES,
  SEASON1_AWARDS,
} from '../database/seed/season1.data';
import {
  SEASON2_PLAYERS,
  SEASON2_LEAGUE_MATCHES,
  SEASON2_PLAYOFF_RESULTS,
  SEASON2_AWARDS,
} from '../database/seed/season2.data';
import {
  SEASON3_PLAYERS,
  SEASON3_LEAGUE_MATCHES,
  SEASON3_PLAYOFF_RESULTS,
  SEASON3_AWARDS,
} from '../database/seed/season3.data';
import { SEASON4_PLAYERS, SEASON4_SCHEDULED_MATCHES } from '../database/seed/season4.data';
import type { SeedAward, SeedLeagueMatch, SeedPlayoffResult } from '../database/seed/types';

import { computeStandings, type StandingsMatchInput } from '../lib/engine/standings';
import { TieBreakerType } from '../types/domain/rule';
import { RegistrationStatus } from '../types/domain/season';
import {
  MatchResultType,
  MatchStage,
  MatchStatus,
  PlayoffFormat,
  TournamentFormat,
  TournamentState,
} from '../types/domain/tournament';

function toStandingsInputs(leagueMatches: SeedLeagueMatch[]): StandingsMatchInput[] {
  return leagueMatches.map((m) => ({
    playerOneId: m.playerOne,
    playerTwoId: m.playerTwo,
    winnerId: m.winner,
    winMargin: m.winMargin,
    loseMargin: m.loseMargin,
  }));
}

interface IplSeeds {
  seed1: string;
  seed2: string;
  seed3: string;
  seed4: string;
}

interface IplPlayoffRow {
  matchNumber: number;
  stage: MatchStage;
  playerOne: string;
  playerTwo: string;
  result: SeedPlayoffResult;
}

/** Builds the 4 IPL-format playoff matches from computed seeds + known results, mirroring index.html's computePlayoffOutcomes(). */
function buildIplPlayoffRows(seeds: IplSeeds, results: SeedPlayoffResult[], startMatchNumber: number) {
  const q1Result = results.find((r) => r.stage === MatchStage.QUALIFIER_1);
  const elResult = results.find((r) => r.stage === MatchStage.ELIMINATOR);
  const q2Result = results.find((r) => r.stage === MatchStage.QUALIFIER_2);
  const finalResult = results.find((r) => r.stage === MatchStage.FINAL);

  if (!q1Result || !elResult || !q2Result || !finalResult) {
    throw new Error('Playoff results must include all 4 stages: QUALIFIER_1, ELIMINATOR, QUALIFIER_2, FINAL.');
  }

  const { seed1, seed2, seed3, seed4 } = seeds;

  const q1Loser = q1Result.winner === seed1 ? seed2 : seed1;
  const elLoser = elResult.winner === seed3 ? seed4 : seed3;
  const q2Loser = q2Result.winner === q1Loser ? elResult.winner : q1Loser;
  const finalLoser = finalResult.winner === q1Result.winner ? q2Result.winner : q1Result.winner;

  const rows: IplPlayoffRow[] = [
    { matchNumber: startMatchNumber, stage: MatchStage.QUALIFIER_1, playerOne: seed1, playerTwo: seed2, result: q1Result },
    { matchNumber: startMatchNumber + 1, stage: MatchStage.ELIMINATOR, playerOne: seed3, playerTwo: seed4, result: elResult },
    { matchNumber: startMatchNumber + 2, stage: MatchStage.QUALIFIER_2, playerOne: q1Loser, playerTwo: elResult.winner, result: q2Result },
    { matchNumber: startMatchNumber + 3, stage: MatchStage.FINAL, playerOne: q1Result.winner, playerTwo: q2Result.winner, result: finalResult },
  ];

  return {
    rows,
    champion: finalResult.winner,
    runnerUp: finalLoser,
    thirdPlace: q2Loser,
    eliminatorLoser: elLoser,
  };
}

function assertMatches(label: string, expected: string, actual: string) {
  if (expected !== actual) {
    throw new Error(`Standings-engine mismatch for ${label}: expected ${expected}, computed ${actual}`);
  }
  console.log(`  ✓ ${label}: ${actual}`);
}

async function main() {
  const reset = process.argv.includes('--reset');
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error('DATABASE_URL is not configured (expected in .env.local).');

  const client = postgres(url, { prepare: false, max: 1 });
  const db = drizzle(client);

  try {
    if (reset) {
      console.log('--reset: truncating tournament tables...');
      await db.execute(
        sql`TRUNCATE TABLE awards, matches, season_registrations, groups, seasons, rule_sets, players RESTART IDENTITY CASCADE`,
      );
    }

    console.log('Seeding players...');
    const insertedPlayers = await db
      .insert(players)
      .values(PLAYERS_DATA.map((p) => ({ displayName: p.displayName })))
      .returning();
    const playerIdByName = new Map(insertedPlayers.map((p) => [p.displayName, p.id]));
    const pid = (name: string): string => {
      const id = playerIdByName.get(name);
      if (!id) throw new Error(`Unknown player in seed data: "${name}"`);
      return id;
    };

    console.log('Seeding rule sets...');
    const insertedRuleSets = await db
      .insert(ruleSets)
      .values(
        RULE_SETS_DATA.map((rs) => ({
          name: rs.name,
          description: rs.description,
          version: rs.version,
          tournamentFormat: rs.tournamentFormat,
          playoffFormat: rs.playoffFormat,
          rules: rs.rules,
        })),
      )
      .returning();
    const ruleSetIdByKey = new Map(RULE_SETS_DATA.map((rs, i) => [rs.key, insertedRuleSets[i].id]));
    const ruleSetId = (key: string): string => {
      const id = ruleSetIdByKey.get(key as never);
      if (!id) throw new Error(`Unknown rule set key: "${key}"`);
      return id;
    };

    console.log('Seeding seasons...');
    const insertedSeasons = await db
      .insert(seasons)
      .values([
        {
          seasonNumber: 1,
          name: 'Season 1',
          tournamentFormat: TournamentFormat.GROUP,
          playoffFormat: PlayoffFormat.KNOCKOUT,
          ruleSetId: ruleSetId('RS1_GROUP_KNOCKOUT'),
          state: TournamentState.COMPLETED,
          isPublished: true,
        },
        {
          seasonNumber: 2,
          name: 'Season 2',
          tournamentFormat: TournamentFormat.LEAGUE,
          playoffFormat: PlayoffFormat.IPL,
          ruleSetId: ruleSetId('RS2_LEAGUE_IPL_V1'),
          state: TournamentState.COMPLETED,
          isPublished: true,
          startDate: '2026-07-21',
          endDate: '2026-07-24',
        },
        {
          seasonNumber: 3,
          name: 'Season 3',
          tournamentFormat: TournamentFormat.LEAGUE,
          playoffFormat: PlayoffFormat.IPL,
          ruleSetId: ruleSetId('RS2_LEAGUE_IPL_V2'),
          state: TournamentState.COMPLETED,
          isPublished: true,
          startDate: '2026-07-27',
          endDate: '2026-08-04',
        },
        {
          seasonNumber: 4,
          name: 'Season 4',
          tournamentFormat: TournamentFormat.LEAGUE,
          playoffFormat: PlayoffFormat.IPL,
          ruleSetId: ruleSetId('RS2_LEAGUE_IPL_V2'),
          state: TournamentState.ACTIVE,
          isPublished: true,
          startDate: '2026-08-05',
        },
      ])
      .returning();
    const [season1, season2, season3, season4] = insertedSeasons;

    console.log('Seeding groups (Season 1)...');
    const insertedGroups = await db
      .insert(groups)
      .values([
        { seasonId: season1.id, name: 'A', displayOrder: 1 },
        { seasonId: season1.id, name: 'B', displayOrder: 2 },
      ])
      .returning();
    const groupIdByName: Record<string, string> = {
      A: insertedGroups[0].id,
      B: insertedGroups[1].id,
    };

    console.log('Seeding season registrations...');
    const registrationRows = [
      ...SEASON1_GROUPS.A.map((name) => ({
        seasonId: season1.id,
        playerId: pid(name),
        groupId: groupIdByName.A,
        registrationStatus: RegistrationStatus.REGISTERED,
      })),
      ...SEASON1_GROUPS.B.map((name) => ({
        seasonId: season1.id,
        playerId: pid(name),
        groupId: groupIdByName.B,
        registrationStatus: RegistrationStatus.REGISTERED,
      })),
      ...SEASON2_PLAYERS.map((name) => ({
        seasonId: season2.id,
        playerId: pid(name),
        groupId: null,
        registrationStatus: RegistrationStatus.REGISTERED,
      })),
      ...SEASON3_PLAYERS.map((name) => ({
        seasonId: season3.id,
        playerId: pid(name),
        groupId: null,
        registrationStatus: RegistrationStatus.REGISTERED,
      })),
      ...SEASON4_PLAYERS.map((name) => ({
        seasonId: season4.id,
        playerId: pid(name),
        groupId: null,
        registrationStatus: RegistrationStatus.REGISTERED,
      })),
    ];
    await db.insert(seasonRegistrations).values(registrationRows);

    // ---------------- Season 1: group matches + knockout ----------------
    console.log('Seeding Season 1 matches...');

    const groupAStandings = computeStandings(
      [...SEASON1_GROUPS.A],
      toStandingsInputs(SEASON1_GROUP_MATCHES.filter((m) => m.groupName === 'A')),
      [TieBreakerType.WIN_MARGIN],
    );
    const groupBStandings = computeStandings(
      [...SEASON1_GROUPS.B],
      toStandingsInputs(SEASON1_GROUP_MATCHES.filter((m) => m.groupName === 'B')),
      [TieBreakerType.WIN_MARGIN],
    );
    console.log(
      '  Group A standings:',
      groupAStandings.map((s) => `${s.playerId}(${s.wins}W/${s.winMargin})`).join(', '),
    );
    console.log(
      '  Group B standings:',
      groupBStandings.map((s) => `${s.playerId}(${s.wins}W/${s.winMargin})`).join(', '),
    );

    // index.html's bracket rule: SF1 = GroupA #1 vs GroupB #2, SF2 = GroupB #1 vs GroupA #2.
    assertMatches('Season 1 SF1', 'Shashwat vs Sachin', `${groupAStandings[0].playerId} vs ${groupBStandings[1].playerId}`);
    assertMatches('Season 1 SF2', 'Kishan vs Varun', `${groupBStandings[0].playerId} vs ${groupAStandings[1].playerId}`);

    const s1GroupRows = SEASON1_GROUP_MATCHES.map((m) => ({
      seasonId: season1.id,
      groupId: groupIdByName[m.groupName as string],
      matchNumber: m.matchNumber,
      stage: MatchStage.GROUP,
      playerOneId: pid(m.playerOne),
      playerTwoId: pid(m.playerTwo),
      winnerId: pid(m.winner),
      loserId: pid(m.winner === m.playerOne ? m.playerTwo : m.playerOne),
      winMargin: m.winMargin,
      loseMargin: m.loseMargin,
      resultType: m.resultType,
      status: MatchStatus.COMPLETED,
      remarks: m.remarks ?? null,
    }));

    const s1KnockoutRows = SEASON1_KNOCKOUT_MATCHES.map((m) => ({
      seasonId: season1.id,
      groupId: null,
      matchNumber: m.matchNumber,
      stage: m.stage,
      playerOneId: pid(m.playerOne),
      playerTwoId: pid(m.playerTwo),
      winnerId: pid(m.winner),
      loserId: pid(m.winner === m.playerOne ? m.playerTwo : m.playerOne),
      winMargin: null,
      loseMargin: null,
      resultType: MatchResultType.NORMAL,
      status: MatchStatus.COMPLETED,
    }));

    await db.insert(matches).values([...s1GroupRows, ...s1KnockoutRows]);

    // ---------------- Season 2: league + IPL playoffs ----------------
    console.log('Seeding Season 2 matches...');

    const s2Standings = computeStandings(
      [...SEASON2_PLAYERS],
      toStandingsInputs(SEASON2_LEAGUE_MATCHES),
      [TieBreakerType.WIN_MARGIN, TieBreakerType.LOSE_MARGIN, TieBreakerType.HEAD_TO_HEAD],
    );
    console.log(
      '  Season 2 standings:',
      s2Standings.map((s) => `${s.playerId}(${s.wins}W wm${s.winMargin} lm${s.loseMargin})`).join(', '),
    );

    const s2Seeds: IplSeeds = {
      seed1: s2Standings[0].playerId,
      seed2: s2Standings[1].playerId,
      seed3: s2Standings[2].playerId,
      seed4: s2Standings[3].playerId,
    };
    const s2Playoffs = buildIplPlayoffRows(s2Seeds, SEASON2_PLAYOFF_RESULTS, SEASON2_LEAGUE_MATCHES.length + 1);
    assertMatches('Season 2 champion', 'Shashwat', s2Playoffs.champion);
    assertMatches('Season 2 runner-up', 'Varun', s2Playoffs.runnerUp);
    assertMatches('Season 2 third place', 'Kishan', s2Playoffs.thirdPlace);

    const s2LeagueRows = SEASON2_LEAGUE_MATCHES.map((m) => ({
      seasonId: season2.id,
      groupId: null,
      matchNumber: m.matchNumber,
      stage: MatchStage.LEAGUE,
      playerOneId: pid(m.playerOne),
      playerTwoId: pid(m.playerTwo),
      winnerId: pid(m.winner),
      loserId: pid(m.winner === m.playerOne ? m.playerTwo : m.playerOne),
      winMargin: m.winMargin,
      loseMargin: m.loseMargin,
      resultType: m.resultType,
      status: MatchStatus.COMPLETED,
      remarks: m.remarks ?? null,
    }));
    const s2PlayoffRows = s2Playoffs.rows.map((r) => ({
      seasonId: season2.id,
      groupId: null,
      matchNumber: r.matchNumber,
      stage: r.stage,
      playerOneId: pid(r.playerOne),
      playerTwoId: pid(r.playerTwo),
      winnerId: pid(r.result.winner),
      loserId: pid(r.result.winner === r.playerOne ? r.playerTwo : r.playerOne),
      winMargin: r.result.winMargin,
      loseMargin: r.result.loseMargin,
      resultType: MatchResultType.NORMAL,
      status: MatchStatus.COMPLETED,
    }));

    await db.insert(matches).values([...s2LeagueRows, ...s2PlayoffRows]);

    // ---------------- Season 3: league + IPL playoffs ----------------
    console.log('Seeding Season 3 matches...');

    const s3Standings = computeStandings(
      [...SEASON3_PLAYERS],
      toStandingsInputs(SEASON3_LEAGUE_MATCHES),
      [TieBreakerType.WIN_MARGIN, TieBreakerType.LOSE_MARGIN, TieBreakerType.HEAD_TO_HEAD],
    );
    console.log(
      '  Season 3 standings:',
      s3Standings.map((s) => `${s.playerId}(${s.wins}W wm${s.winMargin} lm${s.loseMargin})`).join(', '),
    );

    const s3Seeds: IplSeeds = {
      seed1: s3Standings[0].playerId,
      seed2: s3Standings[1].playerId,
      seed3: s3Standings[2].playerId,
      seed4: s3Standings[3].playerId,
    };
    const s3Playoffs = buildIplPlayoffRows(s3Seeds, SEASON3_PLAYOFF_RESULTS, SEASON3_LEAGUE_MATCHES.length + 1);
    assertMatches('Season 3 champion', 'Varun', s3Playoffs.champion);
    assertMatches('Season 3 runner-up', 'Shashwat', s3Playoffs.runnerUp);
    assertMatches('Season 3 third place', 'Kishan', s3Playoffs.thirdPlace);

    const s3LeagueRows = SEASON3_LEAGUE_MATCHES.map((m) => ({
      seasonId: season3.id,
      groupId: null,
      matchNumber: m.matchNumber,
      stage: MatchStage.LEAGUE,
      playerOneId: pid(m.playerOne),
      playerTwoId: pid(m.playerTwo),
      winnerId: pid(m.winner),
      loserId: pid(m.winner === m.playerOne ? m.playerTwo : m.playerOne),
      winMargin: m.winMargin,
      loseMargin: m.loseMargin,
      resultType: m.resultType,
      status: MatchStatus.COMPLETED,
      remarks: m.remarks ?? null,
    }));
    const s3PlayoffRows = s3Playoffs.rows.map((r) => ({
      seasonId: season3.id,
      groupId: null,
      matchNumber: r.matchNumber,
      stage: r.stage,
      playerOneId: pid(r.playerOne),
      playerTwoId: pid(r.playerTwo),
      winnerId: pid(r.result.winner),
      loserId: pid(r.result.winner === r.playerOne ? r.playerTwo : r.playerOne),
      winMargin: r.result.winMargin,
      loseMargin: r.result.loseMargin,
      resultType: MatchResultType.NORMAL,
      status: MatchStatus.COMPLETED,
    }));

    await db.insert(matches).values([...s3LeagueRows, ...s3PlayoffRows]);

    // ---------------- Season 4: scheduled only, nothing played yet ----------------
    console.log('Seeding Season 4 matches (scheduled, no results yet)...');
    const s4Rows = SEASON4_SCHEDULED_MATCHES.map((m) => ({
      seasonId: season4.id,
      groupId: null,
      matchNumber: m.matchNumber,
      stage: MatchStage.LEAGUE,
      playerOneId: pid(m.playerOne),
      playerTwoId: pid(m.playerTwo),
      winnerId: null,
      loserId: null,
      winMargin: null,
      loseMargin: null,
      resultType: null,
      status: MatchStatus.SCHEDULED,
    }));
    await db.insert(matches).values(s4Rows);

    // ---------------- Awards ----------------
    console.log('Seeding awards...');
    const allAwards: Array<SeedAward & { seasonId: string }> = [
      ...SEASON1_AWARDS.map((a) => ({ ...a, seasonId: season1.id })),
      ...SEASON2_AWARDS.map((a) => ({ ...a, seasonId: season2.id })),
      ...SEASON3_AWARDS.map((a) => ({ ...a, seasonId: season3.id })),
    ];
    await db.insert(awards).values(
      allAwards.map((a) => ({
        seasonId: a.seasonId,
        playerId: pid(a.player),
        name: a.name,
        category: a.category,
        description: a.description ?? null,
        source: a.source,
      })),
    );

    console.log('\nSeed complete.');
    console.log(
      `  Players: ${insertedPlayers.length}, Rule sets: ${insertedRuleSets.length}, Seasons: ${insertedSeasons.length}`,
    );
    console.log(
      `  Matches: ${s1GroupRows.length + s1KnockoutRows.length} (S1) + ${s2LeagueRows.length + s2PlayoffRows.length} (S2) + ${s3LeagueRows.length + s3PlayoffRows.length} (S3) + ${s4Rows.length} (S4)`,
    );
    console.log(`  Awards: ${allAwards.length}`);
  } finally {
    await client.end();
  }
}

main().catch((err) => {
  console.error('Seed failed:', err);
  process.exitCode = 1;
});
