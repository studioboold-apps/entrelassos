/**
 * Pai Presente — API
 * Copyright (c) 2026. Todos os direitos reservados.
 * Licenca: proprietaria.
 */

import type { z } from 'zod';

import { createLogger } from '../../shared/logger/logger';
import { LLM_TIMEOUT_MS } from '../ai.constant';
import { LlmProviderFailedError, LlmResponseInvalidError } from '../ai.error';

const logger = createLogger({ traceId: 'ai-provider', source: 'ai-provider' });

export type PostJsonParams = {
  readonly url: string;
  readonly headers: Readonly<Record<string, string>>;
  readonly body: unknown;
};

/**
 * Nem a chave nem o corpo entram no log: o corpo carrega a pergunta do pai e o
 * nome dos filhos (security.md §1). So o status vai para o registro.
 */
export async function postJson({ url, headers, body }: PostJsonParams): Promise<unknown> {
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'content-type': 'application/json', ...headers },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(LLM_TIMEOUT_MS),
  }).catch((cause: unknown) => {
    logger.error('provedor de IA inacessivel', {
      reason: cause instanceof Error ? cause.name : 'desconhecido',
    });
    throw new LlmProviderFailedError();
  });

  if (!response.ok) {
    logger.error('provedor de IA recusou', { status: response.status });
    throw new LlmProviderFailedError();
  }
  return response.json();
}

/** Resposta de terceiro e entrada nao confiavel: passa por Zod como qualquer outra. */
export function parseProviderPayload<TSchema extends z.ZodType>(
  schema: TSchema,
  payload: unknown,
): z.infer<TSchema> {
  const result = schema.safeParse(payload);
  if (!result.success) throw new LlmResponseInvalidError();
  return result.data;
}
