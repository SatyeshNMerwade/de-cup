/**
 * Full schema barrel: every table + relation, in the shape Drizzle's
 * relational query API (`db.query.*`) expects when passed to `drizzle()`.
 */
export * from './tables/award.table';
export * from './tables/group.table';
export * from './tables/match.table';
export * from './tables/player.table';
export * from './tables/rule-set.table';
export * from './tables/season-registration.table';
export * from './tables/season.table';
export * from './tables/user.table';

export * from './relations';
