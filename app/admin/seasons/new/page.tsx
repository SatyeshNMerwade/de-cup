import { listSeasons, listRuleSets, listPlayers } from '@/lib/services';

import { CreateSeasonForm } from './create-season-form';

export default async function NewSeasonPage() {
  const [seasons, ruleSets, players] = await Promise.all([listSeasons(), listRuleSets(), listPlayers()]);

  const suggestedSeasonNumber = seasons.reduce((max, s) => Math.max(max, s.seasonNumber), 0) + 1;

  return (
    <div>
      <h1 className="text-2xl font-semibold tracking-tight">New Season</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Creates the season, registers the selected players, and generates a full round-robin League schedule.
      </p>

      <div className="mt-6 rounded-lg border border-border bg-card p-5 shadow-sm">
        <CreateSeasonForm
          suggestedSeasonNumber={suggestedSeasonNumber}
          ruleSets={ruleSets.map((rs) => ({ id: rs.id, name: rs.name, version: rs.version }))}
          players={players.map((p) => ({ id: p.id, displayName: p.displayName, status: p.status }))}
        />
      </div>
    </div>
  );
}
