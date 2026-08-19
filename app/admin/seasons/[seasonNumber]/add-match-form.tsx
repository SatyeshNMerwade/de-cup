'use client';

import { useActionState } from 'react';

import { createCustomMatch, type CreateCustomMatchState } from '@/lib/actions/matches.actions';
import { formatStageLabel } from '@/lib/helpers/format.helper';
import { MatchStage } from '@/types/domain/tournament';

const initialState: CreateCustomMatchState = {};

const STAGE_OPTIONS = [
  MatchStage.LEAGUE,
  MatchStage.QUALIFIER_1,
  MatchStage.ELIMINATOR,
  MatchStage.QUALIFIER_2,
  MatchStage.SEMI_FINAL,
  MatchStage.THIRD_PLACE,
  MatchStage.FINAL,
];

export function AddMatchForm({
  seasonId,
  seasonNumber,
  players,
}: {
  seasonId: string;
  seasonNumber: number;
  players: { id: string; displayName: string }[];
}) {
  const [state, formAction, pending] = useActionState(createCustomMatch, initialState);

  return (
    <div className="rounded-lg border border-border bg-card p-4 shadow-sm">
      <h2 className="font-serif text-lg font-semibold text-card-foreground">Add a match</h2>
      <p className="mt-1 text-xs text-muted-foreground">
        For a decider between two players tied for a qualification spot (pick League), or any other manual override.
      </p>

      <form action={formAction} className="mt-3 flex flex-wrap items-end gap-3 text-sm">
        <input type="hidden" name="seasonId" value={seasonId} />
        <input type="hidden" name="seasonNumber" value={seasonNumber} />

        <div className="flex flex-col gap-1">
          <label className="text-xs text-muted-foreground">Player one</label>
          <select
            name="playerOneId"
            required
            defaultValue=""
            className="rounded-md border border-border px-2 py-1"
          >
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
          <label className="text-xs text-muted-foreground">Player two</label>
          <select
            name="playerTwoId"
            required
            defaultValue=""
            className="rounded-md border border-border px-2 py-1"
          >
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
          <label className="text-xs text-muted-foreground">Stage</label>
          <select name="stage" defaultValue={MatchStage.LEAGUE} className="rounded-md border border-border px-2 py-1">
            {STAGE_OPTIONS.map((s) => (
              <option key={s} value={s}>
                {formatStageLabel(s)}
              </option>
            ))}
          </select>
        </div>

        <button
          type="submit"
          disabled={pending}
          className="rounded-md bg-primary px-3 py-1.5 text-primary-foreground disabled:opacity-50"
        >
          {pending ? 'Adding…' : 'Add Match'}
        </button>

        {state?.error && <p className="w-full text-sm text-destructive">{state.error}</p>}
      </form>
    </div>
  );
}
