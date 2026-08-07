import { eq } from 'drizzle-orm';

import { db } from '@/lib/db';
import { seasonRegistrations } from '@/database/schema';

export function listRegistrationsBySeason(seasonId: string) {
  return db.query.seasonRegistrations.findMany({
    where: eq(seasonRegistrations.seasonId, seasonId),
    with: { player: true, group: true },
  });
}
