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

/** 1 -> "1st", 2 -> "2nd", 11 -> "11th", 21 -> "21st", etc. */
export function formatOrdinal(n: number): string {
  const remainder100 = n % 100;
  if (remainder100 >= 11 && remainder100 <= 13) return `${n}th`;
  switch (n % 10) {
    case 1:
      return `${n}st`;
    case 2:
      return `${n}nd`;
    case 3:
      return `${n}rd`;
    default:
      return `${n}th`;
  }
}
