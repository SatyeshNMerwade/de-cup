import { config } from 'dotenv';
import { defineConfig } from 'drizzle-kit';

config({ path: '.env.local' });

export default defineConfig({
  dialect: 'postgresql',

  schema: ['./database/schema/tables/*.table.ts', './database/schema/enums.ts'],

  out: './database/migrations',

  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },

  verbose: true,

  strict: true,
});
