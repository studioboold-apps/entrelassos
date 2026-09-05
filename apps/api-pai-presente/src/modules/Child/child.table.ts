/**
 * Pai Presente — API
 * Copyright (c) 2026. Todos os direitos reservados.
 * Licenca: proprietaria.
 */

import { index, integer, pgTable, uuid, varchar } from 'drizzle-orm/pg-core';

import { usersTable } from '../User/user.table';
import { buildIdentityColumns, calendarDate } from '../shared/columns.constant';
import { DOMAIN_VALUE_LENGTH, SHORT_TEXT_LENGTH } from '../shared/shared.constant';

export const childrenTable = pgTable(
  'children',
  {
    ...buildIdentityColumns(),
    userId: uuid('user_id')
      .notNull()
      .references(() => usersTable.id, { onDelete: 'cascade' }),
    name: varchar('name', { length: SHORT_TEXT_LENGTH }).notNull(),
    age: integer('age').notNull(),
    gender: varchar('gender', { length: DOMAIN_VALUE_LENGTH }).notNull(),
    birthDate: calendarDate('birth_date'),
    favoriteHobby: varchar('favorite_hobby', { length: SHORT_TEXT_LENGTH }),
    favoriteColor: varchar('favorite_color', { length: SHORT_TEXT_LENGTH }),
    favoriteFood: varchar('favorite_food', { length: SHORT_TEXT_LENGTH }),
    favoriteMovieGenre: varchar('favorite_movie_genre', { length: SHORT_TEXT_LENGTH }),
  },
  (table) => [index('children_user_id_idx').on(table.userId)],
);

export type ChildRow = typeof childrenTable.$inferSelect;
export type NewChildRow = typeof childrenTable.$inferInsert;
