/**
 * Pai Presente — API
 * Copyright (c) 2026. Todos os direitos reservados.
 * Licenca: proprietaria.
 */

import { afterEach, describe, expect, test } from 'bun:test';

import { createAnthropicProvider } from './anthropic.provider';
import { createOpenAiProvider } from './openai.provider';
import { toAlternatingTurns } from './provider.util';

describe('conversa enviada ao provedor', () => {
  test('comeca pelo pai, alterna, e termina numa fala do mentor', () => {
    expect(
      toAlternatingTurns([
        { role: 'assistant', content: 'corte no meio' },
        { role: 'user', content: 'a' },
        { role: 'user', content: 'b' },
        { role: 'assistant', content: 'c' },
        { role: 'user', content: 'sem resposta' },
      ]),
    ).toEqual([
      { role: 'user', content: 'a\n\nb' },
      { role: 'assistant', content: 'c' },
    ]);
  });
});

const originalFetch = globalThis.fetch;
afterEach(() => {
  globalThis.fetch = originalFetch;
});

/** Guarda o corpo que iria para a rede e responde como o provedor responderia. */
function captureBody(reply: unknown): { readonly bodies: Record<string, unknown>[] } {
  const bodies: Record<string, unknown>[] = [];
  globalThis.fetch = (async (_url: string, init: RequestInit) => {
    bodies.push(JSON.parse(String(init.body)) as Record<string, unknown>);
    return Response.json(reply);
  }) as typeof fetch;
  return { bodies };
}

const REQUEST = {
  systemPrompt: 'sistema',
  userPrompt: 'pergunta',
  history: [
    { role: 'user', content: 'antes' },
    { role: 'assistant', content: 'resposta' },
  ],
  images: [{ mediaType: 'image/jpeg', data: 'QUJD' }],
} as const;

describe('formato na rede', () => {
  test('anthropic: historico antes, foto como bloco de imagem antes do texto', async () => {
    const { bodies } = captureBody({ content: [{ type: 'text', text: 'ok' }] });

    await createAnthropicProvider({ apiKey: 'k', model: 'm' }).generateText(REQUEST);

    expect(bodies[0]?.messages).toEqual([
      { role: 'user', content: 'antes' },
      { role: 'assistant', content: 'resposta' },
      {
        role: 'user',
        content: [
          { type: 'image', source: { type: 'base64', media_type: 'image/jpeg', data: 'QUJD' } },
          { type: 'text', text: 'pergunta' },
        ],
      },
    ]);
  });

  test('openai: foto vira data URL', async () => {
    const { bodies } = captureBody({ choices: [{ message: { content: 'ok' } }] });

    await createOpenAiProvider({ apiKey: 'k', model: 'm' }).generateText(REQUEST);

    const messages = bodies[0]?.messages as readonly Record<string, unknown>[];
    expect(messages).toHaveLength(4);
    expect(messages[3]).toEqual({
      role: 'user',
      content: [
        { type: 'image_url', image_url: { url: 'data:image/jpeg;base64,QUJD' } },
        { type: 'text', text: 'pergunta' },
      ],
    });
  });

  test('sem historico nem foto, a pergunta segue como texto puro', async () => {
    const { bodies } = captureBody({ content: [{ type: 'text', text: 'ok' }] });

    await createAnthropicProvider({ apiKey: 'k', model: 'm' }).generateText({
      systemPrompt: 's',
      userPrompt: 'p',
    });

    expect(bodies[0]?.messages).toEqual([{ role: 'user', content: 'p' }]);
  });
});
