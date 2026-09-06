/**
 * Pai Presente — API
 * Copyright (c) 2026. Todos os direitos reservados.
 * Licenca: proprietaria.
 */

import { index, pgTable, timestamp, unique, uuid, varchar } from 'drizzle-orm/pg-core';

import { buildIdentityColumns } from '../shared/columns.constant';
import { DOMAIN_VALUE_LENGTH } from '../shared/shared.constant';
import { usersTable } from '../User/user.table';
import {
  PASSWORD_HASH_LENGTH,
  PROVIDER_SUBJECT_LENGTH,
  REFRESH_TOKEN_HASH_LENGTH,
} from './auth.constant';

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
 * A senha NAO ganha linha em `auth_identities`, e nao ganha coluna em `users`.
 *
 * Em `auth_identities` o `subject` teria de ser o e-mail, que ja mora em
 * `users.email` — e duas copias do mesmo e-mail concordam ate a primeira troca
 * de endereco. Em `users` a coluna ficaria nula para todo mundo que entrou por
 * Google, e coluna que quase sempre e nula deixa de dizer o que significa.
 *
 * Uma linha por usuario (`unique`): a pessoa tem uma senha ou nao tem nenhuma.
 */
export const passwordCredentialsTable = pgTable('password_credentials', {
  ...buildIdentityColumns(),
  userId: uuid('user_id')
    .notNull()
    .unique()
    .references(() => usersTable.id, { onDelete: 'cascade' }),
  passwordHash: varchar('password_hash', { length: PASSWORD_HASH_LENGTH }).notNull(),
});

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
export type PasswordCredentialRow = typeof passwordCredentialsTable.$inferSelect;
export type SessionRow = typeof sessionsTable.$inferSelect;
