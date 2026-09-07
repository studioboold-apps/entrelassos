/**
 * Pai Presente — API
 * Copyright (c) 2026. Todos os direitos reservados.
 * Licenca: proprietaria.
 */

import { z } from 'zod';

import { CHILD_FILE_KINDS, MEDIUM_TEXT_LENGTH } from '../shared/shared.constant';
import { isoDateSchema } from '../shared/shared.schema';

/**
 * Os campos de TEXTO do formulario. Os bytes nao passam por Zod — quem os
 * valida e' `detectContentType`, lendo assinatura, e o teto de tamanho.
 *
 * `caption` cabe em 255 e nao em 120 como o resto do produto: e' a unica frase
 * que o pai escreve sobre a foto, e cortar em 120 truncaria legenda de album.
 */
export const uploadChildFileFieldsSchema = z.object({
  kind: z.enum(CHILD_FILE_KINDS),
  caption: z.string().trim().min(1).max(MEDIUM_TEXT_LENGTH).optional(),
  takenOn: isoDateSchema.optional(),
});

export type UploadChildFileFields = z.infer<typeof uploadChildFileFieldsSchema>;
