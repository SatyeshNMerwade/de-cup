import { motion, useReducedMotion } from 'motion/react';

import type { PlayerTossBreakStatsView, TossBreakStatsView } from '@/lib/services';

function InsightTile({ tossBreak }: { tossBreak: TossBreakStatsView }) {
  const reduceMotion = useReducedMotion();
  return (
    <motion.div
      initial={reduceMotion ? undefined : { opacity: 0, y: 6 }}
      animate={reduceMotion ? undefined : { opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      className="rounded-lg border border-border bg-card p-4 shadow-sm"
      suppressHydrationWarning
    >
      <div className="text-xs font-bold tracking-wide text-muted-foreground uppercase">Breaking First Wins</div>
      <div className="mt-1 font-serif text-xl font-semibold text-card-foreground">{tossBreak.leagueBreakWinPct}%</div>
      <div className="mt-1 text-sm text-muted-foreground">
        across {tossBreak.trackedMatches} tracked match{tossBreak.trackedMatches === 1 ? '' : 'es'}
      </div>
    </motion.div>
  );
}

function PlayerCard({ player, index }: { player: PlayerTossBreakStatsView; index: number }) {
  const reduceMotion = useReducedMotion();
  const advantageColor =
    player.breakAdvantage > 0 ? 'text-primary' : player.breakAdvantage < 0 ? 'text-destructive' : 'text-card-foreground';
  return (
    <motion.div
      initial={reduceMotion ? undefined : { opacity: 0, y: 6 }}
      animate={reduceMotion ? undefined : { opacity: 1, y: 0 }}
      transition={{ duration: 0.25, delay: index * 0.04 }}
      className="rounded-lg border border-border bg-card p-4 shadow-sm"
      suppressHydrationWarning
    >
      <h3 className="font-serif text-lg font-semibold text-card-foreground">{player.displayName}</h3>
      <dl className="mt-3 flex flex-col gap-1.5 text-sm">
        <div className="flex items-baseline justify-between border-t border-dashed border-border pt-1.5 first:border-none first:pt-0">
          <dt className="text-muted-foreground">Toss Record</dt>
          <dd className="font-semibold text-card-foreground">
            {player.tossesWon}-{player.tossesPlayed - player.tossesWon}
          </dd>
        </div>
        <div className="flex items-baseline justify-between border-t border-dashed border-border pt-1.5">
          <dt className="text-muted-foreground">Toss Win %</dt>
          <dd className="font-semibold text-card-foreground">{player.tossWinPct}%</dd>
        </div>
        <div className="flex items-baseline justify-between border-t border-dashed border-border pt-1.5">
          <dt className="text-muted-foreground">Chose to Break / Deferred</dt>
          <dd className="font-semibold text-card-foreground">
            {player.choseToBreak} / {player.deferred}
          </dd>
        </div>
        <div className="flex items-baseline justify-between border-t border-dashed border-border pt-1.5">
          <dt className="text-muted-foreground">Broke First</dt>
          <dd className="font-semibold text-card-foreground">{player.brokeFirstCount}</dd>
        </div>
        <div className="flex items-baseline justify-between border-t border-dashed border-border pt-1.5">
          <dt className="text-muted-foreground">Break Win %</dt>
          <dd className="font-semibold text-card-foreground">{player.breakWinPct}%</dd>
        </div>
        <div className="flex items-baseline justify-between border-t border-dashed border-border pt-1.5">
          <dt className="text-muted-foreground">Non-Break Win %</dt>
          <dd className="font-semibold text-card-foreground">{player.nonBreakWinPct}%</dd>
        </div>
        <div className="flex items-baseline justify-between border-t border-dashed border-border pt-1.5">
          <dt className="text-muted-foreground">Break Advantage</dt>
          <dd className={`font-semibold ${advantageColor}`}>
            {player.breakAdvantage > 0 ? '+' : ''}
            {player.breakAdvantage}%
          </dd>
        </div>
      </dl>
    </motion.div>
  );
}

export function StatsToss({ tossBreak }: { tossBreak: TossBreakStatsView | null }) {
  if (!tossBreak) {
    return <p className="text-muted-foreground italic">No toss data recorded yet.</p>;
  }

  const ranked = [...tossBreak.players]
    .filter((p) => p.tossesPlayed > 0)
    .sort((a, b) => b.tossWinPct - a.tossWinPct || b.tossesWon - a.tossesWon);

  return (
    <div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <InsightTile tossBreak={tossBreak} />
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {ranked.map((p, i) => (
          <PlayerCard key={p.playerId} player={p} index={i} />
        ))}
      </div>
    </div>
  );
}
