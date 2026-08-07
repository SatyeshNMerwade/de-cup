'use client';

import { useActionState } from 'react';

import { addManualAward, deleteAward, type AwardActionState } from '@/lib/actions/awards.actions';

const initialState: AwardActionState = {};

export function ManageAwards({
  seasonId,
  seasonNumber,
  players,
  existingAwards,
}: {
  seasonId: string;
  seasonNumber: number;
  players: { id: string; displayName: string }[];
  existingAwards: { id: string; name: string; description: string | null; playerName: string }[];
}) {
  const [state, formAction, pending] = useActionState(addManualAward, initialState);

  return (
    <div className="rounded-lg border border-border bg-card p-4 shadow-sm">
      <h2 className="font-serif text-lg font-semibold text-card-foreground">Awards</h2>

      {existingAwards.length > 0 && (
        <ul className="mt-3 flex flex-col gap-2">
          {existingAwards.map((a) => (
            <li key={a.id} className="flex items-center justify-between text-sm">
              <span>
                <span className="font-semibold text-card-foreground">{a.name}</span>
                <span className="text-muted-foreground"> — {a.playerName}</span>
                {a.description && <span className="text-muted-foreground italic"> ({a.description})</span>}
              </span>
              <form action={deleteAward}>
                <input type="hidden" name="awardId" value={a.id} />
                <input type="hidden" name="seasonNumber" value={seasonNumber} />
                <button type="submit" className="text-xs text-destructive underline underline-offset-2">
                  Delete
                </button>
              </form>
            </li>
          ))}
        </ul>
      )}

      <form action={formAction} className="mt-4 flex flex-wrap items-end gap-3 text-sm">
        <input type="hidden" name="seasonId" value={seasonId} />
        <input type="hidden" name="seasonNumber" value={seasonNumber} />

        <div className="flex flex-col gap-1">
          <label className="text-xs text-muted-foreground">Player</label>
          <select name="playerId" required defaultValue="" className="rounded-md border border-border px-2 py-1">
            <option value="" disabled>
              Select…
            </option>
            {players.map((p) => (
              <option key={p.id} value={p.id}>
                {p.displayName}
              </option>
            ))}
          </select>
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-xs text-muted-foreground">Award name</label>
          <input
            name="name"
            required
            placeholder="e.g. Fair Play"
            className="rounded-md border border-border px-2 py-1"
          />
        </div>

        <div className="flex min-w-40 flex-1 flex-col gap-1">
          <label className="text-xs text-muted-foreground">Description (optional)</label>
          <input name="description" className="rounded-md border border-border px-2 py-1" />
        </div>

        <button
          type="submit"
          disabled={pending}
          className="rounded-md bg-primary px-3 py-1.5 text-primary-foreground disabled:opacity-50"
        >
          {pending ? 'Adding…' : 'Add Award'}
        </button>

        {state?.error && <p className="w-full text-sm text-destructive">{state.error}</p>}
      </form>
    </div>
  );
}
