/**
 * Pai Presente — API
 * Copyright (c) 2026. Todos os direitos reservados.
 * Licenca: proprietaria.
 */

import { boolean, index, integer, pgTable, uuid, varchar } from 'drizzle-orm/pg-core';

import { childrenTable } from '../Child/child.table';
import { usersTable } from '../User/user.table';
import { buildIdentityColumns, calendarDate } from '../shared/columns.constant';
import {
  CHECKSUM_LENGTH,
  DOMAIN_VALUE_LENGTH,
  MEDIUM_TEXT_LENGTH,
  OBJECT_KEY_LENGTH,
} from '../shared/shared.constant';

/**
 * O que liga uma foto e um exame ao filho. Antes disto, uma coisa so' se ligava
 * ao filho no produto inteiro: `activities.childId`.
 *
 * **Nenhuma coluna guarda o nome do arquivo enviado.** `exame-joao-silva-2026.pdf`
 * e' PII em texto claro, e ficaria no banco e no nome do objeto do balde
 * (`security.md` §7). O que o pai le e' a `caption` que ele mesmo escreve.
 *
 * `childId` cascateia — diferente de `activities`, que usa `set null`: uma
 * atividade sem filho ainda e' um dia que existiu, mas foto sem filho nao e'
 * nada. E cascata no banco **nao apaga byte no balde**: quem apaga o filho
 * apaga os objetos primeiro (H4.1), e ha teste afirmando isso.
 */
export const childFilesTable = pgTable(
  'child_files',
  {
    ...buildIdentityColumns(),
    userId: uuid('user_id')
      .notNull()
      .references(() => usersTable.id, { onDelete: 'cascade' }),
    childId: uuid('child_id')
      .notNull()
      .references(() => childrenTable.id, { onDelete: 'cascade' }),
    kind: varchar('kind', { length: DOMAIN_VALUE_LENGTH }).notNull(),
    /** `children/{childId}/{fileId}` — unico porque dois registros no mesmo objeto fariam o apagar de um cegar o outro. */
    objectKey: varchar('object_key', { length: OBJECT_KEY_LENGTH }).notNull().unique(),
    contentType: varchar('content_type', { length: DOMAIN_VALUE_LENGTH }).notNull(),
    byteSize: integer('byte_size').notNull(),
    /** sha-256 do texto CLARO: e' o que permite dizer que o que voltou e' o que subiu. */
    checksum: varchar('checksum', { length: CHECKSUM_LENGTH }).notNull(),
    /**
     * Coluna e nao constante derivada do `kind`: o dia em que a chave girar, os
     * objetos antigos e os novos convivem, e sem esta coluna nao se sabe quais
     * abrir com qual.
     */
    isEncrypted: boolean('is_encrypted').notNull().default(false),
    caption: varchar('caption', { length: MEDIUM_TEXT_LENGTH }),
    /**
     * O dia da FOTO, nao o do envio. Album antigo digitalizado num sabado
     * empilharia vinte anos naquele sabado (`D6` do GOAL).
     */
    takenOn: calendarDate('taken_on'),
  },
  (table) => [
    index('child_files_user_id_idx').on(table.userId),
    index('child_files_child_id_idx').on(table.childId),
  ],
);

export type ChildFileRow = typeof childFilesTable.$inferSelect;
export type NewChildFileRow = typeof childFilesTable.$inferInsert;
