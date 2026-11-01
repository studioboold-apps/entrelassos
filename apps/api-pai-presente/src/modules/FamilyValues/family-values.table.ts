/**
 * Pai Presente — API
 * Copyright (c) 2026. Todos os direitos reservados.
 * Licenca: proprietaria.
 */

import { boolean, index, pgTable, timestamp, unique, uuid, varchar } from 'drizzle-orm/pg-core';

import { usersTable } from '../User/user.table';
import { buildIdentityColumns } from '../shared/columns.constant';
import { DOMAIN_VALUE_LENGTH } from '../shared/shared.constant';
import { FAMILY_VALUE_LABEL_MAX_LENGTH } from './family-values.constant';

/**
 * O vocabulario: cada resposta distinta uma vez so', SEM dono. E' daqui que
 * saem as sugestoes do campo livre; quem escolheu o que mora na outra tabela.
 */
export const familyValueOptionsTable = pgTable(
  'family_value_options',
  {
    ...buildIdentityColumns(),
    kind: varchar('kind', { length: DOMAIN_VALUE_LENGTH }).notNull(),
    label: varchar('label', { length: FAMILY_VALUE_LABEL_MAX_LENGTH }).notNull(),
    /** `normalizeFamilyValueKey(label)`: e' ela que impede a duplicata. */
    normalizedKey: varchar('normalized_key', { length: FAMILY_VALUE_LABEL_MAX_LENGTH }).notNull(),
    /** Semente do produto: aparece como sugestao mesmo sem ninguem ter escolhido. */
    seeded: boolean('seeded').notNull().default(false),
  },
  (table) => [unique('family_value_options_kind_key').on(table.kind, table.normalizedKey)],
);

/**
 * A escolha do pai: uma linha por tipo. Existir linha E' o consentimento do
 * art. 11 — o app so' grava depois do aceite, e retirar o aceite apaga as
 * linhas. `grantedAt` e' a data que a lei cobra, separada de `createdAt` pelo
 * mesmo motivo de `child_consents`.
 */
export const userFamilyValuesTable = pgTable(
  'user_family_values',
  {
    ...buildIdentityColumns(),
    userId: uuid('user_id')
      .notNull()
      .references(() => usersTable.id, { onDelete: 'cascade' }),
    kind: varchar('kind', { length: DOMAIN_VALUE_LENGTH }).notNull(),
    optionId: uuid('option_id')
      .notNull()
      .references(() => familyValueOptionsTable.id, { onDelete: 'cascade' }),
    grantedAt: timestamp('granted_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    unique('user_family_values_user_kind_key').on(table.userId, table.kind),
    index('user_family_values_option_id_idx').on(table.optionId),
  ],
);

export type FamilyValueOptionRow = typeof familyValueOptionsTable.$inferSelect;
export type UserFamilyValueRow = typeof userFamilyValuesTable.$inferSelect;
