'use client';

import { motion, useReducedMotion } from 'motion/react';

import type { StandingsEntryView } from '@/lib/services';
import { FormGuide } from '@/components/tournament/form-guide';

export function StandingsTable({ title, entries }: { title: string; entries: StandingsEntryView[] }) {
  const reduceMotion = useReducedMotion();

  return (
    <div className="overflow-x-auto rounded-lg border border-border bg-card shadow-sm">
      <div className="border-b-2 border-primary/20 bg-secondary/40 px-4 py-2 font-serif font-semibold text-card-foreground">
        {title}
      </div>
      <table className="w-full text-sm">
        <thead>
          <tr className="text-left text-xs tracking-wide text-muted-foreground uppercase">
            <th className="px-3 py-2">#</th>
            <th className="px-3 py-2">Player</th>
            <th className="px-3 py-2">P</th>
            <th className="px-3 py-2">W</th>
            <th className="px-3 py-2">L</th>
            <th className="px-3 py-2">Pts</th>
            <th className="px-3 py-2">Win Margin</th>
            <th className="px-3 py-2">Lose Margin</th>
            <th className="px-3 py-2">Form</th>
          </tr>
        </thead>
        <tbody>
          {entries.map((e, i) => (
            <motion.tr
              key={e.playerId}
              initial={reduceMotion ? undefined : { opacity: 0 }}
              animate={reduceMotion ? undefined : { opacity: 1 }}
              transition={{ duration: 0.25, delay: i * 0.04 }}
              className={`border-t border-border ${i < 4 ? 'bg-accent/30' : ''}`}
              suppressHydrationWarning
            >
              <td className="px-3 py-2 font-serif font-bold text-primary">{i + 1}</td>
              <td className="px-3 py-2 font-medium text-card-foreground">
                {e.displayName}
                {e.needsDecider && e.played > 0 && (
                  <span className="ml-2 rounded-full bg-ring/20 px-2 py-0.5 text-xs font-bold text-ring">
                    Decider needed
                  </span>
                )}
              </td>
              <td className="px-3 py-2">{e.played}</td>
              <td className="px-3 py-2 font-semibold text-primary">{e.wins}</td>
              <td className="px-3 py-2 font-semibold text-destructive">{e.losses}</td>
              <td className="px-3 py-2 font-semibold text-card-foreground">{e.points}</td>
              <td className="px-3 py-2">{e.winMargin}</td>
              <td className="px-3 py-2">{e.loseMargin}</td>
              <td className="px-3 py-2">
                <FormGuide results={e.recentForm} />
              </td>
            </motion.tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
