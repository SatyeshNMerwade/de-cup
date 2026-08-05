import postgres from 'postgres';
import { drizzle } from 'drizzle-orm/postgres-js';

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error('DATABASE_URL is not configured.');
}

const client = postgres(connectionString, {
  prepare: false,
  max: 1,
});

export const db = drizzle(client);

export { client };
