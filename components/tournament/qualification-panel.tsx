'use client';

import { useState } from 'react';

import type { QualificationOutlookView } from '@/lib/services';
import { formatTieBreakerLabel } from '@/lib/helpers/format.helper';

export function QualificationPanel({ outlook }: { outlook: QualificationOutlookView[] }) {
  const [selectedId, setSelectedId] = useState(outlook[0]?.playerId ?? '');
  const selected = outlook.find((o) => o.playerId === selectedId) ?? outlook[0];
  if (!selected) return null;

  return (
    <div className="rounded-lg border border-border bg-card p-5 shadow-sm">
      <div className="flex flex-wrap gap-2">
        {outlook.map((o) => (
          <button
            key={o.playerId}
            type="button"
            onClick={() => setSelectedId(o.playerId)}
            className={`rounded-full px-3 py-1 text-sm font-semibold transition-colors ${
              o.playerId === selected.playerId
                ? 'bg-primary text-primary-foreground'
                : 'bg-muted text-muted-foreground hover:bg-accent hover:text-accent-foreground'
            }`}
          >
            {o.displayName}
          </button>
        ))}
      </div>

      <div className="mt-5">
        <div className="flex items-baseline gap-3">
          <span className="font-serif text-4xl font-bold text-primary">{selected.midPct}%</span>
          <span className="text-xs font-bold tracking-wide text-muted-foreground uppercase">chance of qualifying</span>
        </div>
        {selected.floorPct !== selected.ceilingPct && (
          <p className="mt-1 text-xs text-muted-foreground">
            guaranteed floor {selected.floorPct}% · possible ceiling {selected.ceilingPct}% (unresolved ties counted
            50/50 above)
          </p>
        )}

        <p className="mt-4 rounded-md border-l-4 border-ring bg-secondary/30 px-4 py-3 text-sm leading-relaxed text-foreground">
          {selected.reason}
        </p>

        {selected.rivalThreshold && (
          <p className="mt-3 rounded-md border-l-4 border-primary/40 bg-muted/40 px-4 py-3 text-sm leading-relaxed text-foreground">
            You&apos;re tied on wins with{' '}
            <span className="font-semibold">{selected.rivalThreshold.rivalName}</span> for the last spot.{' '}
            {selected.rivalThreshold.isAhead ? (
              <>
                You currently lead on {formatTieBreakerLabel(selected.rivalThreshold.criterion)},{' '}
                {selected.rivalThreshold.aheadValue} to {selected.rivalThreshold.behindValue}. As things stand,
                that&apos;s enough to hold the tiebreaker — though it can shift if either of you plays more matches.
              </>
            ) : (
              <>
                They currently lead on {formatTieBreakerLabel(selected.rivalThreshold.criterion)},{' '}
                {selected.rivalThreshold.aheadValue} to {selected.rivalThreshold.behindValue} — you need at least +
                {selected.rivalThreshold.threshold} {formatTieBreakerLabel(selected.rivalThreshold.criterion)} from
                your remaining matches to move ahead (assuming their numbers don&apos;t change further).
              </>
            )}
          </p>
        )}

        <p className="mt-3 text-sm text-muted-foreground">
          Currently {selected.currentWins} win{selected.currentWins === 1 ? '' : 's'} from {selected.played} played,
          with {selected.remainingCount} match{selected.remainingCount === 1 ? '' : 'es'} left to play.
        </p>

        {selected.opponents.length > 0 && (
          <div className="mt-4">
            <div className="text-xs font-bold tracking-wide text-muted-foreground uppercase">
              Remaining matches — win chance based on head-to-head record
            </div>
            <div className="mt-2 flex flex-col gap-1.5">
              {selected.opponents.map((o) => (
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
    </div>
  );
}
