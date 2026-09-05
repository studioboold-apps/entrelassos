/**
 * Pai Presente — API
 * Copyright (c) 2026. Todos os direitos reservados.
 * Licenca: proprietaria.
 */

import { z } from 'zod';

import { freeTextSchema, uuidSchema } from '../shared/shared.schema';

export const createCommunityCommentBodySchema = z
  .object({
    postId: uuidSchema,
    content: freeTextSchema,
  })
  .strict();

/** postId e obrigatorio: comentario da comunidade inteira nao e uma tela. */
export const listCommunityCommentsQuerySchema = z.object({ postId: uuidSchema });

export type CreateCommunityCommentBody = z.infer<typeof createCommunityCommentBodySchema>;
export type ListCommunityCommentsQuery = z.infer<typeof listCommunityCommentsQuerySchema>;
