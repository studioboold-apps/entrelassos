/**
 * Pai Presente — API
 * Copyright (c) 2026. Todos os direitos reservados.
 * Licenca: proprietaria.
 */

import { z } from 'zod';

import { COMMUNITY_POST_CATEGORIES, POST_IMAGE_DATA_URL_MAX_LENGTH } from '../shared/shared.constant';
import { buildImageDataUrlSchema, freeTextSchema } from '../shared/shared.schema';

export const createCommunityPostBodySchema = z
  .object({
    content: freeTextSchema,
    category: z.enum(COMMUNITY_POST_CATEGORIES),
    /** Foto opcional do post, como data URL ja reduzida pelo app. */
    image: buildImageDataUrlSchema(POST_IMAGE_DATA_URL_MAX_LENGTH).optional(),
  })
  .strict();

export const listCommunityPostsQuerySchema = z.object({
  category: z.enum(COMMUNITY_POST_CATEGORIES).optional(),
});

export type CreateCommunityPostBody = z.infer<typeof createCommunityPostBodySchema>;
export type ListCommunityPostsQuery = z.infer<typeof listCommunityPostsQuerySchema>;
