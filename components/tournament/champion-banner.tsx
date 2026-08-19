'use client';

import { Confetti } from './confetti';

export function ChampionBanner({ name }: { name: string }) {
  return (
    <div className="mt-6 flex justify-center">
      <Confetti />
      <p className="rounded-full border border-ring/40 bg-linear-to-r from-secondary to-accent px-6 py-2.5 font-serif text-lg font-bold text-destructive shadow-sm">
        🏆 {name} is the defending champion! 🏆
      </p>
    </div>
  );
}
