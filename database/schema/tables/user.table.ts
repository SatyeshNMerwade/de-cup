import { pgTable, text, uniqueIndex, boolean } from 'drizzle-orm/pg-core';

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

    ...timestampColumns,
  },
  (table) => ({
    usernameUnique: uniqueIndex('uq_users_username').on(table.username),
  }),
);
