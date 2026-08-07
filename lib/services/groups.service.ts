import { asc, eq } from 'drizzle-orm';

import { db } from '@/lib/db';
import { groups } from '@/database/schema';

export function listGroupsBySeason(seasonId: string) {
  return db.query.groups.findMany({
    where: eq(groups.seasonId, seasonId),
    orderBy: asc(groups.displayOrder),
  });
}
