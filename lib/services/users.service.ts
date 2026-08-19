import { asc } from 'drizzle-orm';

import { db } from '@/lib/db';
import { users } from '@/database/schema';

export function listUsers() {
  return db.query.users.findMany({
    orderBy: asc(users.username),
    columns: {
      id: true,
      username: true,
      displayName: true,
      role: true,
      isActive: true,
    },
  });
}
