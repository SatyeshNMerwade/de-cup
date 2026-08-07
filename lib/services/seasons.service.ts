import { asc, eq } from 'drizzle-orm';

import { db } from '@/lib/db';
import { seasons } from '@/database/schema';

export function listSeasons() {
  return db.query.seasons.findMany({
    orderBy: asc(seasons.seasonNumber),
    with: { ruleSet: true },
  });
}

export function getSeasonByNumber(seasonNumber: number) {
  return db.query.seasons.findFirst({
    where: eq(seasons.seasonNumber, seasonNumber),
    with: { ruleSet: true },
  });
}

export function getSeasonById(id: string) {
  return db.query.seasons.findFirst({
    where: eq(seasons.id, id),
    with: { ruleSet: true },
  });
}
