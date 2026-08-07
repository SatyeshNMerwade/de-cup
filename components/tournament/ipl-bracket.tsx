import type { PlayoffMatch } from '@/lib/services';
import { MatchStage } from '@/types/domain/tournament';

import {
  AdvanceTag,
  BracketCard,
  ChampionTag,
  EliminatedTag,
  PendingResult,
  RunnerUpTag,
  ThirdPlaceTag,
  matchLoser,
  matchParticipants,
} from './bracket-parts';

/** Qualifier 1 & Eliminator -> Qualifier 2 -> Final, for League + IPL seasons. */
export function IplBracket({ matches }: { matches: PlayoffMatch[] }) {
  const q1 = matches.find((m) => m.stage === MatchStage.QUALIFIER_1);
  const el = matches.find((m) => m.stage === MatchStage.ELIMINATOR);
  const q2 = matches.find((m) => m.stage === MatchStage.QUALIFIER_2);
  const final = matches.find((m) => m.stage === MatchStage.FINAL);

  const q1Loser = q1?.winner ? matchLoser(q1) : null;
  const elLoser = el?.winner ? matchLoser(el) : null;
  const q2Loser = q2?.winner ? matchLoser(q2) : null;
  const finalLoser = final?.winner ? matchLoser(final) : null;

  return (
    <div className="flex flex-col gap-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <BracketCard title="Qualifier 1" subtitle={matchParticipants(q1, 'Top 2 in the league table')}>
          {q1?.winner ? (
            <div className="flex flex-col gap-2">
              <AdvanceTag name={q1.winner.displayName} to="the Final" />
              {q1Loser && <AdvanceTag name={q1Loser.displayName} to="Qualifier 2" />}
            </div>
          ) : (
            <PendingResult />
          )}
        </BracketCard>

        <BracketCard title="Eliminator" subtitle={matchParticipants(el, '3rd vs 4th in the league table')}>
          {el?.winner ? (
            <div className="flex flex-col gap-2">
              <AdvanceTag name={el.winner.displayName} to="Qualifier 2" />
              {elLoser && <EliminatedTag name={elLoser.displayName} />}
            </div>
          ) : (
            <PendingResult />
          )}
        </BracketCard>
      </div>

      <p className="text-center text-xs tracking-wide text-muted-foreground">
        ↓ Loser of Qualifier 1 and winner of the Eliminator meet next ↓
      </p>

      <div className="mx-auto w-full max-w-md">
        <BracketCard title="Qualifier 2" subtitle={matchParticipants(q2, 'Loser Q1 vs Winner Eliminator')}>
          {q2?.winner ? (
            <div className="flex flex-col gap-2">
              <AdvanceTag name={q2.winner.displayName} to="the Final" />
              {q2Loser && <ThirdPlaceTag name={q2Loser.displayName} />}
            </div>
          ) : (
            <PendingResult />
          )}
        </BracketCard>
      </div>

      <div className="mx-auto w-full max-w-md">
        <BracketCard title="Final" subtitle={matchParticipants(final, 'Winner Q1 vs Winner Q2')}>
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
