'use client';

import { useActionState } from 'react';

import { createUser, type UserActionState } from '@/lib/actions/users.actions';
import { UserRole } from '@/types/domain/user';

const initialState: UserActionState = {};

export function CreateUserForm() {
  const [state, formAction, pending] = useActionState(createUser, initialState);

  return (
    <form action={formAction} className="flex flex-wrap items-end gap-3 text-sm">
      <div className="flex flex-col gap-1">
        <label className="text-xs text-muted-foreground">Username</label>
        <input name="username" required className="rounded-md border border-border px-2 py-1" />
      </div>
      <div className="flex flex-col gap-1">
        <label className="text-xs text-muted-foreground">Display name</label>
        <input name="displayName" required className="rounded-md border border-border px-2 py-1" />
      </div>
      <div className="flex flex-col gap-1">
        <label className="text-xs text-muted-foreground">Password</label>
        <input
          name="password"
          type="password"
          required
          minLength={8}
          className="rounded-md border border-border px-2 py-1"
        />
      </div>
      <div className="flex flex-col gap-1">
        <label className="text-xs text-muted-foreground">Role</label>
        <select name="role" defaultValue={UserRole.ADMIN} className="rounded-md border border-border px-2 py-1">
          <option value={UserRole.ADMIN}>Admin</option>
          <option value={UserRole.SUPER_ADMIN}>Super Admin</option>
        </select>
      </div>
      <button
        type="submit"
        disabled={pending}
        className="rounded-md bg-primary px-3 py-1.5 text-primary-foreground disabled:opacity-50"
      >
        {pending ? 'Adding…' : 'Add User'}
      </button>
      {state?.error && <p className="w-full text-sm text-destructive">{state.error}</p>}
    </form>
  );
}
