/**
 * Creates (or updates the password for) an admin user in the `users` table.
 * Non-interactive by design — this runs fine from a CI shell too.
 *
 * Usage:
 *   npx tsx scripts/seed-db.ts --username satyesh --display-name "Satyesh Merwade" --password "..." [--role SUPER_ADMIN]
 */

import { config } from 'dotenv';
config({ path: '.env.local' });

import postgres from 'postgres';
import { drizzle } from 'drizzle-orm/postgres-js';
import { eq } from 'drizzle-orm';
import bcrypt from 'bcryptjs';

import { users } from '../database/schema/tables/user.table';
import { UserRole } from '../types/domain/user';

function parseArgs(argv: string[]): Record<string, string> {
  const args: Record<string, string> = {};
  for (let i = 0; i < argv.length; i++) {
    if (argv[i].startsWith('--')) {
      const key = argv[i].slice(2);
      const value = argv[i + 1];
      if (value === undefined || value.startsWith('--')) {
        throw new Error(`Missing value for --${key}`);
      }
      args[key] = value;
      i++;
    }
  }
  return args;
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const username = args.username;
  const displayName = args['display-name'];
  const password = args.password;
  const role = (args.role as UserRole) ?? UserRole.ADMIN;

  if (!username || !displayName || !password) {
    console.error(
      'Usage: npx tsx scripts/seed-db.ts --username <u> --display-name "<name>" --password "<pw>" [--role SUPER_ADMIN|ADMIN]',
    );
    process.exitCode = 1;
    return;
  }
  if (!Object.values(UserRole).includes(role)) {
    throw new Error(`Invalid role "${role}". Expected one of: ${Object.values(UserRole).join(', ')}`);
  }
  if (password.length < 8) {
    throw new Error('Password must be at least 8 characters.');
  }

  const url = process.env.DATABASE_URL;
  if (!url) throw new Error('DATABASE_URL is not configured (expected in .env.local).');

  const client = postgres(url, { prepare: false, max: 1 });
  const db = drizzle(client);

  try {
    const passwordHash = await bcrypt.hash(password, 12);
    const [existing] = await db.select().from(users).where(eq(users.username, username)).limit(1);

    if (existing) {
      await db.update(users).set({ passwordHash, displayName, role, isActive: true }).where(eq(users.id, existing.id));
      console.log(`Updated existing user "${username}" (role: ${role}).`);
    } else {
      await db.insert(users).values({ username, displayName, passwordHash, role, isActive: true });
      console.log(`Created user "${username}" (role: ${role}).`);
    }
  } finally {
    await client.end();
  }
}

main().catch((err) => {
  console.error('Failed:', err);
  process.exitCode = 1;
});
