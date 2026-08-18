'use client';

import { useActionState, useState } from 'react';

import { editMatchResult, type EditMatchResultState } from '@/lib/actions/matches.actions';
import { MatchResultType } from '@/types/domain/tournament';

const initialState: EditMatchResultState = {};

export function EditableLeagueMatch({
  matchId,
  seasonNumber,
  playerOne,
  playerTwo,
  winnerId,
  winnerName,
  winMargin,
  resultType,
  remarks,
  tracksToss,
  tossWinnerId,
  firstBreakerId,
}: {
  matchId: string;
  seasonNumber: number;
  playerOne: { id: string; displayName: string };
  playerTwo: { id: string; displayName: string };
  winnerId: string;
  winnerName: string;
  winMargin: number | null;
  resultType: string | null;
  remarks: string | null;
  tracksToss: boolean;
  tossWinnerId: string | null;
  firstBreakerId: string | null;
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [state, formAction, pending] = useActionState(editMatchResult, initialState);

  // Collapse back to the read view once a save succeeds. Adjusting state
  // during render (not in an effect) on a change of `state` is React's
  // documented pattern for this — see https://react.dev/learn/you-might-not-need-an-effect#adjusting-some-state-when-a-prop-changes.
  const [handledState, setHandledState] = useState(state);
  if (state !== handledState) {
    setHandledState(state);
    if (state?.success && isEditing) setIsEditing(false);
  }

  if (!isEditing) {
    return (
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm text-muted-foreground">
          {winnerName} won{winMargin != null ? `, ${winMargin} left` : ''}
        </p>
        <button
          type="button"
          onClick={() => setIsEditing(true)}
          className="text-xs text-muted-foreground underline underline-offset-2"
        >
          Edit
        </button>
      </div>
    );
  }

  return (
    <form action={formAction} className="flex flex-wrap items-end gap-3 text-sm">
      <input type="hidden" name="matchId" value={matchId} />
      <input type="hidden" name="seasonNumber" value={seasonNumber} />

      <div className="flex flex-col gap-1">
        <label className="text-xs text-muted-foreground">Winner</label>
        <select
          name="winnerId"
          required
          defaultValue={winnerId}
          className="rounded-md border border-border px-2 py-1"
        >
          <option value={playerOne.id}>{playerOne.displayName}</option>
          <option value={playerTwo.id}>{playerTwo.displayName}</option>
        </select>
      </div>

      <div className="flex flex-col gap-1">
        <label className="text-xs text-muted-foreground">Result</label>
        <select
          name="resultType"
          defaultValue={resultType ?? MatchResultType.NORMAL}
          className="rounded-md border border-border px-2 py-1"
        >
          <option value={MatchResultType.NORMAL}>Normal</option>
          <option value={MatchResultType.EIGHT_BALL_FOUL}>8-ball foul</option>
          <option value={MatchResultType.FOUL}>Foul</option>
        </select>
      </div>

      {tracksToss && (
        <>
          <div className="flex flex-col gap-1">
            <label className="text-xs text-muted-foreground">Toss winner</label>
            <select
              name="tossWinnerId"
              required
              defaultValue={tossWinnerId ?? ''}
              className="rounded-md border border-border px-2 py-1"
            >
              <option value="" disabled>
                Select…
              </option>
              <option value={playerOne.id}>{playerOne.displayName}</option>
              <option value={playerTwo.id}>{playerTwo.displayName}</option>
            </select>
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-xs text-muted-foreground">Broke first</label>
            <select
              name="firstBreakerId"
              required
              defaultValue={firstBreakerId ?? ''}
              className="rounded-md border border-border px-2 py-1"
            >
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
          defaultValue={winMargin ?? 0}
          className="w-20 rounded-md border border-border px-2 py-1"
        />
      </div>

      <div className="flex min-w-32 flex-1 flex-col gap-1">
        <label className="text-xs text-muted-foreground">Remarks (optional)</label>
        <input name="remarks" defaultValue={remarks ?? ''} className="rounded-md border border-border px-2 py-1" />
      </div>

      <button
        type="submit"
        disabled={pending}
        className="rounded-md bg-primary px-3 py-1.5 text-primary-foreground disabled:opacity-50"
      >
        {pending ? 'Saving…' : 'Save'}
      </button>
      <button
        type="button"
        onClick={() => setIsEditing(false)}
        className="text-xs text-muted-foreground underline underline-offset-2"
      >
        Cancel
      </button>

      {state?.error && <p className="w-full text-sm text-destructive">{state.error}</p>}
    </form>
  );
}
