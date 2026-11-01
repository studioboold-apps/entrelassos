/**
 * Pai Presente — API
 * Copyright (c) 2026. Todos os direitos reservados.
 * Licenca: proprietaria.
 */

import { describe, expect, test } from 'bun:test';

import { LlmNotConfiguredError } from '../ai.error';
import { createLlmProvider } from './provider.factory';

const REQUEST = { task: 'chat', systemPrompt: 'sistema', userPrompt: 'pergunta' } as const;

describe('fabrica de provedor de IA', () => {
  /**
   * Sem chave, o provedor nasce RECUSANDO em vez de o boot morrer: a falta de um
   * recurso externo nao pode derrubar filho, atividade e boletim junto.
   */
  test('sem chave, pedir texto recusa com erro de indisponibilidade', async () => {
    const provider = createLlmProvider({ providerName: 'anthropic', apiKey: '', model: '' });

    await expect(provider.generateText(REQUEST)).rejects.toBeInstanceOf(LlmNotConfiguredError);
  });

  test('sem chave, pedir formato estruturado recusa igual', async () => {
    const provider = createLlmProvider({ providerName: 'openai', apiKey: '', model: '' });

    await expect(
      provider.generateStructured({ ...REQUEST, schemaName: 'insights', jsonSchema: {} }),
    ).rejects.toBeInstanceOf(LlmNotConfiguredError);
  });

  /** A recusa nao pode virar o provedor: com chave, quem responde e o de verdade. */
  test.each(['anthropic', 'openai'] as const)('com chave, o provedor %s e o real', (providerName) => {
    expect(createLlmProvider({ providerName, apiKey: 'chave', model: '' }).name).toBe(providerName);
  });
});
