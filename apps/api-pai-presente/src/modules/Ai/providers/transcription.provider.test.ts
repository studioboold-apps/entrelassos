/**
 * Pai Presente — API
 * Copyright (c) 2026. Todos os direitos reservados.
 * Licenca: proprietaria.
 */

import { afterEach, describe, expect, test } from 'bun:test';

import { AudioInvalidError, LlmProviderFailedError, TranscriptionNotConfiguredError } from '../ai.error';
import { createTranscriber } from './transcription.provider';

const WEBM = { contentType: 'audio/webm', extension: 'webm' } as const;
const AUDIO = new Uint8Array([0x1a, 0x45, 0xdf, 0xa3]);

const originalFetch = globalThis.fetch;
afterEach(() => {
  globalThis.fetch = originalFetch;
});

function respondWith(status: number, body: unknown): { readonly urls: string[] } {
  const urls: string[] = [];
  globalThis.fetch = (async (url: string | URL) => {
    urls.push(String(url));
    return Response.json(body, { status });
  }) as typeof fetch;
  return { urls };
}

describe('transcricao pelo pacote da casa (Groq)', () => {
  test('a voz volta como texto, pelo Groq', async () => {
    const { urls } = respondWith(200, { text: ' Como faco ele dormir cedo? ' });

    const text = await createTranscriber({ apiKey: 'k', model: '' }).transcribe({ audio: AUDIO, format: WEBM });

    expect(text).toBe('Como faco ele dormir cedo?');
    expect(urls[0]).toContain('api.groq.com');
  });

  test('silencio vira aviso para o pai, nao erro do servidor', async () => {
    respondWith(200, { text: '' });

    await expect(
      createTranscriber({ apiKey: 'k', model: '' }).transcribe({ audio: AUDIO, format: WEBM }),
    ).rejects.toBeInstanceOf(AudioInvalidError);
  });

  test('provedor fora do ar e 502, culpa do terceiro', async () => {
    respondWith(500, { error: { message: 'boom' } });

    await expect(
      createTranscriber({ apiKey: 'k', model: '' }).transcribe({ audio: AUDIO, format: WEBM }),
    ).rejects.toBeInstanceOf(LlmProviderFailedError);
  });

  test('sem chave, ninguem chama a rede', async () => {
    const { urls } = respondWith(200, { text: 'nao devia' });

    await expect(
      createTranscriber({ apiKey: '', model: '' }).transcribe({ audio: AUDIO, format: WEBM }),
    ).rejects.toBeInstanceOf(TranscriptionNotConfiguredError);
    expect(urls).toHaveLength(0);
  });
});
