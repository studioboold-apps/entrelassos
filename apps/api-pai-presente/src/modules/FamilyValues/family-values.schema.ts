/**
 * Pai Presente — API
 * Copyright (c) 2026. Todos os direitos reservados.
 * Licenca: proprietaria.
 */

import { z } from 'zod';

import { FAMILY_VALUE_KIND_VALUES, FAMILY_VALUE_LABEL_MAX_LENGTH } from './family-values.constant';

/** Vazio vira `null`: "prefiro nao dizer" e' nao guardar nada. */
const familyValueLabelSchema = z
  .string()
  .trim()
  .max(FAMILY_VALUE_LABEL_MAX_LENGTH)
  .nullable()
  .transform((value) => (value === null || value === '' ? null : value));

/**
 * `consent: true` e' obrigatorio e literal: sem o aceite marcado na tela, a
 * API nem le o resto. Os tres campos vem sempre juntos — a tela edita os tres.
 */
export const saveFamilyValuesBodySchema = z
  .object({
    consent: z.literal(true),
    religion: familyValueLabelSchema,
    politics: familyValueLabelSchema,
    orientation: familyValueLabelSchema,
  })
  .strict();
export type SaveFamilyValuesBody = z.infer<typeof saveFamilyValuesBodySchema>;

export const listFamilyValueOptionsQuerySchema = z.object({
  kind: z.enum(FAMILY_VALUE_KIND_VALUES),
});
