/**
 * Pai Presente — API
 * Copyright (c) 2026. Todos os direitos reservados.
 * Licenca: proprietaria.
 */

import { z } from 'zod';

import { ADULT_AGE_MAX, ADULT_AGE_MIN, MARITAL_STATUSES } from '../shared/shared.constant';
import { shortTextSchema } from '../shared/shared.schema';

// O email NAO entra aqui: ele vem da sessao autenticada, nunca de um campo livre
// do cliente (security.md §2 — identidade sai do contexto, nao do corpo).
export const updateUserBodySchema = z
  .object({
    fullName: shortTextSchema,
    age: z.int().min(ADULT_AGE_MIN).max(ADULT_AGE_MAX),
    maritalStatus: z.enum(MARITAL_STATUSES),
    onboardingCompleted: z.boolean(),
  })
  .partial()
  .strict();

export type UpdateUserBody = z.infer<typeof updateUserBodySchema>;
