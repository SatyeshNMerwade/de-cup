import { asc } from 'drizzle-orm';

import { db } from '@/lib/db';
import { ruleSets } from '@/database/schema';

export function listRuleSets() {
  return db.query.ruleSets.findMany({ orderBy: [asc(ruleSets.name), asc(ruleSets.version)] });
}
