/**
 * Pai Presente — frontend
 * Copyright (c) 2026. Todos os direitos reservados.
 * Licenca: proprietaria.
 */

import { describe, expect, test } from 'bun:test';

import { toConversationId, toScreenMessages } from './chat-history';

const FATHER_ID = '3f1c6d2a-8b4e-4f77-9c21-0d5a7e6b1234';
const OTHER_FATHER_ID = 'a7d90e14-2c33-4b58-8e6f-91b2c4d5e678';

describe('toConversationId', () => {
  /**
   * A conversa com o mentor e' UMA so, continua, por pai. Sortear um id novo a
   * cada abertura, ou guarda-lo no navegador, perderia o historico no primeiro
   * celular diferente — que e' exatamente o defeito §4.2 voltando por outra
   * porta.
   */
  test('o mesmo pai volta sempre para a mesma conversa', () => {
    expect(toConversationId(FATHER_ID)).toBe(toConversationId(FATHER_ID));
  });

  test('pais diferentes nao compartilham conversa', () => {
    expect(toConversationId(FATHER_ID)).not.toBe(toConversationId(OTHER_FATHER_ID));
  });
});

describe('toScreenMessages', () => {
  const STORED_ROWS = [
    {
      id: 'c1',
      user_id: FATHER_ID,
      conversation_id: FATHER_ID,
      role: 'user',
      content: 'Como lidar com birra?',
      createdAt: '2026-09-04T10:00:00.000Z',
    },
    {
      id: 'c2',
      user_id: FATHER_ID,
      conversation_id: FATHER_ID,
      role: 'assistant',
      content: 'Comece nomeando o sentimento.',
      createdAt: '2026-09-04T10:00:04.000Z',
    },
  ];

  test('a conversa guardada volta na ordem em que foi dita', () => {
    expect(toScreenMessages(STORED_ROWS)).toEqual([
      { role: 'user', content: 'Como lidar com birra?' },
      { role: 'assistant', content: 'Comece nomeando o sentimento.' },
    ]);
  });

  /**
   * A tela desenha por `message.role`; qualquer campo a mais vindo do banco so
   * teria como ser usado por engano.
   */
  test('nada do banco alem de papel e texto chega a tela', () => {
    expect(Object.keys(toScreenMessages(STORED_ROWS)[0])).toEqual(['role', 'content']);
  });
});
