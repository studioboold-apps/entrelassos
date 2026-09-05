/**
 * Pai Presente — API
 * Copyright (c) 2026. Todos os direitos reservados.
 * Licenca: proprietaria.
 */

import { index, pgTable, timestamp, unique, uuid, varchar } from 'drizzle-orm/pg-core';

import { buildIdentityColumns } from '../shared/columns.constant';
import { DOMAIN_VALUE_LENGTH } from '../shared/shared.constant';
import { usersTable } from '../User/user.table';
import { PROVIDER_SUBJECT_LENGTH, REFRESH_TOKEN_HASH_LENGTH } from './auth.constant';

/**
 * Tabela separada de `users` porque a mesma pessoa pode entrar por Google e por
 * Apple: sao duas identidades para uma conta so, e guardar o par na coluna do
 * usuario obrigaria a escolher qual delas fica.
 */
export const authIdentitiesTable = pgTable(
  'auth_identities',
  {
    ...buildIdentityColumns(),
    userId: uuid('user_id')
      .notNull()
      .references(() => usersTable.id, { onDelete: 'cascade' }),
    provider: varchar('provider', { length: DOMAIN_VALUE_LENGTH }).notNull(),
    subject: varchar('subject', { length: PROVIDER_SUBJECT_LENGTH }).notNull(),
  },
  (table) => [
    unique('auth_identities_provider_subject_unique').on(table.provider, table.subject),
    index('auth_identities_user_id_idx').on(table.userId),
  ],
);

/**
 * O refresh vive aqui como HASH: vazamento de banco nao vira sessao ativa, e o
 * valor em claro so existe no cookie do dono.
 */
export const sessionsTable = pgTable(
  'sessions',
  {
    ...buildIdentityColumns(),
    userId: uuid('user_id')
      .notNull()
      .references(() => usersTable.id, { onDelete: 'cascade' }),
    refreshTokenHash: varchar('refresh_token_hash', { length: REFRESH_TOKEN_HASH_LENGTH })
      .notNull()
      .unique(),
    expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
    revokedAt: timestamp('revoked_at', { withTimezone: true }),
  },
  (table) => [index('sessions_user_id_idx').on(table.userId)],
);

export type AuthIdentityRow = typeof authIdentitiesTable.$inferSelect;
export type SessionRow = typeof sessionsTable.$inferSelect;
