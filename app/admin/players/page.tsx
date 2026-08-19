import { listPlayers } from '@/lib/services';
import { PlayerStatus } from '@/types/domain/player';

import { CreatePlayerForm } from './create-player-form';
import { PlayerRowActions } from './player-row-actions';

export default async function AdminPlayersPage() {
  const players = await listPlayers();

  return (
    <div>
      <h1 className="text-2xl font-semibold tracking-tight">Players</h1>

      <div className="mt-6 flex flex-col divide-y divide-border rounded-lg border border-border">
        {players.map((p) => (
          <div key={p.id} className="flex items-center justify-between gap-4 px-4 py-3 text-sm">
            <span className="flex items-center gap-2">
              <span className="font-medium">{p.displayName}</span>
              {p.status === PlayerStatus.INACTIVE && (
                <span className="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">Inactive</span>
              )}
            </span>
            <PlayerRowActions playerId={p.id} status={p.status} />
          </div>
        ))}
      </div>

      <div className="mt-6 rounded-lg border border-border bg-card p-4 shadow-sm">
        <h2 className="font-serif text-lg font-semibold text-card-foreground">Add Player</h2>
        <div className="mt-3">
          <CreatePlayerForm />
        </div>
      </div>
    </div>
  );
}
