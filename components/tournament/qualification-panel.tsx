'use client';

import { useState } from 'react';

import type { QualificationPercentageDisplay } from '@/lib/services';

import { PlayerPillSelector } from './player-pill-selector';
import { QualificationSummary } from './qualification-summary';

export function QualificationPanel({
  display,
  qualificationSlots,
}: {
  display: QualificationPercentageDisplay;
  qualificationSlots: number;
}) {
  const [selectedId, setSelectedId] = useState<string>('');

  if (!display.available && display.reason === 'not-applicable') return null;

  if (!display.available) {
    return (
      <div className="rounded-lg border border-border bg-card p-5 shadow-sm">
        <p className="text-sm text-muted-foreground">
          {display.opensAtMatchNumber != null
            ? `Opens once Match ${display.opensAtMatchNumber} is complete.`
            : 'Opens once enough matches are played.'}
        </p>
      </div>
    );
  }

  const outlook = display.outlook;
  const selected = outlook.find((o) => o.playerId === selectedId) ?? outlook[0];
  if (!selected) return null;

  return (
    <div className="rounded-lg border border-border bg-card p-5 shadow-sm">
      <PlayerPillSelector players={outlook} selectedId={selected.playerId} onSelect={setSelectedId} />
      <div className="mt-5">
        <QualificationSummary data={selected} qualificationSlots={qualificationSlots} />
      </div>
    </div>
  );
}
