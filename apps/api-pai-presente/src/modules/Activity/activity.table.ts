/**
 * Pai Presente — API
 * Copyright (c) 2026. Todos os direitos reservados.
 * Licenca: proprietaria.
 */

import {
  boolean,
  date,
  index,
  integer,
  pgTable,
  text,
  uuid,
  varchar,
} from 'drizzle-orm/pg-core';

import { childrenTable } from '../Child/child.table';
import { usersTable } from '../User/user.table';
import { buildIdentityColumns } from '../shared/columns.constant';
import { DOMAIN_VALUE_LENGTH, MEDIUM_TEXT_LENGTH } from '../shared/shared.constant';

// A Base44 guardava child_name ao lado de child_id; o nome e derivavel do
// vinculo, e copia divergente foi a causa de L-032/L-033 no outro projeto.
// A API devolve childName pelo join; a tabela guarda so o vinculo.
export const activitiesTable = pgTable(
  'activities',
  {
    ...buildIdentityColumns(),
    userId: uuid('user_id')
      .notNull()
      .references(() => usersTable.id, { onDelete: 'cascade' }),
    childId: uuid('child_id').references(() => childrenTable.id, {
      onDelete: 'set null',
    }),
    title: varchar('title', { length: MEDIUM_TEXT_LENGTH }).notNull(),
    description: text('description'),
    activityDate: date('activity_date').notNull(),
    activityTime: varchar('activity_time', { length: DOMAIN_VALUE_LENGTH }),
    category: varchar('category', { length: DOMAIN_VALUE_LENGTH }),
    isSuggested: boolean('is_suggested').notNull().default(false),
    isCompleted: boolean('is_completed').notNull().default(false),
    rating: integer('rating'),
    feedback: text('feedback'),
  },
  (table) => [
    index('activities_user_id_idx').on(table.userId),
    index('activities_child_id_idx').on(table.childId),
  ],
);

export type ActivityRow = typeof activitiesTable.$inferSelect;
export type NewActivityRow = typeof activitiesTable.$inferInsert;
