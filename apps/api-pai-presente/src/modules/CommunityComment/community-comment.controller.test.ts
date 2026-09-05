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
import { buildCommunityCommentRoutes } from './community-comment.controller';
import { createCommunityCommentUseCases } from './community-comment.use-case';
import type {
  CommunityCommentRepository,
  CommunityCommentView,
  PostExistencePort,
} from './types/community-comment.types';

const COMMENTS_PATH = '/v1/community/comments';
const POST_ID = 'eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee';
const FOREIGN_COMMENT_ID = 'ffffffff-ffff-4fff-8fff-ffffffffffff';
const CREATED_ID = '10101010-1010-4010-8010-101010101010';
const AUTHOR_NAME = 'Autor Teste';

function buildCommentRow(overrides: RowOverrides<CommunityCommentView> = {}): CommunityCommentView {
  return applyOverrides({
    ...buildIdentity(KNOWN_ID),
    postId: POST_ID,
    authorId: TEST_USER_ID,
    authorName: AUTHOR_NAME,
    content: 'Passei por isso tambem.',
  }, overrides);
}

/** So POST_ID existe: comentar em post fantasma tem de morrer no use case. */
const postExistence: PostExistencePort = { exists: async (postId) => postId === POST_ID };

function createFakeCommentRepository(rows: CommunityCommentView[]): CommunityCommentRepository {
  return {
    list: async ({ postId, limit, offset }) => {
      const visible = rows.filter((row) => row.postId === postId);
      return { items: visible.slice(offset, offset + limit), total: visible.length };
    },
    insert: async ({ authorId, values }) => {
      const created = buildCommentRow({ ...buildIdentity(CREATED_ID), authorId, ...values });
      rows.push(created);
      return created;
    },
    remove: async ({ commentId, authorId }) => {
      const index = rows.findIndex((row) => row.id === commentId && row.authorId === authorId);
      if (index < 0) return false;
      rows.splice(index, 1);
      return true;
    },
  };
}

let client: TestClient;

beforeEach(() => {
  const rows = [
    buildCommentRow(),
    buildCommentRow({ ...buildIdentity(FOREIGN_COMMENT_ID), authorId: OTHER_USER_ID }),
  ];
  const useCases = createCommunityCommentUseCases({
    repository: createFakeCommentRepository(rows),
    postExistence,
  });
  client = createTestClient({ routes: buildCommunityCommentRoutes(useCases) });
});

describe('GET /v1/community/comments', () => {
  test('lista os comentarios do post', async () => {
    const response = await client.send({
      method: HTTP_METHODS.GET,
      path: `${COMMENTS_PATH}?postId=${POST_ID}`,
    });
    expect(response.status).toBe(200);
    expect(readDataList(response)).toHaveLength(2);
  });

  test('post inexistente responde 404, e nao lista vazia', async () => {
    const response = await client.send({
      method: HTTP_METHODS.GET,
      path: `${COMMENTS_PATH}?postId=${MISSING_ID}`,
    });
    expect(response.status).toBe(404);
    expect(readErrorCode(response)).toBe(ERROR_CODES.community.POST_NOT_FOUND);
  });
});

describe('POST /v1/community/comments', () => {
  test('comenta e responde 201', async () => {
    const response = await client.send({
      method: HTTP_METHODS.POST,
      path: COMMENTS_PATH,
      body: { postId: POST_ID, content: 'Boa!' },
    });
    expect(response.status).toBe(201);
    expect(readDataRecord(response).id).toBe(CREATED_ID);
  });

  test('comentar em post inexistente responde 404', async () => {
    const response = await client.send({
      method: HTTP_METHODS.POST,
      path: COMMENTS_PATH,
      body: { postId: MISSING_ID, content: 'Boa!' },
    });
    expect(response.status).toBe(404);
  });
});

describe('DELETE /v1/community/comments/:commentId', () => {
  test('o autor apaga o proprio comentario', async () => {
    const response = await client.send({
      method: HTTP_METHODS.DELETE,
      path: `${COMMENTS_PATH}/${KNOWN_ID}`,
    });
    expect(response.status).toBe(204);
  });

  test('apagar comentario de outro autor responde 404', async () => {
    const response = await client.send({
      method: HTTP_METHODS.DELETE,
      path: `${COMMENTS_PATH}/${FOREIGN_COMMENT_ID}`,
    });
    expect(response.status).toBe(404);
    expect(readErrorCode(response)).toBe(ERROR_CODES.community.COMMENT_NOT_FOUND);
  });
});
