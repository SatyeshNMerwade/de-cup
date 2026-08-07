'use client';

import { usePathname, useRouter } from 'next/navigation';

export function SeasonSwitcher({ seasons }: { seasons: { seasonNumber: number; name: string }[] }) {
  const router = useRouter();
  const pathname = usePathname();

  const seasonMatch = pathname.match(/^\/seasons\/(\d+)/);
  const current = seasonMatch ? seasonMatch[1] : pathname === '/stats' ? 'stats' : '';

  return (
    <select
      value={current}
      onChange={(e) => router.push(e.target.value === 'stats' ? '/stats' : `/seasons/${e.target.value}`)}
      className="rounded-full border border-border bg-card px-4 py-1.5 text-sm font-semibold text-foreground"
    >
      <option value="" disabled>
        Choose a season
      </option>
      {seasons.map((s) => (
        <option key={s.seasonNumber} value={s.seasonNumber}>
          {s.name}
        </option>
      ))}
      <option value="stats">Stats</option>
    </select>
  );
}
