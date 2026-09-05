/**
 * Pai Presente — API
 * Copyright (c) 2026. Todos os direitos reservados.
 * Licenca: proprietaria.
 */

import { and, asc, count, eq } from 'drizzle-orm';

import type { Database } from '../../database/client';
import { chatMessagesTable, type ChatMessageRow } from './chat-message.table';
import type {
  ChatMessageRepository,
  CreateChatMessageParams,
  ListChatMessagesParams,
  ListChatMessagesResult,
} from './types/chat-message.types';

export function createChatMessageRepository(database: Database): ChatMessageRepository {
  return {
    async list({ userId, conversationId, limit, offset }: ListChatMessagesParams): Promise<ListChatMessagesResult> {
      const where = and(
        eq(chatMessagesTable.userId, userId),
        eq(chatMessagesTable.conversationId, conversationId),
      );
      const [items, totals] = await Promise.all([
        database
          .select()
          .from(chatMessagesTable)
          .where(where)
          .orderBy(asc(chatMessagesTable.createdAt))
          .limit(limit)
          .offset(offset),
        database.select({ value: count() }).from(chatMessagesTable).where(where),
      ]);
      return { items, total: totals[0]?.value ?? 0 };
    },

    async insert({ userId, values }: CreateChatMessageParams): Promise<ChatMessageRow> {
      const rows = await database
        .insert(chatMessagesTable)
        .values({ ...values, userId })
        .returning();
      const row = rows[0];
      if (row === undefined) throw new Error('insert de mensagem nao retornou linha');
      return row;
    },
  };
}
