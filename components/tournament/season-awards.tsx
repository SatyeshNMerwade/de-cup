'use client';

import { ChampionTag, RunnerUpTag, ThirdPlaceTag } from './award-tags';
import { Confetti } from './confetti';
import { PopIn } from './reveal';

export interface SeasonAwardView {
  id: string;
  name: string;
  player: { displayName: string };
}

/**
 * The podium awards (Champion/Runner-Up/Third Place) get the same fancy
 * tag treatment already used on the Final bracket card, plus a confetti
 * burst — everything else (Fair Play, other manual awards) stays a plain
 * pill, since only the podium result is the "exciting" moment here.
 */
export function SeasonAwards({ awards }: { awards: SeasonAwardView[] }) {
  if (awards.length === 0) return null;

  const champion = awards.find((a) => a.name === 'Champion');
  const runnerUp = awards.find((a) => a.name === 'Runner-Up');
  const thirdPlace = awards.find((a) => a.name === 'Third Place');
  const others = awards.filter((a) => a !== champion && a !== runnerUp && a !== thirdPlace);

  return (
    <div className="mt-6 flex flex-col items-center gap-3">
      {champion && <Confetti />}
      <div className="flex flex-wrap items-center justify-center gap-3">
        {champion && <ChampionTag name={champion.player.displayName} />}
        {runnerUp && <RunnerUpTag name={runnerUp.player.displayName} />}
        {thirdPlace && <ThirdPlaceTag name={thirdPlace.player.displayName} />}
      </div>
      {others.length > 0 && (
        <div className="flex flex-wrap justify-center gap-2">
          {others.map((a) => (
            <PopIn key={a.id}>
              <span className="rounded-full border border-border bg-card px-3 py-1 text-sm shadow-sm">
                <span className="font-semibold text-card-foreground">{a.name}</span>{' '}
                <span className="text-muted-foreground">: {a.player.displayName}</span>
              </span>
            </PopIn>
          ))}
        </div>
      )}
    </div>
  );
}
