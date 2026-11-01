/**
 * Pai Presente — API
 * Copyright (c) 2026. Todos os direitos reservados.
 * Licenca: proprietaria.
 */

import { z } from 'zod';

import { CHILD_AGE_MAX, CHILD_AGE_MIN, CHILD_GENDERS } from '../shared/shared.constant';
import { avatarDataUrlSchema, isoDateSchema, shortTextSchema } from '../shared/shared.schema';

export const createChildBodySchema = z
  .object({
    name: shortTextSchema,
    age: z.int().min(CHILD_AGE_MIN).max(CHILD_AGE_MAX),
    gender: z.enum(CHILD_GENDERS),
    birthDate: isoDateSchema.optional(),
    favoriteHobby: shortTextSchema.optional(),
    favoriteColor: shortTextSchema.optional(),
    favoriteFood: shortTextSchema.optional(),
    favoriteMovieGenre: shortTextSchema.optional(),
    avatarUrl: avatarDataUrlSchema.optional(),
  })
  .strict();

export const updateChildBodySchema = createChildBodySchema.partial();

export type CreateChildBody = z.infer<typeof createChildBodySchema>;
export type UpdateChildBody = z.infer<typeof updateChildBodySchema>;
