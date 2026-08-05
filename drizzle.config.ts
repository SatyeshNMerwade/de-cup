import 'dotenv/config';
import { defineConfig } from 'drizzle-kit';

export default defineConfig({
  dialect: 'postgresql',

  schema: './database/schema/tables/*.table.ts',

  out: './database/migrations',

  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },

  verbose: true,

  strict: true,
});
