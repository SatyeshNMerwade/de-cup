import { relations } from 'drizzle-orm';

import { users } from '../tables/user.table';

export const userRelations = relations(users, () => ({}));
