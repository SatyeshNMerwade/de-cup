'use client';

import { motion, useReducedMotion } from 'motion/react';

function AwardTagEntrance({ children }: { children: React.ReactNode }) {
  const reduceMotion = useReducedMotion();
  return (
    <motion.span
      initial={reduceMotion ? undefined : { opacity: 0, scale: 0.85 }}
      animate={reduceMotion ? undefined : { opacity: 1, scale: 1 }}
      transition={{ duration: 0.3, ease: 'easeOut' }}
      className="inline-block"
      suppressHydrationWarning
    >
      {children}
    </motion.span>
  );
}

export function ChampionTag({ name }: { name: string }) {
  return (
    <AwardTagEntrance>
      <span className="inline-flex items-center gap-1.5 rounded-full border border-primary/30 bg-linear-to-br from-secondary to-accent px-4 py-1.5 font-serif text-xl font-bold text-destructive">
        🏆 {name}
        <span className="ml-1 text-xs font-sans font-bold tracking-wide text-muted-foreground uppercase">Champion</span>
      </span>
    </AwardTagEntrance>
  );
}

export function RunnerUpTag({ name }: { name: string }) {
  return (
    <AwardTagEntrance>
      <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-muted px-3 py-1 font-serif text-base font-bold text-foreground/80">
        🥈 {name}
        <span className="ml-1 text-xs font-sans font-bold tracking-wide text-muted-foreground uppercase">Runner-up</span>
      </span>
    </AwardTagEntrance>
  );
}

export function ThirdPlaceTag({ name }: { name: string }) {
  return (
    <AwardTagEntrance>
      <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-muted px-3 py-1 text-sm font-bold text-foreground/70">
        🥉 {name}
        <span className="ml-1 text-xs font-sans font-bold tracking-wide text-muted-foreground uppercase">Third place</span>
      </span>
    </AwardTagEntrance>
  );
}
