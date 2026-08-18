'use client';

import { useState } from 'react';

import type { PlayerProfileView } from '@/lib/services';

export function StatsProfile({ profiles }: { profiles: PlayerProfileView[] }) {
  const [selectedId, setSelectedId] = useState(profiles[0]?.playerId ?? '');
  const selected = profiles.find((p) => p.playerId === selectedId) ?? profiles[0];
  if (!selected) return null;

  return (
    <div>
      <div className="mb-4 flex flex-wrap gap-2">
        {profiles.map((p) => (
          <button
            key={p.playerId}
            type="button"
            onClick={() => setSelectedId(p.playerId)}
            className={`rounded-full px-3 py-1 text-sm font-semibold transition-colors ${
              p.playerId === selected.playerId
                ? 'bg-primary text-primary-foreground'
                : 'bg-muted text-muted-foreground hover:bg-accent hover:text-accent-foreground'
            }`}
          >
            {p.displayName}
          </button>
        ))}
      </div>

      <div className="rounded-lg border border-border bg-card p-5 shadow-sm">
        <h3 className="font-serif text-lg font-semibold text-card-foreground">{selected.displayName}</h3>
        <p className="text-sm text-muted-foreground">All matches, most recent first</p>

        <div className="mt-3 flex flex-col divide-y divide-border">
          {selected.matchHistory.length === 0 ? (
            <p className="py-3 text-sm text-muted-foreground italic">No completed matches yet.</p>
          ) : (
            selected.matchHistory.map((m, i) => {
              const seasonChanged = i > 0 && selected.matchHistory[i - 1].seasonNumber !== m.seasonNumber;
              return (
                <div
                  key={`${m.seasonNumber}-${m.stage}-${m.opponentName}-${i}`}
                  className={`flex flex-wrap items-center gap-x-4 gap-y-1 py-2 text-sm ${seasonChanged ? 'border-t-2 border-t-ring' : ''}`}
                >
                  <span className="w-20 shrink-0 text-xs text-muted-foreground">Season {m.seasonNumber}</span>
                  <span className="w-24 shrink-0 text-xs text-muted-foreground">{m.stage}</span>
                  <span className="flex-1 text-card-foreground">
                    vs <span className="font-medium">{m.opponentName}</span>
                  </span>
                  <span className={`font-semibold ${m.won ? 'text-primary' : 'text-destructive'}`}>
                    {m.won ? 'Won' : 'Lost'}
                    {m.margin != null ? `, ${m.margin} ball(s) left` : ''}
                  </span>
                  {m.isEightBallFoul && <span className="text-xs text-muted-foreground italic">🎱 8-Ball Mistake</span>}
                  {m.isFoul && <span className="text-xs text-muted-foreground italic">⚠️ Foul</span>}
                </div>
              );
            })
          )}
        </div>

        {selected.remainingMatches.length > 0 && (
          <div className="mt-5 border-t border-border pt-4">
            <div className="text-xs font-bold tracking-wide text-muted-foreground uppercase">
              Remaining matches — win chance based on head-to-head record
            </div>
            <div className="mt-2 flex flex-col gap-1.5">
              {selected.remainingMatches.map((m) => (
                <div key={m.opponentName} className="flex items-center justify-between text-sm">
                  <span>
                    vs <span className="font-medium text-card-foreground">{m.opponentName}</span>
                  </span>
                  <span className="text-muted-foreground">
                    <span className="font-semibold text-primary">{m.winProbability}%</span> to win{' '}
                    <span className="text-xs">
                      (H2H {m.headToHead.wins}-{m.headToHead.losses})
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
