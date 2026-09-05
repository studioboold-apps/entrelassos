/**
 * Pai Presente — API
 * Copyright (c) 2026. Todos os direitos reservados.
 * Licenca: proprietaria.
 */

import { z } from 'zod';

import { INSIGHT_CATEGORIES, MEDIUM_TEXT_LENGTH } from '../shared/shared.constant';
import { ratingSchema } from '../shared/shared.schema';

export const insightIdSchema = z.string().trim().min(1).max(MEDIUM_TEXT_LENGTH);

export const putInsightRatingBodySchema = z
  .object({
    category: z.enum(INSIGHT_CATEGORIES),
    rating: ratingSchema,
    insightTitle: z.string().trim().min(1).max(MEDIUM_TEXT_LENGTH).optional(),
  })
  .strict();

export type PutInsightRatingBody = z.infer<typeof putInsightRatingBodySchema>;
