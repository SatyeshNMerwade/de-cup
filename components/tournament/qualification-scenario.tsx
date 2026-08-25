'use client';

import { useState } from 'react';

import type { QualificationScenarioDisplay, QualificationScenarioView } from '@/lib/services';
import { formatOrdinal } from '@/lib/helpers/format.helper';

import { PlayerPillSelector } from './player-pill-selector';
import { QualificationSummary } from './qualification-summary';
import { Reveal } from './reveal';

function scenarioLabel(scenario: QualificationScenarioView): string {
  const total = scenario.outcomes.length;
  const wins = scenario.ownWins;
  const losses = total - wins;

  const parts: string[] = [];
  if (wins > 0) parts.push(`${wins} win${wins === 1 ? '' : 's'}`);
  if (losses > 0) parts.push(`${losses} loss${losses === 1 ? '' : 'es'}`);

  const breakdown = scenario.outcomes
    .map((o) => `${o.won ? 'beats' : 'loses to'} ${o.opponentName}`)
    .join(', ');

  return `${parts.join(', ')} (${breakdown})`;
}

function scenarioVerdict(scenario: QualificationScenarioView): string {
  const { qualifiedCount, contestedCount, eliminatedCount, totalCombos } = scenario;

  if (contestedCount > 0) {
    return 'Ends level on wins with one or more rivals for the last spot.';
  }
  if (qualifiedCount === totalCombos) {
    return totalCombos === 1
      ? 'Qualifies. No other matches remain to change it.'
      : 'Qualifies no matter how the other matches go.';
  }
  if (eliminatedCount === totalCombos) {
    return totalCombos === 1
      ? 'Does not qualify. No other matches remain to change it.'
      : 'Does not qualify no matter how the other matches go.';
  }
  return `Qualifies in ${qualifiedCount} and misses in ${eliminatedCount} of the ${totalCombos} ways the other matches could go.`;
}

export function QualificationScenario({
  display,
  qualificationSlots,
}: {
  display: QualificationScenarioDisplay;
  qualificationSlots: number;
}) {
  const [selectedId, setSelectedId] = useState<string>('');

  if (!display.available && display.reason === 'not-applicable') return null;

  if (!display.available) {
    return (
      <div className="rounded-lg border border-border bg-card p-5 shadow-sm">
        <p className="text-sm text-muted-foreground">
          Will be displayed once every player has 2 or fewer matches left to play.
        </p>
      </div>
    );
  }

  const players = display.players;
  const selected = players.find((p) => p.playerId === selectedId) ?? players[0];
  if (!selected) return null;

  return (
    <Reveal className="rounded-lg border border-border bg-card p-5 shadow-sm">
      <PlayerPillSelector players={players} selectedId={selected.playerId} onSelect={setSelectedId} />

      <div className="mt-5">
        <QualificationSummary data={selected} qualificationSlots={qualificationSlots} />

        <p className="mt-4 text-xs font-bold tracking-wide text-muted-foreground uppercase">
          Current position: {formatOrdinal(selected.currentRank)}
        </p>

        {selected.remainingCount > 0 && (
          <div className="mt-4 flex flex-col divide-y divide-border">
            {selected.scenarios.map((scenario, i) => {
              const qualifyPct = Math.round((scenario.qualifiedCount / scenario.totalCombos) * 100);
              const tiedPct = Math.round((scenario.contestedCount / scenario.totalCombos) * 100);

              return (
                <div key={i} className="py-3">
                  <p className="text-sm font-semibold text-card-foreground capitalize">{scenarioLabel(scenario)}</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Qualifies in {scenario.qualifiedCount}/{scenario.totalCombos} ({qualifyPct}%)
                    {scenario.contestedCount > 0 && (
                      <>
                        , tied in {scenario.contestedCount}/{scenario.totalCombos} ({tiedPct}%)
                      </>
                    )}{' '}
                    of the ways the other matches could go.
                  </p>
                  <p className="mt-1 text-sm text-foreground">{scenarioVerdict(scenario)}</p>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </Reveal>
  );
}
