'use client';

import { Fragment, useState } from 'react';
import { motion, useReducedMotion } from 'motion/react';

import type { QualificationStatus, StandingsEntryView } from '@/lib/services';
import { FormGuide } from '@/components/tournament/form-guide';
import { MatchResultType } from '@/types/domain/tournament';

function QualificationBadge({ status }: { status: QualificationStatus }) {
  if (status === 'qualified') {
    return (
      <span
        className="ml-2 inline-flex h-5 w-5 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground"
        title="Qualified"
      >
        Q
      </span>
    );
  }
  if (status === 'eliminated') {
    return (
      <span
        className="ml-2 inline-flex h-5 w-5 items-center justify-center rounded-full bg-destructive text-[10px] font-bold text-white"
        title="Eliminated"
      >
        E
      </span>
    );
  }
  return null;
}

export function StandingsTable({
  title,
  entries,
  seasonNumber,
}: {
  title: string;
  entries: StandingsEntryView[];
  seasonNumber: number;
}) {
  const reduceMotion = useReducedMotion();
  const [expanded, setExpanded] = useState<Set<string>>(new Set());

  function toggle(playerId: string) {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(playerId)) next.delete(playerId);
      else next.add(playerId);
      return next;
    });
  }

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
          {entries.map((e, i) => {
            const isExpanded = expanded.has(e.playerId);
            const eliminated = e.qualificationStatus === 'eliminated';
            const rowAccent =
              e.qualificationStatus === 'qualified'
                ? 'border-l-4 border-l-ring'
                : eliminated
                  ? 'border-l-4 border-l-destructive/50'
                  : 'border-l-4 border-l-transparent';
            const restOpacity = eliminated ? 0.45 : 1;

            return (
              <Fragment key={e.playerId}>
                <motion.tr
                  initial={reduceMotion ? undefined : { opacity: 0 }}
                  animate={{ opacity: restOpacity }}
                  transition={{ duration: 0.25, delay: reduceMotion ? 0 : i * 0.04 }}
                  className={`border-t border-border ${rowAccent}`}
                  suppressHydrationWarning
                >
                  <td className="px-3 py-2 font-serif font-bold text-primary">
                    <button
                      type="button"
                      onClick={() => toggle(e.playerId)}
                      aria-expanded={isExpanded}
                      aria-label={`${isExpanded ? 'Hide' : 'Show'} ${e.displayName}'s matches`}
                      className="mr-1 text-xs text-muted-foreground hover:text-foreground"
                    >
                      {isExpanded ? '▲' : '▼'}
                    </button>
                    {i + 1}
                  </td>
                  <td className="px-3 py-2 font-medium text-card-foreground">
                    {e.displayName}
                    <QualificationBadge status={e.qualificationStatus} />
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
                {isExpanded && (
                  <motion.tr
                    initial={reduceMotion ? undefined : { opacity: 0 }}
                    animate={reduceMotion ? undefined : { opacity: 1 }}
                    transition={{ duration: 0.2 }}
                    className="border-t border-border bg-muted/20"
                    suppressHydrationWarning
                  >
                    <td colSpan={9} className="px-4 py-3">
                      <div className="text-xs font-bold tracking-widest text-muted-foreground uppercase">
                        {e.displayName}&apos;s Season {seasonNumber} matches
                      </div>
                      <div className="mt-2 flex flex-col gap-1.5">
                        {e.matchHistory.length === 0 ? (
                          <p className="text-sm text-muted-foreground italic">No matches played yet.</p>
                        ) : (
                          e.matchHistory.map((h, idx) => (
                            <div key={idx} className="text-sm">
                              <span className="text-muted-foreground">
                                Match {h.matchNumber} — vs{' '}
                                <span className="font-medium text-card-foreground">{h.opponentName}</span> —{' '}
                              </span>
                              <span className={`font-semibold ${h.won ? 'text-primary' : 'text-destructive'}`}>
                                {h.won ? 'Won' : 'Lost'}, {h.ballsLeft} ball{h.ballsLeft === 1 ? '' : 's'} left
                              </span>
                              {h.resultType === MatchResultType.EIGHT_BALL_FOUL && (
                                <span className="ml-1 text-xs text-muted-foreground italic">🎱 8-Ball Mistake</span>
                              )}
                              {h.resultType === MatchResultType.FOUL && (
                                <span className="ml-1 text-xs text-muted-foreground italic">⚠️ Foul</span>
                              )}
                            </div>
                          ))
                        )}
                      </div>
                    </td>
                  </motion.tr>
                )}
              </Fragment>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
