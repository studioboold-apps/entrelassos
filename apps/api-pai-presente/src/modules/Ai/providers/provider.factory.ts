/**
 * Pai Presente — API
 * Copyright (c) 2026. Todos os direitos reservados.
 * Licenca: proprietaria.
 */

import { DEFAULT_MODELS, type LlmProviderName } from '../ai.constant';
import { LlmNotConfiguredError } from '../ai.error';
import type { LlmProvider } from '../types/ai.types';
import { createAnthropicProvider } from './anthropic.provider';
import { createOpenAiProvider } from './openai.provider';

export type CreateLlmProviderParams = {
  readonly providerName: LlmProviderName;
  readonly apiKey: string;
  /** Vazio cai no modelo padrao do provedor; o nome do modelo muda mais que o codigo. */
  readonly model: string;
};

const BUILDERS = {
  anthropic: createAnthropicProvider,
  openai: createOpenAiProvider,
} as const satisfies Record<LlmProviderName, (params: { apiKey: string; model: string }) => LlmProvider>;

/**
 * Sem chave, ninguem chama a rede: a chamada sairia com credencial vazia e
 * voltaria 502, como se o terceiro tivesse falhado. Recusar aqui, uma vez so,
 * vale para as quatro rotas de IA.
 */
function createUnconfiguredProvider(providerName: LlmProviderName): LlmProvider {
  // `async` de proposito: o contrato devolve promessa, e quem chama trata a
  // falha com `catch` — lancar sincrono escaparia desse caminho.
  async function refuse(): Promise<never> {
    throw new LlmNotConfiguredError(providerName);
  }
  return { name: providerName, generateText: refuse, generateStructured: refuse };
}

export function createLlmProvider({
  providerName,
  apiKey,
  model,
}: CreateLlmProviderParams): LlmProvider {
  if (apiKey.length === 0) return createUnconfiguredProvider(providerName);

  return BUILDERS[providerName]({
    apiKey,
    model: model.length > 0 ? model : DEFAULT_MODELS[providerName],
  });
}
