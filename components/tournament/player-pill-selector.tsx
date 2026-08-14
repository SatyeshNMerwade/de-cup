'use client';

export function PlayerPillSelector({
  players,
  selectedId,
  onSelect,
}: {
  players: { playerId: string; displayName: string }[];
  selectedId: string;
  onSelect: (playerId: string) => void;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {players.map((p) => (
        <button
          key={p.playerId}
          type="button"
          onClick={() => onSelect(p.playerId)}
          className={`rounded-full px-3 py-1 text-sm font-semibold transition-colors ${
            p.playerId === selectedId
              ? 'bg-primary text-primary-foreground'
              : 'bg-muted text-muted-foreground hover:bg-accent hover:text-accent-foreground'
          }`}
        >
          {p.displayName}
        </button>
      ))}
    </div>
  );
}
