/**
 * Pai Presente — API
 * Copyright (c) 2026. Todos os direitos reservados.
 * Licenca: proprietaria.
 */

import { index, pgTable, timestamp, unique, uuid, varchar } from 'drizzle-orm/pg-core';

import { childrenTable } from '../Child/child.table';
import { usersTable } from '../User/user.table';
import { buildIdentityColumns } from '../shared/columns.constant';
import { DOMAIN_VALUE_LENGTH } from '../shared/shared.constant';

/**
 * O consentimento do art. 14 §1, registrado. Tabela PROPRIA, e nao um `boolean`
 * em `children`: a lei pede consentimento com finalidade e com DATA, e coluna
 * booleana nao guarda quando, nem sobrevive a uma segunda finalidade.
 *
 * A tabela guarda o estado ATUAL — o `unique(child_id, purpose)` faz disso uma
 * linha por finalidade, e revogar APAGA a linha. O historico ("concedeu em
 * marco, revogou em abril, concedeu de novo em maio") mora na trilha de
 * auditoria, que so' escreve. Guardar o historico aqui tambem obrigaria toda
 * leitura a decidir qual linha vale, e essa decisao duplicada e' exatamente o
 * que `code-standart.md` §16 proibe.
 *
 * `grantedAt` e' coluna EXPLICITA, e nao o `createdAt` de `buildIdentityColumns`:
 * `createdAt` e' escrituracao da linha, e mexer na linha por qualquer motivo
 * (correcao de dado, backfill) reescreveria a data que a lei cobra. Sao dois
 * fatos diferentes com valor igual hoje e desigual amanha.
 */
export const childConsentsTable = pgTable(
  'child_consents',
  {
    ...buildIdentityColumns(),
    userId: uuid('user_id')
      .notNull()
      .references(() => usersTable.id, { onDelete: 'cascade' }),
    childId: uuid('child_id')
      .notNull()
      .references(() => childrenTable.id, { onDelete: 'cascade' }),
    purpose: varchar('purpose', { length: DOMAIN_VALUE_LENGTH }).notNull(),
    /** A data que o art. 14 §1 cobra: quando este pai disse sim, para esta finalidade. */
    grantedAt: timestamp('granted_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    unique('child_consents_child_purpose_key').on(table.childId, table.purpose),
    index('child_consents_user_id_idx').on(table.userId),
  ],
);

export type ChildConsentRow = typeof childConsentsTable.$inferSelect;
export type NewChildConsentRow = typeof childConsentsTable.$inferInsert;
