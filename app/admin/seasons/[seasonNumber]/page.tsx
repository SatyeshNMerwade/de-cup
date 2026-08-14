import { notFound } from 'next/navigation';

import { getSeasonByNumber, listMatchesBySeason, listAwardsBySeason, listRegistrationsBySeason } from '@/lib/services';
import { MatchStage, MatchStatus, TournamentState } from '@/types/domain/tournament';

import { RecordMatchForm } from './record-match-form';
import { EditableLeagueMatch } from './edit-match-form';
import { ManageAwards } from './manage-awards';
import { DeleteSeasonButton } from './delete-season-button';
import { AddMatchForm } from './add-match-form';

export default async function AdminSeasonPage({
  params,
}: {
  params: Promise<{ seasonNumber: string }>;
}) {
  const { seasonNumber: seasonNumberParam } = await params;
  const seasonNumber = Number(seasonNumberParam);
  if (!Number.isInteger(seasonNumber)) notFound();

  const season = await getSeasonByNumber(seasonNumber);
  if (!season) notFound();

  const [seasonMatches, seasonAwards, registrations] = await Promise.all([
    listMatchesBySeason(season.id),
    listAwardsBySeason(season.id),
    listRegistrationsBySeason(season.id),
  ]);

  const hasCompletedMatches = seasonMatches.some((m) => m.status === MatchStatus.COMPLETED);
  const leagueMatches = seasonMatches.filter((m) => m.stage === MatchStage.LEAGUE);
  const allLeagueComplete = leagueMatches.length > 0 && leagueMatches.every((m) => m.status === MatchStatus.COMPLETED);

  return (
    <div>
      <div className="flex items-start justify-between gap-4">
        <h1 className="text-2xl font-semibold tracking-tight">{season.name}</h1>
        {!hasCompletedMatches && <DeleteSeasonButton seasonId={season.id} />}
      </div>

      <div className="mt-6 flex flex-col divide-y divide-border rounded-lg border border-border">
        {seasonMatches.map((m) => (
          <div key={m.id} className="flex flex-col gap-2 px-4 py-3">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">
                #{m.matchNumber} · {m.stage}
              </span>
              <span className="font-medium">
                {m.playerOne.displayName} vs {m.playerTwo.displayName}
              </span>
            </div>

            {m.status === MatchStatus.COMPLETED ? (
              m.stage === MatchStage.LEAGUE && !allLeagueComplete ? (
                <EditableLeagueMatch
                  matchId={m.id}
                  seasonNumber={seasonNumber}
                  playerOne={{ id: m.playerOne.id, displayName: m.playerOne.displayName }}
                  playerTwo={{ id: m.playerTwo.id, displayName: m.playerTwo.displayName }}
                  winnerId={m.winnerId as string}
                  winnerName={m.winner?.displayName ?? ''}
                  winMargin={m.winMargin}
                  resultType={m.resultType}
                  remarks={m.remarks}
                  tracksToss={season.tracksTossData}
                  tossWinnerId={m.tossWinnerId}
                  firstBreakerId={m.firstBreakerId}
                />
              ) : (
                <p className="text-sm text-muted-foreground">
                  {m.winner?.displayName} won{m.winMargin != null ? `, ${m.winMargin} left` : ''}
                </p>
              )
            ) : (
              <RecordMatchForm
                matchId={m.id}
                seasonNumber={seasonNumber}
                playerOne={{ id: m.playerOne.id, displayName: m.playerOne.displayName }}
                playerTwo={{ id: m.playerTwo.id, displayName: m.playerTwo.displayName }}
                tracksToss={season.tracksTossData}
              />
            )}
          </div>
        ))}
      </div>

      {season.state !== TournamentState.COMPLETED && (
        <div className="mt-6">
          <AddMatchForm
            seasonId={season.id}
            seasonNumber={seasonNumber}
            players={registrations.map((r) => ({ id: r.player.id, displayName: r.player.displayName }))}
          />
        </div>
      )}

      <div className="mt-6">
        <ManageAwards
          seasonId={season.id}
          seasonNumber={seasonNumber}
          players={registrations.map((r) => ({ id: r.player.id, displayName: r.player.displayName }))}
          existingAwards={seasonAwards.map((a) => ({
            id: a.id,
            name: a.name,
            description: a.description,
            playerName: a.player.displayName,
          }))}
        />
      </div>
    </div>
  );
}
