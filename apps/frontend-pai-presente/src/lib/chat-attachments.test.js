/**
 * Pai Presente — frontend
 * Copyright (c) 2026. Todos os direitos reservados.
 * Licenca: proprietaria.
 */

import { describe, expect, test } from 'bun:test';

import {
  appendTranscript,
  CHAT_IMAGE_MAX_SIDE,
  fitWithin,
  pickVoiceType,
  stripDataUrl,
  toStoredContent,
} from './chat-attachments';

describe('foto do chat', () => {
  test('foto grande reduz pelo lado maior, mantendo a proporcao', () => {
    expect(fitWithin(4032, 3024)).toEqual({ width: CHAT_IMAGE_MAX_SIDE, height: 1176 });
    expect(fitWithin(3024, 4032)).toEqual({ width: 1176, height: CHAT_IMAGE_MAX_SIDE });
  });

  test('foto pequena fica como esta', () => {
    expect(fitWithin(800, 600)).toEqual({ width: 800, height: 600 });
  });

  test('a API recebe so o base64, sem o prefixo data:', () => {
    expect(stripDataUrl('data:image/jpeg;base64,QUJD')).toBe('QUJD');
  });

  test('a conversa gravada lembra que houve foto, mesmo sem texto', () => {
    expect(toStoredContent('  olha isso ', 'Foto')).toBe('📷 olha isso');
    expect(toStoredContent('', 'Foto')).toBe('📷 Foto');
  });
});

describe('audio do chat', () => {
  test('o ditado entra depois do que ja estava escrito', () => {
    expect(appendTranscript('Meu filho', 'tem medo do escuro')).toBe('Meu filho tem medo do escuro');
    expect(appendTranscript('', ' oi ')).toBe('oi');
  });

  test('o formato de gravacao e o primeiro que o aparelho suporta', () => {
    expect(pickVoiceType((type) => type === 'audio/mp4')).toBe('audio/mp4');
    expect(pickVoiceType(() => false)).toBeUndefined();
  });
});
