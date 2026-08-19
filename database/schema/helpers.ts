import { sql } from 'drizzle-orm';

export const now = sql`CURRENT_TIMESTAMP`;
