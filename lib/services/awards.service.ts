import { eq } from 'drizzle-orm';

import { db } from '@/lib/db';
import { awards } from '@/database/schema';

export function listAwardsBySeason(seasonId: string) {
  return db.query.awards.findMany({
    where: eq(awards.seasonId, seasonId),
    with: { player: true },
  });
}
