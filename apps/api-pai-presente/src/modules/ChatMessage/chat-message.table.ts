/**
 * Pai Presente — API
 * Copyright (c) 2026. Todos os direitos reservados.
 * Licenca: proprietaria.
 */

import { index, pgTable, text, uuid, varchar } from 'drizzle-orm/pg-core';

import { usersTable } from '../User/user.table';
import { buildIdentityColumns } from '../shared/columns.constant';
import { DOMAIN_VALUE_LENGTH } from '../shared/shared.constant';

// content e conteudo de conversa do usuario: nunca vai para log (security.md §1).
export const chatMessagesTable = pgTable(
  'chat_messages',
  {
    ...buildIdentityColumns(),
    userId: uuid('user_id')
      .notNull()
      .references(() => usersTable.id, { onDelete: 'cascade' }),
    conversationId: uuid('conversation_id').notNull(),
    role: varchar('role', { length: DOMAIN_VALUE_LENGTH }).notNull(),
    content: text('content').notNull(),
  },
  (table) => [
    index('chat_messages_conversation_id_idx').on(table.userId, table.conversationId),
  ],
);

export type ChatMessageRow = typeof chatMessagesTable.$inferSelect;
export type NewChatMessageRow = typeof chatMessagesTable.$inferInsert;
