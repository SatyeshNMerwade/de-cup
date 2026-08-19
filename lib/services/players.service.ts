import { asc, eq } from 'drizzle-orm';

import { db } from '@/lib/db';
import { players } from '@/database/schema';

export function listPlayers() {
  return db.query.players.findMany({ orderBy: asc(players.displayName) });
}

export function getPlayerById(id: string) {
  return db.query.players.findFirst({ where: eq(players.id, id) });
}
