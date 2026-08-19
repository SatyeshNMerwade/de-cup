'use client';

import { useActionState } from 'react';

import { recordMatchResult, type RecordMatchResultState } from '@/lib/actions/matches.actions';
import { MatchResultType } from '@/types/domain/tournament';

const initialState: RecordMatchResultState = {};

export function RecordMatchForm({
  matchId,
  seasonNumber,
  playerOne,
  playerTwo,
  tracksToss,
}: {
  matchId: string;
  seasonNumber: number;
  playerOne: { id: string; displayName: string };
  playerTwo: { id: string; displayName: string };
  tracksToss: boolean;
}) {
  const [state, formAction, pending] = useActionState(recordMatchResult, initialState);

  return (
    <form action={formAction} className="flex flex-wrap items-end gap-3 text-sm">
      <input type="hidden" name="matchId" value={matchId} />
      <input type="hidden" name="seasonNumber" value={seasonNumber} />

      <div className="flex flex-col gap-1">
        <label className="text-xs text-muted-foreground">Winner</label>
        <select name="winnerId" required defaultValue="" className="rounded-md border border-border px-2 py-1">
          <option value="" disabled>
            Select…
          </option>
          <option value={playerOne.id}>{playerOne.displayName}</option>
          <option value={playerTwo.id}>{playerTwo.displayName}</option>
        </select>
      </div>

      <div className="flex flex-col gap-1">
        <label className="text-xs text-muted-foreground">Result</label>
        <select name="resultType" defaultValue={MatchResultType.NORMAL} className="rounded-md border border-border px-2 py-1">
          <option value={MatchResultType.NORMAL}>Normal</option>
          <option value={MatchResultType.EIGHT_BALL_FOUL}>8-ball foul</option>
          <option value={MatchResultType.FOUL}>Foul</option>
        </select>
      </div>

      {tracksToss && (
        <>
          <div className="flex flex-col gap-1">
            <label className="text-xs text-muted-foreground">Toss winner</label>
            <select name="tossWinnerId" required defaultValue="" className="rounded-md border border-border px-2 py-1">
              <option value="" disabled>
                Select…
              </option>
              <option value={playerOne.id}>{playerOne.displayName}</option>
              <option value={playerTwo.id}>{playerTwo.displayName}</option>
            </select>
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-xs text-muted-foreground">Broke first</label>
            <select name="firstBreakerId" required defaultValue="" className="rounded-md border border-border px-2 py-1">
              <option value="" disabled>
                Select…
              </option>
              <option value={playerOne.id}>{playerOne.displayName}</option>
              <option value={playerTwo.id}>{playerTwo.displayName}</option>
            </select>
          </div>
        </>
      )}

      <div className="flex flex-col gap-1">
        <label className="text-xs text-muted-foreground">Balls left</label>
        <input
          name="ballsLeft"
          type="number"
          min={0}
          required
          defaultValue={0}
          className="w-20 rounded-md border border-border px-2 py-1"
        />
      </div>

      <div className="flex min-w-32 flex-1 flex-col gap-1">
        <label className="text-xs text-muted-foreground">Remarks (optional)</label>
        <input
          name="remarks"
          placeholder="e.g. how the foul happened, or any other note"
          className="rounded-md border border-border px-2 py-1"
        />
      </div>

      <button
        type="submit"
        disabled={pending}
        className="rounded-md bg-primary px-3 py-1.5 text-primary-foreground disabled:opacity-50"
      >
        {pending ? 'Saving…' : 'Save'}
      </button>

      {state?.error && <p className="w-full text-sm text-destructive">{state.error}</p>}
      {state?.info && <p className="w-full text-sm text-muted-foreground">{state.info}</p>}
    </form>
  );
}
