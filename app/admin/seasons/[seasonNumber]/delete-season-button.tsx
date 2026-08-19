'use client';

import { useActionState } from 'react';

import { deleteSeason, type SeasonActionState } from '@/lib/actions/seasons.actions';

const initialState: SeasonActionState = {};

export function DeleteSeasonButton({ seasonId }: { seasonId: string }) {
  const [state, formAction, pending] = useActionState(deleteSeason, initialState);

  return (
    <form action={formAction} className="flex flex-col items-end gap-1">
      <input type="hidden" name="seasonId" value={seasonId} />
      <button
        type="submit"
        disabled={pending}
        className="text-xs text-destructive underline underline-offset-2 disabled:opacity-50"
      >
        {pending ? 'Deleting…' : 'Delete this season'}
      </button>
      {state?.error && <p className="max-w-64 text-right text-xs text-destructive">{state.error}</p>}
    </form>
  );
}
