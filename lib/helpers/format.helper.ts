import { MatchStage } from '@/types/domain/tournament';

const STAGE_LABELS: Record<MatchStage, string> = {
  [MatchStage.GROUP]: 'Group',
  [MatchStage.LEAGUE]: 'League',
  [MatchStage.QUALIFIER_1]: 'Qualifier 1',
  [MatchStage.ELIMINATOR]: 'Eliminator',
  [MatchStage.QUALIFIER_2]: 'Qualifier 2',
  [MatchStage.SEMI_FINAL]: 'Semifinal',
  [MatchStage.THIRD_PLACE]: 'Third Place',
  [MatchStage.FINAL]: 'Final',
};

/**
 * Accepts a plain string, not just MatchStage: Drizzle infers the `stage`
 * column as `string` because matchStageEnum is built from
 * `Object.values(MatchStage) as [string, ...string[]]` in
 * database/schema/enums.ts, which erases the literal enum types. Real
 * values are always valid MatchStage strings; unrecognized input just
 * passes through unchanged.
 */
export function formatStageLabel(stage: string): string {
  return STAGE_LABELS[stage as MatchStage] ?? stage;
}

const TIE_BREAKER_LABELS: Record<'WIN_MARGIN' | 'LOSE_MARGIN', string> = {
  WIN_MARGIN: 'Win Margin',
  LOSE_MARGIN: 'Lose Margin',
};

export function formatTieBreakerLabel(criterion: 'WIN_MARGIN' | 'LOSE_MARGIN'): string {
  return TIE_BREAKER_LABELS[criterion];
}
