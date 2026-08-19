import Link from 'next/link';

import { listAwardsBySeason, listSeasons } from '@/lib/services';
import { TournamentState } from '@/types/domain/tournament';

const STATE_LABEL: Record<string, string> = {
  [TournamentState.COMPLETED]: 'Completed',
  [TournamentState.ACTIVE]: 'In progress',
  [TournamentState.DRAFT]: 'Draft',
  [TournamentState.ARCHIVED]: 'Archived',
};

export default async function HomePage() {
  const seasons = await listSeasons();

  const latestSeason = seasons[seasons.length - 1];
  const readyForNextSeason = latestSeason?.state === TournamentState.COMPLETED;
  const latestChampion = readyForNextSeason
    ? (await listAwardsBySeason(latestSeason.id)).find((a) => a.name === 'Champion')?.player.displayName
    : undefined;

  return (
    <main className="mx-auto max-w-3xl px-6 py-12">
      <p className="text-center font-serif text-lg italic text-muted-foreground">Seasons, standings, and results.</p>

      {readyForNextSeason && (
        <div className="mt-6 rounded-lg border border-ring/40 bg-linear-to-r from-secondary to-accent px-5 py-4 text-center shadow-sm">
          <p className="font-serif text-lg font-semibold text-foreground">
            {latestChampion
              ? `${latestSeason.name} is in the books — congratulations, ${latestChampion}! 🏆`
              : `${latestSeason.name} is in the books!`}
          </p>
          <p className="mt-1 text-sm text-muted-foreground">
            The table&apos;s chalked and racked — who&apos;s ready to challenge for Season {latestSeason.seasonNumber + 1}?
          </p>
        </div>
      )}

      <ul className="mt-8 flex flex-col gap-3">
        {seasons.map((season) => (
          <li key={season.id}>
            <Link
              href={`/seasons/${season.seasonNumber}`}
              className="flex items-center justify-between rounded-lg border border-border bg-card px-5 py-4 shadow-sm transition-colors hover:bg-accent"
            >
              <span className="font-serif text-lg font-semibold text-card-foreground">{season.name}</span>
              <span className="flex items-center gap-2 text-sm text-muted-foreground">
                <span>
                  {season.tournamentFormat === 'GROUP' ? 'Group + Knockout' : 'League + IPL'}
                </span>
                <span
                  className={`rounded-full px-2.5 py-0.5 text-xs font-bold uppercase tracking-wide ${
                    season.state === TournamentState.ACTIVE
                      ? 'bg-primary/15 text-primary'
                      : 'bg-muted text-muted-foreground'
                  }`}
                >
                  {STATE_LABEL[season.state] ?? season.state}
                </span>
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </main>
  );
}
