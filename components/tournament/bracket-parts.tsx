import type { PlayoffMatch } from '@/lib/services';

import { PopIn, Reveal } from './reveal';

export function BracketCard({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  return (
    <Reveal className="rounded-lg border border-border bg-card p-4 shadow-sm transition-shadow hover:shadow-md">
      <h3 className="font-serif text-lg font-semibold text-card-foreground">{title}</h3>
      {subtitle && <p className="mt-0.5 text-sm text-muted-foreground">{subtitle}</p>}
      <div className="mt-3">{children}</div>
    </Reveal>
  );
}

export function PendingResult({ label = 'To be decided' }: { label?: string }) {
  return <p className="text-sm text-muted-foreground italic">{label}</p>;
}

export function AdvanceTag({ name, to }: { name: string; to: string }) {
  return (
    <PopIn>
      <span className="inline-flex items-center gap-1.5 rounded-full border border-primary/30 bg-accent px-3 py-1 text-sm font-semibold text-accent-foreground">
        <span className="text-primary">→</span> {name} advances to {to}
      </span>
    </PopIn>
  );
}

export function EliminatedTag({ name }: { name: string }) {
  return (
    <PopIn>
      <span className="inline-flex items-center gap-1.5 rounded-full border border-destructive/30 bg-destructive/10 px-3 py-1 text-sm font-semibold text-destructive">
        {name} eliminated
      </span>
    </PopIn>
  );
}

export function matchParticipants(match: PlayoffMatch | undefined, fallback: string) {
  if (!match) return fallback;
  return `${match.playerOne.displayName} vs ${match.playerTwo.displayName}`;
}

export function matchLoser(match: PlayoffMatch) {
  if (!match.winner) return null;
  return match.winner.id === match.playerOne.id ? match.playerTwo : match.playerOne;
}
