import Link from 'next/link';

import { listSeasons, listMatchesBySeason } from '@/lib/services';
import { MatchStatus } from '@/types/domain/tournament';

export default async function AdminDashboardPage() {
  const seasons = await listSeasons();
  const withCounts = await Promise.all(
    seasons.map(async (season) => {
      const seasonMatches = await listMatchesBySeason(season.id);
      const pending = seasonMatches.filter((m) => m.status === MatchStatus.SCHEDULED).length;
      return { season, total: seasonMatches.length, pending };
    }),
  );

  return (
    <div>
      <h1 className="text-2xl font-semibold tracking-tight">Seasons</h1>
      <ul className="mt-6 flex flex-col gap-3">
        {withCounts.map(({ season, total, pending }) => (
          <li key={season.id}>
            <Link
              href={`/admin/seasons/${season.seasonNumber}`}
              className="flex items-center justify-between rounded-lg border border-border px-4 py-3 hover:bg-muted"
            >
              <span className="font-medium">{season.name}</span>
              <span className="text-sm text-muted-foreground">
                {pending > 0 ? `${pending} match${pending === 1 ? '' : 'es'} to record` : `${total} matches, all recorded`}
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
