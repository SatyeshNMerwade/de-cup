import Link from 'next/link';

import { requireUser } from '@/lib/auth/dal';
import { logout } from '@/app/auth/actions';

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const user = await requireUser();

  return (
    <div className="min-h-screen">
      <header className="flex flex-wrap items-center justify-between gap-y-3 border-b border-border px-6 py-4">
        <div className="flex flex-wrap items-center gap-5">
          <Link href="/admin" className="font-semibold">
            DE Cup Admin
          </Link>
          <Link href="/admin/players" className="text-sm text-muted-foreground hover:text-foreground">
            Players
          </Link>
          <Link href="/admin/seasons/new" className="text-sm text-muted-foreground hover:text-foreground">
            New Season
          </Link>
        </div>
        <div className="flex items-center gap-4 text-sm">
          <span className="text-muted-foreground">{user.displayName}</span>
          <form action={logout}>
            <button type="submit" className="underline underline-offset-4">
              Sign out
            </button>
          </form>
        </div>
      </header>
      <main className="mx-auto max-w-4xl px-6 py-10">{children}</main>
    </div>
  );
}
