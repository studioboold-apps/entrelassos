/**
 * Pai Presente — API
 * Copyright (c) 2026. Todos os direitos reservados.
 * Licenca: proprietaria.
 */

import type { ChatMessageRow } from '../chat-message.table';
import type { CreateChatMessageBody } from '../chat-message.schema';

export type ListChatMessagesParams = {
  readonly userId: string;
  readonly conversationId: string;
  readonly limit: number;
  readonly offset: number;
};

export type ListChatMessagesResult = {
  readonly items: readonly ChatMessageRow[];
  readonly total: number;
};

export type ListRecentChatMessagesParams = {
  readonly userId: string;
  readonly conversationId: string;
  readonly limit: number;
};

export type CreateChatMessageParams = {
  readonly userId: string;
  readonly values: CreateChatMessageBody;
};

export type ChatMessageRepository = {
  list(params: ListChatMessagesParams): Promise<ListChatMessagesResult>;
  listRecent(params: ListRecentChatMessagesParams): Promise<readonly ChatMessageRow[]>;
  insert(params: CreateChatMessageParams): Promise<ChatMessageRow>;
};
