import { motion, useReducedMotion } from 'motion/react';

import type { PlayerStatsView, StatsHighlight } from '@/lib/services';
import { FormGuide } from './form-guide';

function HighlightTile({ highlight, index }: { highlight: StatsHighlight; index: number }) {
  const reduceMotion = useReducedMotion();
  return (
    <motion.div
      initial={reduceMotion ? undefined : { opacity: 0, y: 6 }}
      animate={reduceMotion ? undefined : { opacity: 1, y: 0 }}
      transition={{ duration: 0.25, delay: index * 0.05 }}
      className="rounded-lg border border-border bg-card p-4 shadow-sm"
      suppressHydrationWarning
    >
      <div className="text-xs font-bold tracking-wide text-muted-foreground uppercase">{highlight.label}</div>
      <div className="mt-1 font-serif text-xl font-semibold text-card-foreground">{highlight.value}</div>
      <div className="mt-1 text-sm text-muted-foreground">{highlight.detail}</div>
    </motion.div>
  );
}

function PlayerCard({ player, index }: { player: PlayerStatsView; index: number }) {
  const reduceMotion = useReducedMotion();
  const streakColor =
    player.currentStreak.type === 'W' ? 'text-primary' : player.currentStreak.type === 'L' ? 'text-destructive' : '';
  const winPctColor = player.winPct >= 60 ? 'text-primary' : player.winPct <= 40 && player.played > 0 ? 'text-destructive' : 'text-card-foreground';
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
          <dt className="text-muted-foreground">Record</dt>
          <dd className="font-semibold text-card-foreground">
            {player.wins}-{player.losses}
          </dd>
        </div>
        <div className="flex items-baseline justify-between border-t border-dashed border-border pt-1.5">
          <dt className="text-muted-foreground">Win %</dt>
          <dd className={`font-semibold ${winPctColor}`}>{player.winPct}%</dd>
        </div>
        <div className="flex items-center justify-between border-t border-dashed border-border pt-1.5">
          <dt className="text-muted-foreground">Form</dt>
          <dd>
            <FormGuide results={player.recentForm} />
          </dd>
        </div>
        <div className="flex items-baseline justify-between border-t border-dashed border-border pt-1.5">
          <dt className="text-muted-foreground">Longest Win Streak</dt>
          <dd className="font-semibold text-card-foreground">{player.longestWinStreak}</dd>
        </div>
        <div className="flex items-baseline justify-between border-t border-dashed border-border pt-1.5">
          <dt className="text-muted-foreground">Current Streak</dt>
          <dd className={`font-semibold ${streakColor}`}>
            {player.currentStreak.type ? `${player.currentStreak.count}${player.currentStreak.type}` : '—'}
          </dd>
        </div>
        <div className="flex items-baseline justify-between border-t border-dashed border-border pt-1.5">
          <dt className="text-muted-foreground">Avg Win Margin</dt>
          <dd className="font-semibold text-card-foreground">{player.avgWinMargin}</dd>
        </div>
        <div className="flex items-baseline justify-between border-t border-dashed border-border pt-1.5">
          <dt className="text-muted-foreground">Biggest Win</dt>
          <dd className="font-semibold text-card-foreground">
            {player.biggestWin ? `${player.biggestWin.margin} vs ${player.biggestWinOpponentName}` : '—'}
          </dd>
        </div>
        <div className="flex items-baseline justify-between border-t border-dashed border-border pt-1.5">
          <dt className="text-muted-foreground">8-Ball Fouls Committed</dt>
          <dd className="font-semibold text-card-foreground">{player.eightBallFoulsCommitted}</dd>
        </div>
        <div className="flex items-baseline justify-between border-t border-dashed border-border pt-1.5">
          <dt className="text-muted-foreground">Won via Opponent&apos;s Foul</dt>
          <dd className="font-semibold text-card-foreground">{player.eightBallFoulsWon}</dd>
        </div>
        <div className="flex items-baseline justify-between border-t border-dashed border-border pt-1.5">
          <dt className="text-muted-foreground">Fouls Committed</dt>
          <dd className="font-semibold text-card-foreground">{player.foulsCommitted}</dd>
        </div>
        <div className="flex items-baseline justify-between border-t border-dashed border-border pt-1.5">
          <dt className="text-muted-foreground">Won via Foul</dt>
          <dd className="font-semibold text-card-foreground">{player.foulsWon}</dd>
        </div>
      </dl>
    </motion.div>
  );
}

export function StatsOverview({ players, highlights }: { players: PlayerStatsView[]; highlights: StatsHighlight[] }) {
  const ranked = [...players].sort((a, b) => b.winPct - a.winPct || b.wins - a.wins);

  return (
    <div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {highlights.map((h, i) => (
          <HighlightTile key={h.label} highlight={h} index={i} />
        ))}
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {ranked.map((p, i) => (
          <PlayerCard key={p.playerId} player={p} index={i} />
        ))}
      </div>
    </div>
  );
}
