'use client';

import { useEffect, useRef } from 'react';
import { animate, motion, useMotionValue, useReducedMotion, useTransform } from 'motion/react';

import type { RivalThresholdView } from '@/lib/services';
import { formatTieBreakerLabel } from '@/lib/helpers/format.helper';

/** Green when qualification-leaning, red when elimination-leaning, neutral ink in between — never gold-on-white (fails contrast, see the plan's validate_palette.js findings). */
function pctColor(midPct: number): string {
  if (midPct >= 60) return 'text-primary';
  if (midPct <= 25) return 'text-destructive';
  return 'text-foreground';
}

function AnimatedPct({ value }: { value: number }) {
  const reduceMotion = useReducedMotion();
  const count = useMotionValue(0);
  const rounded = useTransform(count, (v) => Math.round(v));
  const hasAnimated = useRef(false);

  useEffect(() => {
    if (reduceMotion) {
      count.set(value);
      return;
    }
    if (!hasAnimated.current) {
      hasAnimated.current = true;
      const controls = animate(count, value, { duration: 0.6 });
      return controls.stop;
    }
    count.set(value);
  }, [value, reduceMotion, count]);

  return <motion.span>{rounded}</motion.span>;
}

export interface QualificationSummaryData {
  midPct: number;
  floorPct: number;
  ceilingPct: number;
  reason: string;
  currentWins: number;
  played: number;
  remainingCount: number;
  opponents: { opponentId: string; opponentName: string; winProbability: number; headToHead: { wins: number; losses: number } }[];
  rivalThreshold?: RivalThresholdView;
}

/**
 * The headline percentage + floor/ceiling + reason + rival-tiebreak callout
 * + remaining-matches list — shared, pixel-identical, between the
 * Qualification Percentage panel and the top of the Qualification Scenario
 * section (the reference design shows the same summary in both places).
 */
export function QualificationSummary({
  data,
  qualificationSlots,
}: {
  data: QualificationSummaryData;
  qualificationSlots: number;
}) {
  return (
    <div>
      <div className="flex items-baseline gap-3">
        <span className={`font-serif text-4xl font-bold ${pctColor(data.midPct)}`}>
          <AnimatedPct value={data.midPct} />%
        </span>
        <span className="text-xs font-bold tracking-wide text-muted-foreground uppercase">
          chance of finishing in the top {qualificationSlots}
        </span>
      </div>
      {data.floorPct !== data.ceilingPct && (
        <p className="mt-1 text-xs text-muted-foreground">
          guaranteed floor {data.floorPct}% · possible ceiling {data.ceilingPct}% (unresolved ties counted 50/50
          above)
        </p>
      )}

      <p className="mt-4 rounded-md border-l-4 border-ring bg-secondary/30 px-4 py-3 text-sm leading-relaxed text-foreground">
        {data.reason}
      </p>

      {data.rivalThreshold && (
        <p className="mt-3 rounded-md border-l-4 border-primary/40 bg-muted/40 px-4 py-3 text-sm leading-relaxed text-foreground">
          You&apos;re tied on wins with <span className="font-semibold">{data.rivalThreshold.rivalName}</span> for
          the last spot.{' '}
          {data.rivalThreshold.isAhead ? (
            <>
              You currently lead on {formatTieBreakerLabel(data.rivalThreshold.criterion)},{' '}
              {data.rivalThreshold.aheadValue} to {data.rivalThreshold.behindValue}. As things stand, that&apos;s
              enough to hold the tiebreaker, though it can shift if either of you plays more matches.
            </>
          ) : (
            <>
              They currently lead on {formatTieBreakerLabel(data.rivalThreshold.criterion)},{' '}
              {data.rivalThreshold.aheadValue} to {data.rivalThreshold.behindValue}. You need at least +
              {data.rivalThreshold.threshold} {formatTieBreakerLabel(data.rivalThreshold.criterion)} from your
              remaining matches to move ahead (assuming their numbers don&apos;t change further).
            </>
          )}
        </p>
      )}

      <p className="mt-3 text-sm text-muted-foreground">
        Currently {data.currentWins} win{data.currentWins === 1 ? '' : 's'} from {data.played} played, with{' '}
        {data.remainingCount} match{data.remainingCount === 1 ? '' : 'es'} left to play.
      </p>

      {data.opponents.length > 0 && (
        <div className="mt-4">
          <div className="text-xs font-bold tracking-wide text-muted-foreground uppercase">
            Remaining matches: win chance based on head-to-head record
          </div>
          <div className="mt-2 flex flex-col gap-1.5">
            {data.opponents.map((o) => (
              <div key={o.opponentId} className="flex items-center justify-between text-sm">
                <span>
                  vs <span className="font-medium text-card-foreground">{o.opponentName}</span>
                </span>
                <span className="text-muted-foreground">
                  <span className="font-semibold text-primary">{o.winProbability}%</span> to win{' '}
                  <span className="text-xs">
                    (H2H {o.headToHead.wins}-{o.headToHead.losses})
                  </span>
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
