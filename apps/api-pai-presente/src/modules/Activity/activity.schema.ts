/**
 * Pai Presente — API
 * Copyright (c) 2026. Todos os direitos reservados.
 * Licenca: proprietaria.
 */

import { z } from 'zod';

import { ACTIVITY_CATEGORIES } from '../shared/shared.constant';
import {
  freeTextSchema,
  isoDateSchema,
  ratingSchema,
  shortTextSchema,
  timeOfDaySchema,
  uuidSchema,
} from '../shared/shared.schema';

export const createActivityBodySchema = z
  .object({
    title: shortTextSchema,
    description: freeTextSchema.optional(),
    activityDate: isoDateSchema,
    activityTime: timeOfDaySchema.optional(),
    category: z.enum(ACTIVITY_CATEGORIES).optional(),
    childId: uuidSchema.optional(),
    isSuggested: z.boolean().optional(),
    isCompleted: z.boolean().optional(),
    rating: ratingSchema.optional(),
    feedback: freeTextSchema.optional(),
  })
  .strict();

export const updateActivityBodySchema = createActivityBodySchema.partial();

export const listActivitiesQuerySchema = z.object({
  childId: uuidSchema.optional(),
  isCompleted: z.stringbool().optional(),
  fromDate: isoDateSchema.optional(),
  toDate: isoDateSchema.optional(),
});

export type CreateActivityBody = z.infer<typeof createActivityBodySchema>;
export type UpdateActivityBody = z.infer<typeof updateActivityBodySchema>;
export type ListActivitiesQuery = z.infer<typeof listActivitiesQuerySchema>;
