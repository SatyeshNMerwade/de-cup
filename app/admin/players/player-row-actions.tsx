'use client';

import { useActionState } from 'react';

import { deactivatePlayer, deletePlayer, reactivatePlayer, type PlayerActionState } from '@/lib/actions/players.actions';
import { PlayerStatus } from '@/types/domain/player';

const initialState: PlayerActionState = {};

export function PlayerRowActions({ playerId, status }: { playerId: string; status: string }) {
  const [deleteState, deleteAction, deletePending] = useActionState(deletePlayer, initialState);

  return (
    <div className="flex flex-col items-end gap-1">
      <div className="flex items-center gap-3 text-xs">
        {status === PlayerStatus.ACTIVE ? (
          <form action={deactivatePlayer}>
            <input type="hidden" name="playerId" value={playerId} />
            <button type="submit" className="text-muted-foreground underline underline-offset-2">
              Deactivate
            </button>
          </form>
        ) : (
          <form action={reactivatePlayer}>
            <input type="hidden" name="playerId" value={playerId} />
            <button type="submit" className="text-primary underline underline-offset-2">
              Reactivate
            </button>
          </form>
        )}

        <form action={deleteAction}>
          <input type="hidden" name="playerId" value={playerId} />
          <button type="submit" disabled={deletePending} className="text-destructive underline underline-offset-2">
            Delete
          </button>
        </form>
      </div>
      {deleteState?.error && <p className="max-w-56 text-right text-xs text-destructive">{deleteState.error}</p>}
    </div>
  );
}
