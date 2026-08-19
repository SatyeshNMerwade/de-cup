/**
 * Last-5-results strip. Deliberately never a bare colored dot — the
 * validate_palette.js check on this app's win/loss colors (primary vs
 * destructive) fails CVD separation under protanopia simulation, so every
 * chip carries its own W/L letter, not color alone.
 */
export function FormGuide({ results }: { results: ('W' | 'L')[] }) {
  if (results.length === 0) return <span className="text-xs text-muted-foreground">–</span>;

  return (
    <div className="flex items-center gap-1">
      {results.map((r, i) => (
        <span
          key={i}
          className={`flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-bold ${
            r === 'W' ? 'bg-primary/15 text-primary' : 'bg-destructive/15 text-destructive'
          }`}
        >
          {r}
        </span>
      ))}
    </div>
  );
}
