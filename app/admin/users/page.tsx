import { requireSuperAdmin } from '@/lib/auth/dal';
import { listUsers } from '@/lib/services';
import { UserRole } from '@/types/domain/user';

import { CreateUserForm } from './create-user-form';
import { UserRowActions } from './user-row-actions';

export default async function AdminUsersPage() {
  const caller = await requireSuperAdmin();
  const users = await listUsers();

  return (
    <div>
      <h1 className="text-2xl font-semibold tracking-tight">Users</h1>

      <div className="mt-6 flex flex-col divide-y divide-border rounded-lg border border-border">
        {users.map((u) => (
          <div key={u.id} className="flex items-center justify-between gap-4 px-4 py-3 text-sm">
            <span className="flex items-center gap-2">
              <span className="font-medium">{u.displayName}</span>
              <span className="text-xs text-muted-foreground">@{u.username}</span>
              {u.role === UserRole.SUPER_ADMIN && (
                <span className="rounded-full bg-ring/20 px-2 py-0.5 text-xs font-semibold text-ring">
                  Super Admin
                </span>
              )}
              {!u.isActive && (
                <span className="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">Inactive</span>
              )}
              {u.id === caller.id && (
                <span className="rounded-full bg-accent px-2 py-0.5 text-xs text-accent-foreground">You</span>
              )}
            </span>
            <UserRowActions userId={u.id} isActive={u.isActive} isSelf={u.id === caller.id} />
          </div>
        ))}
      </div>

      <div className="mt-6 rounded-lg border border-border bg-card p-4 shadow-sm">
        <h2 className="font-serif text-lg font-semibold text-card-foreground">Add User</h2>
        <div className="mt-3">
          <CreateUserForm />
        </div>
      </div>
    </div>
  );
}
