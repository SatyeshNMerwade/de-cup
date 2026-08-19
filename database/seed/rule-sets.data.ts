import { MatchStage, PlayoffFormat, TournamentFormat } from '@/types/domain/tournament';
import { RuleConfiguration, TieBreakerType } from '@/types/domain/rule';

/**
 * 3 rule sets cover all 4 seasons of index.html:
 *  - RS1: Season 1's group stage + knockout.
 *  - RS2 (v1): Season 2's league + IPL playoffs. A foul loss mirrors the
 *    balls-left difference between the two players into both margins
 *    (index.html: "the recorded margin is the difference between the two
 *    players' remaining balls").
 *  - RS2 (v2): Seasons 3 & 4's league + IPL playoffs. Originally intended
 *    as a genuinely different foul rule (0 Win Margin / fixed Lose Margin
 *    penalty), but match recording now always credits the actual
 *    balls-left count as the margin for every result, foul or not — so v2
 *    is intentionally identical to v1's rules today. Kept as a separate
 *    versioned row for continuity with how Seasons 3-4 were originally
 *    labeled, not because the two behave differently.
 */

const groupKnockoutRules: RuleConfiguration = {
  scoring: {
    pointsPerWin: 1,
    allowDraws: false,
    enableWinMargin: true,
    enableLoseMargin: false,
  },
  qualification: {
    qualificationSlots: 4,
    enableQualificationPercentage: false,
    enableQualificationScenario: false,
  },
  tieBreakers: {
    order: [TieBreakerType.WIN_MARGIN],
  },
  playoffs: {
    enabled: true,
    playoffFormat: PlayoffFormat.KNOCKOUT,
    qualificationSlots: 4,
  },
  stages: {
    stages: [MatchStage.GROUP, MatchStage.SEMI_FINAL, MatchStage.THIRD_PLACE, MatchStage.FINAL],
  },
};

const leagueIplRulesV1: RuleConfiguration = {
  scoring: {
    pointsPerWin: 2,
    allowDraws: false,
    enableWinMargin: true,
    enableLoseMargin: true,
  },
  qualification: {
    qualificationSlots: 4,
    enableQualificationPercentage: true,
    enableQualificationScenario: true,
  },
  tieBreakers: {
    order: [TieBreakerType.WIN_MARGIN, TieBreakerType.LOSE_MARGIN, TieBreakerType.HEAD_TO_HEAD],
  },
  playoffs: {
    enabled: true,
    playoffFormat: PlayoffFormat.IPL,
    qualificationSlots: 4,
  },
  stages: {
    stages: [
      MatchStage.LEAGUE,
      MatchStage.QUALIFIER_1,
      MatchStage.ELIMINATOR,
      MatchStage.QUALIFIER_2,
      MatchStage.FINAL,
    ],
  },
};

export const RULE_SETS_DATA = [
  {
    key: 'RS1_GROUP_KNOCKOUT' as const,
    name: 'DE Cup Group + Knockout',
    description: 'Season 1 format: round-robin groups of 3, top 2 per group to a knockout bracket.',
    version: 1,
    tournamentFormat: TournamentFormat.GROUP,
    playoffFormat: PlayoffFormat.KNOCKOUT,
    rules: groupKnockoutRules,
  },
  {
    key: 'RS2_LEAGUE_IPL_V1' as const,
    name: 'DE Cup League + IPL Playoffs',
    description: 'Season 2 format: single round-robin league, top 4 to IPL-style playoffs. Foul losses mirror the balls-left difference into both margins.',
    version: 1,
    tournamentFormat: TournamentFormat.LEAGUE,
    playoffFormat: PlayoffFormat.IPL,
    rules: leagueIplRulesV1,
  },
  {
    key: 'RS2_LEAGUE_IPL_V2' as const,
    name: 'DE Cup League + IPL Playoffs',
    description: 'Seasons 3-4 format: identical rules to v1 — every result, including an 8-ball foul, credits the actual balls-left count as the margin. Kept as a separate version for historical continuity with how Seasons 3-4 were originally labeled.',
    version: 2,
    tournamentFormat: TournamentFormat.LEAGUE,
    playoffFormat: PlayoffFormat.IPL,
    rules: leagueIplRulesV1,
  },
] as const;

export type RuleSetKey = (typeof RULE_SETS_DATA)[number]['key'];
