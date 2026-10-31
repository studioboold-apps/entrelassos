/**
 * Pai Presente — API
 * Copyright (c) 2026. Todos os direitos reservados.
 * Licenca: proprietaria.
 */

import { beforeEach, describe, expect, test } from 'bun:test';

import {
  createTestClient,
  KNOWN_ID,
  MISSING_ID,
  OTHER_USER_ID,
  readDataList,
  readDataRecord,
  readErrorCode,
  TEST_USER_ID,
  type TestClient,
} from '../../testing/http-test.util';
import { applyOverrides, buildIdentity, type RowOverrides } from '../../testing/row.factory';
import { ERROR_CODES } from '../shared/errors/codes';
import { HTTP_METHODS } from '../shared/http/http.constant';
import { buildChatMessageRoutes } from './chat-message.controller';
import { createChatMessageUseCases } from './chat-message.use-case';
import type { ChatMessageRow } from './chat-message.table';
import type { ChatMessageRepository } from './types/chat-message.types';

const MESSAGES_PATH = '/v1/chat/messages';
const CONVERSATION_ID = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
const CREATED_ID = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb';

function buildMessageRow(overrides: RowOverrides<ChatMessageRow> = {}): ChatMessageRow {
  return applyOverrides({
    ...buildIdentity(KNOWN_ID),
    userId: TEST_USER_ID,
    conversationId: CONVERSATION_ID,
    role: 'user',
    content: 'Como faco meu filho dormir cedo?',
  }, overrides);
}

function createFakeChatMessageRepository(rows: ChatMessageRow[]): ChatMessageRepository {
  return {
    list: async ({ userId, conversationId, limit, offset }) => {
      const owned = rows.filter(
        (row) => row.userId === userId && row.conversationId === conversationId,
      );
      return { items: owned.slice(offset, offset + limit), total: owned.length };
    },
    listRecent: async ({ userId, conversationId, limit }) =>
      rows
        .filter((row) => row.userId === userId && row.conversationId === conversationId)
        .slice(-limit),
    insert: async ({ userId, values }) => {
      const created = buildMessageRow({ ...buildIdentity(CREATED_ID), userId, ...values });
      rows.push(created);
      return created;
    },
  };
}

let client: TestClient;

beforeEach(() => {
  const rows = [
    buildMessageRow(),
    buildMessageRow({ ...buildIdentity(MISSING_ID), userId: OTHER_USER_ID }),
  ];
  const useCases = createChatMessageUseCases(createFakeChatMessageRepository(rows));
  client = createTestClient({ routes: buildChatMessageRoutes(useCases) });
});

describe('GET /v1/chat/messages', () => {
  test('lista a conversa do usuario', async () => {
    const response = await client.send({
      method: HTTP_METHODS.GET,
      path: `${MESSAGES_PATH}?conversationId=${CONVERSATION_ID}`,
    });
    expect(response.status).toBe(200);
    expect(readDataList(response)).toHaveLength(1);
  });

  test('sem conversationId responde 400 em vez de devolver tudo', async () => {
    const response = await client.send({ method: HTTP_METHODS.GET, path: MESSAGES_PATH });
    expect(response.status).toBe(400);
    expect(readErrorCode(response)).toBe(ERROR_CODES.shared.VALIDATION_FAILED);
  });
});

describe('POST /v1/chat/messages', () => {
  test('grava a mensagem e responde 201', async () => {
    const response = await client.send({
      method: HTTP_METHODS.POST,
      path: MESSAGES_PATH,
      body: { conversationId: CONVERSATION_ID, role: 'assistant', content: 'Vamos por partes.' },
    });
    expect(response.status).toBe(201);
    expect(readDataRecord(response).id).toBe(CREATED_ID);
  });

  test('papel fora do dominio responde 400', async () => {
    const response = await client.send({
      method: HTTP_METHODS.POST,
      path: MESSAGES_PATH,
      body: { conversationId: CONVERSATION_ID, role: 'system', content: 'oi' },
    });
    expect(response.status).toBe(400);
  });
});
