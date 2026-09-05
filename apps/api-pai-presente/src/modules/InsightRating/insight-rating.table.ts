/**
 * Pai Presente — API
 * Copyright (c) 2026. Todos os direitos reservados.
 * Licenca: proprietaria.
 */

import { index, integer, pgTable, unique, uuid, varchar } from 'drizzle-orm/pg-core';

import { usersTable } from '../User/user.table';
import { buildIdentityColumns } from '../shared/columns.constant';
import { DOMAIN_VALUE_LENGTH, MEDIUM_TEXT_LENGTH } from '../shared/shared.constant';

export const insightRatingsTable = pgTable(
  'insight_ratings',
  {
    ...buildIdentityColumns(),
    userId: uuid('user_id')
      .notNull()
      .references(() => usersTable.id, { onDelete: 'cascade' }),
    insightId: varchar('insight_id', { length: MEDIUM_TEXT_LENGTH }).notNull(),
    category: varchar('category', { length: DOMAIN_VALUE_LENGTH }).notNull(),
    rating: integer('rating').notNull(),
    insightTitle: varchar('insight_title', { length: MEDIUM_TEXT_LENGTH }),
  },
  (table) => [
    index('insight_ratings_user_id_idx').on(table.userId),
    // Uma nota por insight por usuario: reavaliar atualiza, nao empilha.
    unique('insight_ratings_user_insight_unique').on(table.userId, table.insightId),
  ],
);

export type InsightRatingRow = typeof insightRatingsTable.$inferSelect;
export type NewInsightRatingRow = typeof insightRatingsTable.$inferInsert;
