'use client';

import { useActionState } from 'react';

import { createSeason, type SeasonActionState } from '@/lib/actions/seasons.actions';
import { PlayerStatus } from '@/types/domain/player';

const initialState: SeasonActionState = {};

export function CreateSeasonForm({
  suggestedSeasonNumber,
  ruleSets,
  players,
}: {
  suggestedSeasonNumber: number;
  ruleSets: { id: string; name: string; version: number }[];
  players: { id: string; displayName: string; status: string }[];
}) {
  const [state, formAction, pending] = useActionState(createSeason, initialState);

  return (
    <form action={formAction} className="flex flex-col gap-5">
      <div className="flex flex-wrap gap-4">
        <div className="flex flex-col gap-1">
          <label className="text-xs text-muted-foreground">Season number</label>
          <input
            name="seasonNumber"
            type="number"
            min={1}
            required
            defaultValue={suggestedSeasonNumber}
            className="w-28 rounded-md border border-border px-2 py-1"
          />
        </div>
        <div className="flex flex-1 flex-col gap-1">
          <label className="text-xs text-muted-foreground">Name</label>
          <input
            name="name"
            required
            defaultValue={`Season ${suggestedSeasonNumber}`}
            className="rounded-md border border-border px-2 py-1"
          />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-xs text-muted-foreground">Rule set</label>
          <select name="ruleSetId" required defaultValue="" className="rounded-md border border-border px-2 py-1">
            <option value="" disabled>
              Select…
            </option>
            {ruleSets.map((rs) => (
              <option key={rs.id} value={rs.id}>
                {rs.name} v{rs.version}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div>
        <label className="text-xs text-muted-foreground">
          Players (round-robin schedule generated automatically — every pair plays once)
        </label>
        <div className="mt-2 grid grid-cols-2 gap-2 rounded-md border border-border p-3 sm:grid-cols-3">
          {players.map((p) => (
            <label key={p.id} className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                name="playerIds"
                value={p.id}
                defaultChecked={p.status === PlayerStatus.ACTIVE}
              />
              {p.displayName}
              {p.status !== PlayerStatus.ACTIVE && <span className="text-xs text-muted-foreground">(inactive)</span>}
            </label>
          ))}
        </div>
      </div>

      <div className="flex flex-col gap-1">
        <label className="text-xs text-muted-foreground">Description / rules (optional, shown on the public season page)</label>
        <textarea
          name="description"
          rows={5}
          placeholder="One line per rule — each becomes a bullet point on the season page."
          className="rounded-md border border-border px-2 py-1 text-sm"
        />
      </div>

      <button
        type="submit"
        disabled={pending}
        className="self-start rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground disabled:opacity-50"
      >
        {pending ? 'Creating…' : 'Create Season'}
      </button>

      {state?.error && <p className="text-sm text-destructive">{state.error}</p>}
    </form>
  );
}
