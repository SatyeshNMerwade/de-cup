import { notFound } from 'next/navigation';

import {
  getSeasonByNumber,
  getPreviousSeasonChampion,
  listGroupsBySeason,
  listMatchesBySeason,
  listPlayoffMatchesBySeason,
  listAwardsBySeason,
  getSeasonStandings,
  getQualificationDisplay,
} from '@/lib/services';
import { ChampionBanner } from '@/components/tournament/champion-banner';
import { IplBracket } from '@/components/tournament/ipl-bracket';
import { KnockoutBracket } from '@/components/tournament/knockout-bracket';
import { QualificationPanel } from '@/components/tournament/qualification-panel';
import { QualificationScenario } from '@/components/tournament/qualification-scenario';
import { SeasonAwards } from '@/components/tournament/season-awards';
import { PlayoffFormat, TournamentFormat, MatchStage, TournamentState, MatchResultType } from '@/types/domain/tournament';

import { StandingsTable } from './standings-table';

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

  const isActive = season.state === TournamentState.ACTIVE;

  const [matches, playoffMatches, awards, previousChampion] = await Promise.all([
    listMatchesBySeason(season.id),
    listPlayoffMatchesBySeason(season.id),
    listAwardsBySeason(season.id),
    isActive ? getPreviousSeasonChampion(season.seasonNumber) : Promise.resolve(null),
  ]);
  const tableMatches = matches.filter((m) => m.stage === MatchStage.GROUP || m.stage === MatchStage.LEAGUE);

  const isGroupFormat = season.tournamentFormat === TournamentFormat.GROUP;
  const groups = isGroupFormat ? await listGroupsBySeason(season.id) : [];
  const groupStandings = isGroupFormat
    ? await Promise.all(groups.map((g) => getSeasonStandings(season.id, { groupId: g.id })))
    : [];
  const leagueStandings = isGroupFormat ? null : await getSeasonStandings(season.id);
  const qualificationDisplay = isGroupFormat ? null : await getQualificationDisplay(season.id);
  const qualificationRules = season.ruleSet.rules.qualification;

  const showPercentage =
    qualificationDisplay != null &&
    qualificationRules.enableQualificationPercentage &&
    !(!qualificationDisplay.percentage.available && qualificationDisplay.percentage.reason === 'not-applicable');
  const showScenario =
    qualificationDisplay != null &&
    qualificationRules.enableQualificationScenario &&
    !(!qualificationDisplay.scenario.available && qualificationDisplay.scenario.reason === 'not-applicable');

  return (
    <main className="mx-auto max-w-4xl px-6 py-12">
      <h1 className="font-serif text-3xl font-semibold tracking-tight text-foreground">{season.name}</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        {season.tournamentFormat === TournamentFormat.GROUP ? 'Group + Knockout' : 'League + IPL'} · rule set{' '}
        {season.ruleSet.name} v{season.ruleSet.version}
      </p>

      <SeasonAwards awards={awards} />

      {previousChampion && <ChampionBanner name={previousChampion} />}

      {season.description && (
        <>
          <SectionHeading>Rules &amp; Scheduling</SectionHeading>
          <ul className="list-disc space-y-1.5 pl-5 text-sm text-card-foreground">
            {season.description
              .split('\n')
              .map((line) => line.trim())
              .filter(Boolean)
              .map((line, i) => (
                <li key={i}>{line}</li>
              ))}
          </ul>
        </>
      )}

      <SectionHeading>{isGroupFormat ? 'Group Stage' : 'League Stage'}</SectionHeading>
      {isGroupFormat ? (
        <div className="flex flex-col gap-6">
          {groups.map((g, i) => (
            <StandingsTable
              key={g.id}
              title={`Group ${g.name}`}
              entries={groupStandings[i]}
              seasonNumber={season.seasonNumber}
            />
          ))}
        </div>
      ) : (
        leagueStandings && (
          <StandingsTable title="League Table" entries={leagueStandings} seasonNumber={season.seasonNumber} />
        )
      )}

      {showPercentage && qualificationDisplay && (
        <>
          <SectionHeading>Qualification Percentage</SectionHeading>
          <QualificationPanel
            display={qualificationDisplay.percentage}
            qualificationSlots={qualificationRules.qualificationSlots}
          />
        </>
      )}

      {showScenario && qualificationDisplay && (
        <>
          <SectionHeading>Qualification Scenario</SectionHeading>
          <QualificationScenario
            display={qualificationDisplay.scenario}
            qualificationSlots={qualificationRules.qualificationSlots}
          />
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
                <>
                  <span className="text-primary">
                    {m.winner.displayName} won{m.winMargin != null ? `, ${m.winMargin} left` : ''}
                  </span>
                  {m.resultType === MatchResultType.EIGHT_BALL_FOUL && (
                    <span className="block text-xs font-normal text-muted-foreground italic">🎱 8-Ball Mistake</span>
                  )}
                  {m.resultType === MatchResultType.FOUL && (
                    <span className="block text-xs font-normal text-muted-foreground italic">⚠️ Foul</span>
                  )}
                </>
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
