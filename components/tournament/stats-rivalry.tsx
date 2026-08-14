import type { HeadToHeadGridView, TossBreakStatsView } from '@/lib/services';

function cellClass(wins: number, losses: number): string {
  if (wins === 0 && losses === 0) return 'text-muted-foreground/50';
  if (wins > losses) return 'text-primary font-semibold';
  if (wins < losses) return 'text-destructive font-semibold';
  return 'text-ring font-semibold';
}

export function StatsRivalry({
  headToHead,
  breakSplit,
}: {
  headToHead: HeadToHeadGridView;
  breakSplit?: TossBreakStatsView['breakSplit'];
}) {
  const { playerIds, names, grid, biggestRivalry } = headToHead;
  const hasBreakData = Boolean(breakSplit);

  return (
    <div>
      <p className="mb-4 text-sm text-muted-foreground">
        Head-to-head record for every match played so far — row player&apos;s wins vs losses against the column
        player.
      </p>

      <div className="overflow-x-auto rounded-lg border border-border bg-card shadow-sm">
        <table className="w-full text-center text-sm">
          <thead>
            <tr>
              <th className="px-3 py-2" />
              {playerIds.map((id) => (
                <th key={id} className="px-3 py-2 text-xs font-bold tracking-wide text-ring uppercase">
                  {names[id]}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {playerIds.map((rowId) => (
              <tr key={rowId} className="border-t border-border">
                <th className="whitespace-nowrap px-3 py-2 text-left font-serif font-semibold text-card-foreground">
                  {names[rowId]}
                </th>
                {playerIds.map((colId) => {
                  if (rowId === colId) {
                    return (
                      <td key={colId} className="px-3 py-2 text-border">
                        —
                      </td>
                    );
                  }
                  const cell = grid[rowId][colId];
                  const breakCell = breakSplit?.[rowId]?.[colId];
                  const breakCellHasData =
                    breakCell &&
                    breakCell.whenBrokeFirst.wins + breakCell.whenBrokeFirst.losses + breakCell.whenOpponentBrokeFirst.wins + breakCell.whenOpponentBrokeFirst.losses > 0;
                  return (
                    <td key={colId} className={`px-3 py-2 ${cellClass(cell.wins, cell.losses)}`}>
                      {cell.wins === 0 && cell.losses === 0 ? '–' : `${cell.wins}-${cell.losses}`}
                      {breakCellHasData && breakCell && (
                        <div className="mt-0.5 text-[10px] font-normal text-muted-foreground">
                          brk {breakCell.whenBrokeFirst.wins}-{breakCell.whenBrokeFirst.losses} / opp{' '}
                          {breakCell.whenOpponentBrokeFirst.wins}-{breakCell.whenOpponentBrokeFirst.losses}
                        </div>
                      )}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {hasBreakData && (
        <p className="mt-2 text-xs text-muted-foreground">
          Small text under a record splits it by who broke first, for matches from seasons that tracked toss data:{' '}
          <span className="italic">brk</span> = row player broke first, <span className="italic">opp</span> = the
          column player did.
        </p>
      )}

      {biggestRivalry.length > 0 && (
        <p className="mt-4 text-sm text-muted-foreground">
          {biggestRivalry.length > 1 ? 'Biggest rivalries so far' : 'Biggest rivalry so far'} — met{' '}
          {biggestRivalry[0].meetings} time{biggestRivalry[0].meetings === 1 ? '' : 's'}:{' '}
          {biggestRivalry
            .map((r) => (
              <span key={`${r.aName}-${r.bName}`}>
                <span className="font-semibold text-card-foreground">{r.aName}</span> vs{' '}
                <span className="font-semibold text-card-foreground">{r.bName}</span> ({r.record})
              </span>
            ))
            .reduce((prev, curr, i) => (i === 0 ? [curr] : [...prev, ', ', curr]), [] as React.ReactNode[])}
        </p>
      )}
    </div>
  );
}
