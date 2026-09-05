/**
 * Pai Presente — API
 * Copyright (c) 2026. Todos os direitos reservados.
 * Licenca: proprietaria.
 */

import { DEFAULT_MODELS, type LlmProviderName } from '../ai.constant';
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

export function createLlmProvider({
  providerName,
  apiKey,
  model,
}: CreateLlmProviderParams): LlmProvider {
  return BUILDERS[providerName]({
    apiKey,
    model: model.length > 0 ? model : DEFAULT_MODELS[providerName],
  });
}
