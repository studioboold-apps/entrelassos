/**
 * Pai Presente — API
 * Copyright (c) 2026. Todos os direitos reservados.
 * Licenca: proprietaria.
 */

import { sql } from 'drizzle-orm';
import { customType, timestamp, uuid } from 'drizzle-orm/pg-core';

import { toCalendarDate } from './date.util';

/** Toda tabela publica usa UUID v4 gerado no banco (code-standart.md §8). */
export function buildIdentityColumns() {
  return {
    id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
    createdAt: timestamp('created_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
  } as const;
}

/**
 * `date` do Postgres e dia de calendario, mas o driver do Bun o entrega como
 * `Date` na meia-noite UTC enquanto o tipo do Drizzle segue dizendo `string`.
 * Como o `tsc` acredita no tipo, a mentira viaja calada ate a tela, onde
 * `new Date()` a joga para o dia anterior em qualquer fuso a oeste de
 * Greenwich. Esta coluna faz o tipo declarado virar verdade na fronteira.
 */
export const calendarDate = customType<{ data: string; driverData: string | Date }>({
  dataType: () => 'date',
  fromDriver: (value) => toCalendarDate(value),
});
