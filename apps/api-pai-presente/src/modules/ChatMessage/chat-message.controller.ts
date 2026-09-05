/**
 * Pai Presente — API
 * Copyright (c) 2026. Todos os direitos reservados.
 * Licenca: proprietaria.
 */

import { HTTP_METHODS, HTTP_STATUS } from '../shared/http/http.constant';
import { parseJsonBody, parsePagination, parseWithSchema } from '../shared/http/request.util';
import { respondWithData, respondWithList } from '../shared/http/response.util';
import type { RouteDefinition } from '../shared/http/route.types';
import {
  createChatMessageBodySchema,
  listChatMessagesQuerySchema,
} from './chat-message.schema';
import type { ChatMessageUseCases } from './chat-message.use-case';

const CHAT_MESSAGES_PATH = '/v1/chat/messages';

export function buildChatMessageRoutes(useCases: ChatMessageUseCases): readonly RouteDefinition[] {
  return [
    {
      method: HTTP_METHODS.GET,
      path: CHAT_MESSAGES_PATH,
      summary: 'Lista as mensagens de uma conversa do usuario autenticado.',
      handle: async ({ url, authenticatedUser }) => {
        const { page, perPage, offset } = parsePagination(url);
        const { conversationId } = parseWithSchema(
          listChatMessagesQuerySchema,
          Object.fromEntries(url.searchParams),
        );
        const { items, total } = await useCases.list({
          userId: authenticatedUser.userId,
          conversationId,
          limit: perPage,
          offset,
        });
        return respondWithList(items, { total, page, perPage });
      },
    },
    {
      method: HTTP_METHODS.POST,
      path: CHAT_MESSAGES_PATH,
      summary: 'Grava uma mensagem de conversa.',
      handle: async ({ request, authenticatedUser }) => {
        const values = await parseJsonBody(request, createChatMessageBodySchema);
        const message = await useCases.create({ userId: authenticatedUser.userId, values });
        return respondWithData(message, HTTP_STATUS.CREATED);
      },
    },
  ];
}
