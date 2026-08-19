import type { PlayoffMatch } from '@/lib/services';
import { MatchStage } from '@/types/domain/tournament';

import { AdvanceTag, BracketCard, PendingResult, matchLoser, matchParticipants } from './bracket-parts';
import { ChampionTag, RunnerUpTag, ThirdPlaceTag } from './award-tags';

/** Semifinal x2 -> Third Place + Final, for Group + Knockout seasons. */
export function KnockoutBracket({ matches }: { matches: PlayoffMatch[] }) {
  const semis = matches.filter((m) => m.stage === MatchStage.SEMI_FINAL);
  const [sf1, sf2] = semis;
  const thirdPlace = matches.find((m) => m.stage === MatchStage.THIRD_PLACE);
  const final = matches.find((m) => m.stage === MatchStage.FINAL);

  const finalLoser = final?.winner ? matchLoser(final) : null;

  return (
    <div className="flex flex-col gap-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <BracketCard title="Semifinal 1" subtitle={matchParticipants(sf1, 'Group A #1 vs Group B #2')}>
          {sf1?.winner ? <AdvanceTag name={sf1.winner.displayName} to="the Final" /> : <PendingResult />}
        </BracketCard>

        <BracketCard title="Semifinal 2" subtitle={matchParticipants(sf2, 'Group B #1 vs Group A #2')}>
          {sf2?.winner ? <AdvanceTag name={sf2.winner.displayName} to="the Final" /> : <PendingResult />}
        </BracketCard>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <BracketCard title="Third Place" subtitle={matchParticipants(thirdPlace, 'Semifinal losers')}>
          {thirdPlace?.winner ? <ThirdPlaceTag name={thirdPlace.winner.displayName} /> : <PendingResult />}
        </BracketCard>

        <BracketCard title="Final" subtitle={matchParticipants(final, 'Winner SF1 vs Winner SF2')}>
          {final?.winner ? (
            <div className="flex flex-col gap-2">
              <ChampionTag name={final.winner.displayName} />
              {finalLoser && <RunnerUpTag name={finalLoser.displayName} />}
            </div>
          ) : (
            <PendingResult />
          )}
        </BracketCard>
      </div>
    </div>
  );
}
