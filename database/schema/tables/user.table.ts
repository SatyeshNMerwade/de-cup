import { pgTable, text, uniqueIndex, boolean, integer, timestamp } from 'drizzle-orm/pg-core';

import { TABLES } from '../constants';
import { idColumn, timestampColumns } from '../common';
import { userRoleEnum } from '../enums';

export const users = pgTable(
  TABLES.USERS,
  {
    ...idColumn,

    username: text('username').notNull(),

    displayName: text('display_name').notNull(),

    passwordHash: text('password_hash').notNull(),

    isActive: boolean('is_active').default(true).notNull(),

    role: userRoleEnum('role').default('ADMIN').notNull(),

    failedLoginAttempts: integer('failed_login_attempts').default(0).notNull(),

    lockedUntil: timestamp('locked_until', { withTimezone: true }),

    ...timestampColumns,
  },
  (table) => ({
    usernameUnique: uniqueIndex('uq_users_username').on(table.username),
  }),
);
