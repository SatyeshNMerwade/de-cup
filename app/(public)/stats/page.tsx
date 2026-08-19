import { getStatsPageData } from '@/lib/services';
import { StatsTabs } from '@/components/tournament/stats-tabs';

export default async function StatsPage() {
  const data = await getStatsPageData();

  return (
    <main className="mx-auto max-w-4xl px-6 py-12">
      <h1 className="font-serif text-3xl font-semibold tracking-tight text-foreground">Career Stats</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Every number below is pulled from matches actually completed so far, across every season.
      </p>

      <div className="mt-8">
        {data ? (
          <StatsTabs data={data} />
        ) : (
          <p className="text-muted-foreground italic">No completed matches yet.</p>
        )}
      </div>
    </main>
  );
}
