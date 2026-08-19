'use client';

import { useActionState } from 'react';

import { createPlayer, type PlayerActionState } from '@/lib/actions/players.actions';

const initialState: PlayerActionState = {};

export function CreatePlayerForm() {
  const [state, formAction, pending] = useActionState(createPlayer, initialState);

  return (
    <form action={formAction} className="flex flex-wrap items-end gap-3 text-sm">
      <div className="flex flex-col gap-1">
        <label className="text-xs text-muted-foreground">Name</label>
        <input name="displayName" required className="rounded-md border border-border px-2 py-1" />
      </div>
      <div className="flex flex-col gap-1">
        <label className="text-xs text-muted-foreground">Short name (optional)</label>
        <input name="shortName" className="rounded-md border border-border px-2 py-1" />
      </div>
      <button
        type="submit"
        disabled={pending}
        className="rounded-md bg-primary px-3 py-1.5 text-primary-foreground disabled:opacity-50"
      >
        {pending ? 'Adding…' : 'Add Player'}
      </button>
      {state?.error && <p className="w-full text-sm text-destructive">{state.error}</p>}
    </form>
  );
}
