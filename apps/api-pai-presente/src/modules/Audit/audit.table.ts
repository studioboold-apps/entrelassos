/**
 * Pai Presente — API
 * Copyright (c) 2026. Todos os direitos reservados.
 * Licenca: proprietaria.
 */

import { sql } from 'drizzle-orm';
import { index, pgTable, timestamp, uuid, varchar } from 'drizzle-orm/pg-core';

import { CLIENT_IP_LENGTH, DOMAIN_VALUE_LENGTH } from '../shared/shared.constant';

/**
 * A trilha e a UNICA tabela do esquema que NAO referencia `users`. Toda outra
 * aponta para la com `onDelete: cascade`, e e isso que faz `DELETE /v1/me`
 * limpar as nove de uma vez; se a trilha fizesse o mesmo, apagar a conta
 * apagaria junto a prova de que ela foi apagada — o registro que o §10 da
 * `security.md` manda guardar.
 *
 * Por isso o ator e uuid solto: id de conta que pode nao existir mais.
 *
 * O IP aqui nao contradiz o §1 (proibido PII em log): o §10 pede IP na trilha
 * de forma explicita, e trilha de auditoria nao e log de aplicacao.
 *
 * Sem `updated_at` de proposito — linha de auditoria nasce e nao muda.
 */
export const auditLogTable = pgTable(
  'audit_log',
  {
    id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    actorId: uuid('actor_id').notNull(),
    action: varchar('action', { length: DOMAIN_VALUE_LENGTH }).notNull(),
    targetType: varchar('target_type', { length: DOMAIN_VALUE_LENGTH }).notNull(),
    targetId: uuid('target_id').notNull(),
    clientIp: varchar('client_ip', { length: CLIENT_IP_LENGTH }).notNull(),
  },
  (table) => [index('audit_log_actor_id_idx').on(table.actorId, table.createdAt)],
);

export type AuditLogRow = typeof auditLogTable.$inferSelect;
export type NewAuditLogRow = typeof auditLogTable.$inferInsert;
