/**
 * Pai Presente — API
 * Copyright (c) 2026. Todos os direitos reservados.
 * Licenca: proprietaria.
 */

import type { ChatMessageRow } from './chat-message.table';
import type {
  ChatMessageRepository,
  CreateChatMessageParams,
  ListChatMessagesParams,
  ListChatMessagesResult,
} from './types/chat-message.types';

export type ChatMessageUseCases = {
  list(params: ListChatMessagesParams): Promise<ListChatMessagesResult>;
  create(params: CreateChatMessageParams): Promise<ChatMessageRow>;
};

export function createChatMessageUseCases(
  repository: ChatMessageRepository,
): ChatMessageUseCases {
  return {
    list: (params) => repository.list(params),
    create: (params) => repository.insert(params),
  };
}
