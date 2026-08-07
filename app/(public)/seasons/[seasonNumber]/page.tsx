import { notFound } from 'next/navigation';

import {
  getSeasonByNumber,
  listGroupsBySeason,
  listMatchesBySeason,
  listPlayoffMatchesBySeason,
  listAwardsBySeason,
  getSeasonStandings,
  getQualificationOutlook,
  type StandingsEntryView,
} from '@/lib/services';
import { IplBracket } from '@/components/tournament/ipl-bracket';
import { KnockoutBracket } from '@/components/tournament/knockout-bracket';
import { QualificationPanel } from '@/components/tournament/qualification-panel';
import { PlayoffFormat, TournamentFormat, MatchStage } from '@/types/domain/tournament';

function StandingsTable({ title, entries }: { title: string; entries: StandingsEntryView[] }) {
  return (
    <div className="overflow-x-auto rounded-lg border border-border bg-card shadow-sm">
      <div className="border-b-2 border-primary/20 bg-secondary/40 px-4 py-2 font-serif font-semibold text-card-foreground">
        {title}
      </div>
      <table className="w-full text-sm">
        <thead>
          <tr className="text-left text-xs tracking-wide text-muted-foreground uppercase">
            <th className="px-4 py-2">#</th>
            <th className="px-4 py-2">Player</th>
            <th className="px-4 py-2">P</th>
            <th className="px-4 py-2">W</th>
            <th className="px-4 py-2">L</th>
            <th className="px-4 py-2">Win Margin</th>
            <th className="px-4 py-2">Lose Margin</th>
          </tr>
        </thead>
        <tbody>
          {entries.map((e, i) => (
            <tr key={e.playerId} className={`border-t border-border ${i < 4 ? 'bg-accent/30' : ''}`}>
              <td className="px-4 py-2 font-serif font-bold text-primary">{i + 1}</td>
              <td className="px-4 py-2 font-medium text-card-foreground">
                {e.displayName}
                {e.needsDecider && e.played > 0 && (
                  <span className="ml-2 rounded-full bg-ring/20 px-2 py-0.5 text-xs font-bold text-ring">
                    Decider needed
                  </span>
                )}
              </td>
              <td className="px-4 py-2">{e.played}</td>
              <td className="px-4 py-2">{e.wins}</td>
              <td className="px-4 py-2">{e.losses}</td>
              <td className="px-4 py-2">{e.winMargin}</td>
              <td className="px-4 py-2">{e.loseMargin}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function SectionHeading({ children }: { children: React.ReactNode }) {
  return (
    <div className="mt-12 mb-4 flex items-center gap-3">
      <span className="text-xs font-bold tracking-widest text-ring uppercase">{children}</span>
      <div className="h-px flex-1 bg-border" />
    </div>
  );
}

export default async function SeasonPage({
  params,
}: {
  params: Promise<{ seasonNumber: string }>;
}) {
  const { seasonNumber: seasonNumberParam } = await params;
  const seasonNumber = Number(seasonNumberParam);
  if (!Number.isInteger(seasonNumber)) notFound();

  const season = await getSeasonByNumber(seasonNumber);
  if (!season) notFound();

  const [matches, playoffMatches, awards] = await Promise.all([
    listMatchesBySeason(season.id),
    listPlayoffMatchesBySeason(season.id),
    listAwardsBySeason(season.id),
  ]);
  const tableMatches = matches.filter((m) => m.stage === MatchStage.GROUP || m.stage === MatchStage.LEAGUE);

  const isGroupFormat = season.tournamentFormat === TournamentFormat.GROUP;
  const groups = isGroupFormat ? await listGroupsBySeason(season.id) : [];
  const groupStandings = isGroupFormat
    ? await Promise.all(groups.map((g) => getSeasonStandings(season.id, { groupId: g.id })))
    : [];
  const leagueStandings = isGroupFormat ? null : await getSeasonStandings(season.id);
  const qualificationOutlook = isGroupFormat ? null : await getQualificationOutlook(season.id);

  return (
    <main className="mx-auto max-w-4xl px-6 py-12">
      <h1 className="font-serif text-3xl font-semibold tracking-tight text-foreground">{season.name}</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        {season.tournamentFormat === TournamentFormat.GROUP ? 'Group + Knockout' : 'League + IPL'} · rule set{' '}
        {season.ruleSet.name} v{season.ruleSet.version}
      </p>

      {awards.length > 0 && (
        <div className="mt-6 flex flex-wrap gap-2">
          {awards.map((a) => (
            <span key={a.id} className="rounded-full border border-border bg-card px-3 py-1 text-sm shadow-sm">
              <span className="font-semibold text-card-foreground">{a.name}</span>{' '}
              <span className="text-muted-foreground">— {a.player.displayName}</span>
            </span>
          ))}
        </div>
      )}

      <SectionHeading>{isGroupFormat ? 'Group Stage' : 'League Stage'}</SectionHeading>
      <div className="grid gap-6 sm:grid-cols-1 lg:grid-cols-2">
        {isGroupFormat
          ? groups.map((g, i) => <StandingsTable key={g.id} title={`Group ${g.name}`} entries={groupStandings[i]} />)
          : leagueStandings && <StandingsTable title="League Table" entries={leagueStandings} />}
      </div>

      {qualificationOutlook && (
        <>
          <SectionHeading>Qualification Chances</SectionHeading>
          <QualificationPanel outlook={qualificationOutlook} />
        </>
      )}

      <SectionHeading>Playoffs</SectionHeading>
      {season.playoffFormat === PlayoffFormat.IPL ? (
        <IplBracket matches={playoffMatches} />
      ) : (
        <KnockoutBracket matches={playoffMatches} />
      )}

      <SectionHeading>Fixtures &amp; Results</SectionHeading>
      <div className="flex flex-col divide-y divide-border rounded-lg border border-border bg-card shadow-sm">
        {tableMatches.map((m) => (
          <div key={m.id} className="flex flex-wrap items-center justify-between gap-2 px-4 py-2.5 text-sm">
            <span className="w-24 shrink-0 text-muted-foreground">
              #{m.matchNumber} · {m.stage}
            </span>
            <span className="flex-1 text-center text-card-foreground">
              {m.playerOne.displayName} vs {m.playerTwo.displayName}
            </span>
            <span className="w-48 shrink-0 text-right font-medium">
              {m.winner ? (
                <span className="text-primary">
                  {m.winner.displayName} won{m.winMargin != null ? `, ${m.winMargin} left` : ''}
                </span>
              ) : (
                <span className="text-muted-foreground italic">Scheduled</span>
              )}
            </span>
          </div>
        ))}
      </div>
    </main>
  );
}
