'use client';

import { useActionState, useState } from 'react';

import {
  deactivateUser,
  deleteUser,
  reactivateUser,
  resetUserPassword,
  type UserActionState,
} from '@/lib/actions/users.actions';

const initialState: UserActionState = {};

export function UserRowActions({
  userId,
  isActive,
  isSelf,
}: {
  userId: string;
  isActive: boolean;
  isSelf: boolean;
}) {
  const [isResetting, setIsResetting] = useState(false);
  const [deleteState, deleteAction, deletePending] = useActionState(deleteUser, initialState);
  const [resetState, resetAction, resetPending] = useActionState(resetUserPassword, initialState);

  const [handledResetState, setHandledResetState] = useState(resetState);
  if (resetState !== handledResetState) {
    setHandledResetState(resetState);
    if (resetState?.success && isResetting) setIsResetting(false);
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <div className="flex items-center gap-3 text-xs">
        <button
          type="button"
          onClick={() => setIsResetting((v) => !v)}
          className="text-muted-foreground underline underline-offset-2"
        >
          {isResetting ? 'Cancel' : 'Reset password'}
        </button>

        {!isSelf &&
          (isActive ? (
            <form action={deactivateUser}>
              <input type="hidden" name="userId" value={userId} />
              <button type="submit" className="text-muted-foreground underline underline-offset-2">
                Deactivate
              </button>
            </form>
          ) : (
            <form action={reactivateUser}>
              <input type="hidden" name="userId" value={userId} />
              <button type="submit" className="text-primary underline underline-offset-2">
                Reactivate
              </button>
            </form>
          ))}

        {!isSelf && (
          <form action={deleteAction}>
            <input type="hidden" name="userId" value={userId} />
            <button type="submit" disabled={deletePending} className="text-destructive underline underline-offset-2">
              Delete
            </button>
          </form>
        )}
      </div>

      {isResetting && (
        <form action={resetAction} className="flex items-end gap-2">
          <input type="hidden" name="userId" value={userId} />
          <input
            type="password"
            name="password"
            placeholder="New password"
            required
            minLength={8}
            className="rounded-md border border-border px-2 py-1 text-xs"
          />
          <button
            type="submit"
            disabled={resetPending}
            className="rounded-md bg-primary px-2 py-1 text-xs text-primary-foreground disabled:opacity-50"
          >
            {resetPending ? 'Saving…' : 'Save'}
          </button>
        </form>
      )}

      {deleteState?.error && <p className="max-w-56 text-right text-xs text-destructive">{deleteState.error}</p>}
      {resetState?.error && <p className="max-w-56 text-right text-xs text-destructive">{resetState.error}</p>}
    </div>
  );
}
