import Link from 'next/link';

import { listSeasons } from '@/lib/services';
import { SeasonSwitcher } from '@/components/tournament/season-switcher';

export default async function PublicLayout({ children }: { children: React.ReactNode }) {
  const seasons = await listSeasons();

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b-4 border-ring bg-gradient-to-b from-primary to-[#0a3f2e] px-6 py-8 text-center shadow-lg">
        <Link
          href="/"
          className="inline-flex items-center gap-2 font-serif text-4xl font-semibold tracking-tight text-primary-foreground"
        >
          DE <span aria-hidden="true">🎱</span> Cup
        </Link>
      </header>

      <div className="flex items-center justify-center gap-3 border-b border-border bg-background px-6 py-3">
        <span className="text-xs font-bold tracking-widest text-muted-foreground uppercase">Season</span>
        <SeasonSwitcher seasons={seasons.map((s) => ({ seasonNumber: s.seasonNumber, name: s.name }))} />
      </div>

      {children}
    </div>
  );
}
