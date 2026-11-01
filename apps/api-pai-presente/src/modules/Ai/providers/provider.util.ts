/**
 * Pai Presente — API
 * Copyright (c) 2026. Todos os direitos reservados.
 * Licenca: proprietaria.
 */

import type { z } from 'zod';

import { createLogger } from '../../shared/logger/logger';
import { LLM_TIMEOUT_MS } from '../ai.constant';
import { LlmProviderFailedError, LlmResponseInvalidError } from '../ai.error';
import type { LlmTurn } from '../types/ai.types';

const logger = createLogger({ traceId: 'ai-provider', source: 'ai-provider' });

export type PostJsonParams = {
  readonly url: string;
  readonly headers: Readonly<Record<string, string>>;
  readonly body: unknown;
  /** Teto proprio para chamadas que podem ser puladas (ex.: busca na web). */
  readonly timeoutMs?: number;
};

/**
 * Nem a chave nem o corpo entram no log: o corpo carrega a pergunta do pai e o
 * nome dos filhos (security.md §1). So o status vai para o registro.
 */
export async function postJson({ url, headers, body, timeoutMs = LLM_TIMEOUT_MS }: PostJsonParams): Promise<unknown> {
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'content-type': 'application/json', ...headers },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(timeoutMs),
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

/**
 * A conversa gravada nem sempre alterna certinho: uma pergunta cuja resposta
 * falhou deixa duas falas do pai seguidas, e um corte pelo limite pode comecar
 * numa fala do mentor. Os provedores querem a conversa comecando pelo pai, e a
 * Anthropic junta falas seguidas do mesmo lado de qualquer jeito — juntar aqui
 * deixa as duas pontas iguais e o teste enxergando o que vai na rede.
 *
 * O resultado termina SEMPRE numa fala do mentor (ou vazio): quem chama poe a
 * pergunta atual depois.
 */
export function toAlternatingTurns(history: readonly LlmTurn[]): readonly LlmTurn[] {
  const turns: LlmTurn[] = [];
  for (const turn of history) {
    if (turn.content.trim().length === 0) continue;
    if (turns.length === 0 && turn.role !== 'user') continue;
    const last = turns.at(-1);
    if (last !== undefined && last.role === turn.role) {
      turns[turns.length - 1] = { role: turn.role, content: `${last.content}\n\n${turn.content}` };
    } else {
      turns.push(turn);
    }
  }
  while (turns.at(-1)?.role === 'user') turns.pop();
  return turns;
}
