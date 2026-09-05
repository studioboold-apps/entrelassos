/**
 * Pai Presente — API
 * Copyright (c) 2026. Todos os direitos reservados.
 * Licenca: proprietaria.
 */

import { z } from 'zod';

const environmentSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  DATABASE_URL: z.string().min(1),
  API_PORT: z.coerce.number().default(3000),
  /** Assina o token de acesso. Menos de 32 caracteres nao e segredo, e chave. */
  AUTH_JWT_SECRET: z.string().min(32),
  GOOGLE_CLIENT_ID: z.string().default(''),
  APPLE_CLIENT_ID: z.string().default(''),
  /** Origens do navegador, separadas por virgula. */
  WEB_ORIGINS: z
    .string()
    .default('')
    .transform((value) =>
      value
        .split(',')
        .map((origin) => origin.trim())
        .filter((origin) => origin.length > 0),
    ),
});

export type Environment = z.infer<typeof environmentSchema>;

export const environment: Environment = environmentSchema.parse(process.env);
