import { timestamp, uuid, boolean, integer, text } from 'drizzle-orm/pg-core';

import { now } from './helpers';

export const idColumn = {
  id: uuid('id').defaultRandom().primaryKey(),
};

export const timestampColumns = {
  createdAt: timestamp('created_at', {
    withTimezone: true,
  })
    .default(now)
    .notNull(),

  updatedAt: timestamp('updated_at', {
    withTimezone: true,
  })
    .default(now)
    .notNull(),
};

export const softDeleteColumns = {
  deletedAt: timestamp('deleted_at', {
    withTimezone: true,
  }),
};
