import type { PlayoffMatch } from '@/lib/services';

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
    <div className="rounded-lg border border-border bg-card p-4 shadow-sm">
      <h3 className="font-serif text-lg font-semibold text-card-foreground">{title}</h3>
      {subtitle && <p className="mt-0.5 text-sm text-muted-foreground">{subtitle}</p>}
      <div className="mt-3">{children}</div>
    </div>
  );
}

export function PendingResult({ label = 'To be decided' }: { label?: string }) {
  return <p className="text-sm text-muted-foreground italic">{label}</p>;
}

export function ChampionTag({ name }: { name: string }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-primary/30 bg-gradient-to-br from-secondary to-accent px-4 py-1.5 font-serif text-xl font-bold text-destructive">
      🏆 {name}
      <span className="ml-1 text-xs font-sans font-bold tracking-wide text-muted-foreground uppercase">Champion</span>
    </span>
  );
}

export function RunnerUpTag({ name }: { name: string }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-muted px-3 py-1 font-serif text-base font-bold text-foreground/80">
      🥈 {name}
      <span className="ml-1 text-xs font-sans font-bold tracking-wide text-muted-foreground uppercase">Runner-up</span>
    </span>
  );
}

export function ThirdPlaceTag({ name }: { name: string }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-muted px-3 py-1 text-sm font-bold text-foreground/70">
      🥉 {name}
      <span className="ml-1 text-xs font-sans font-bold tracking-wide text-muted-foreground uppercase">Third place</span>
    </span>
  );
}

export function AdvanceTag({ name, to }: { name: string; to: string }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-primary/30 bg-accent px-3 py-1 text-sm font-semibold text-accent-foreground">
      <span className="text-primary">→</span> {name} advances to {to}
    </span>
  );
}

export function EliminatedTag({ name }: { name: string }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-destructive/30 bg-destructive/10 px-3 py-1 text-sm font-semibold text-destructive">
      {name} eliminated
    </span>
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
