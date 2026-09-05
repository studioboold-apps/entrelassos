/**
 * Pai Presente — API
 * Copyright (c) 2026. Todos os direitos reservados.
 * Licenca: proprietaria.
 */

import { z } from 'zod';

import { LLM_PROVIDERS } from '../modules/Ai/ai.constant';

type EnvironmentSource = Record<string, string | undefined>;

const runtimeShape = {
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
} as const;

const databaseShape = {
  DATABASE_URL: z.string().min(1),
} as const;

const httpShape = {
  API_PORT: z.coerce.number().default(3000),
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
} as const;

const authShape = {
  /** Assina o token de acesso. Menos de 32 caracteres nao e segredo, e chave. */
  AUTH_JWT_SECRET: z.string().min(32),
  GOOGLE_CLIENT_ID: z.string().default(''),
  APPLE_CLIENT_ID: z.string().default(''),
} as const;

const aiShape = {
  /**
   * Provedor de IA. Sem default silencioso: subir com o provedor errado gasta
   * dinheiro na conta errada, e o erro so apareceria na primeira pergunta.
   */
  LLM_PROVIDER: z.enum(LLM_PROVIDERS),
  /** Chave do provedor. So no servidor — nunca com prefixo `VITE_`. */
  LLM_API_KEY: z.string().min(1),
  /** Vazio usa o modelo padrao do provedor (`DEFAULT_MODELS`). */
  LLM_MODEL: z.string().default(''),
} as const;

const databaseEnvironmentSchema = z.object({ ...runtimeShape, ...databaseShape });
const aiEnvironmentSchema = z.object({ ...runtimeShape, ...aiShape });
const environmentSchema = z.object({
  ...runtimeShape,
  ...databaseShape,
  ...httpShape,
  ...authShape,
  ...aiShape,
});

export type DatabaseEnvironment = z.infer<typeof databaseEnvironmentSchema>;
export type AiEnvironment = z.infer<typeof aiEnvironmentSchema>;
export type Environment = z.infer<typeof environmentSchema>;

/**
 * Um schema unico para o processo inteiro faz cada tarefa carregar as exigencias
 * de todas as outras: a migration morria por falta de chave de IA, e criar
 * tabela nao gera texto nenhum. Cada entrada le so a fatia que usa.
 */
export function readDatabaseEnvironment(
  source: EnvironmentSource = process.env,
): DatabaseEnvironment {
  return databaseEnvironmentSchema.parse(source);
}

export function readAiEnvironment(
  source: EnvironmentSource = process.env,
): AiEnvironment {
  return aiEnvironmentSchema.parse(source);
}

/** O boot do servidor precisa de tudo, e falha antes de aceitar a primeira chamada. */
export function readEnvironment(source: EnvironmentSource = process.env): Environment {
  return environmentSchema.parse(source);
}
