/**
 * Pai Presente — API
 * Copyright (c) 2026. Todos os direitos reservados.
 * Licenca: proprietaria.
 */

import { z } from 'zod';

import { CHAT_ROLES } from '../shared/shared.constant';
import { freeTextSchema, uuidSchema } from '../shared/shared.schema';

export const createChatMessageBodySchema = z
  .object({
    conversationId: uuidSchema,
    role: z.enum(CHAT_ROLES),
    content: freeTextSchema,
  })
  .strict();

export const listChatMessagesQuerySchema = z.object({ conversationId: uuidSchema });

export type CreateChatMessageBody = z.infer<typeof createChatMessageBodySchema>;
export type ListChatMessagesQuery = z.infer<typeof listChatMessagesQuerySchema>;
