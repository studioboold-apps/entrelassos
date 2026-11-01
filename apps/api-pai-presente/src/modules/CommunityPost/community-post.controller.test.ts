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
  type RawTestClient,
} from '../../testing/http-test.util';
import { applyOverrides, buildIdentity, type RowOverrides } from '../../testing/row.factory';
import { ERROR_CODES } from '../shared/errors/codes';
import { HTTP_METHODS } from '../shared/http/http.constant';
import { splitImageDataUrl } from '../shared/shared.schema';
import { buildCommunityPostRoutes } from './community-post.controller';
import { createCommunityPostUseCases } from './community-post.use-case';
import type {
  CommunityPostRepository,
  CommunityPostView,
} from './types/community-post.types';

const POSTS_PATH = '/v1/community/posts';
const FOREIGN_POST_ID = 'cccccccc-cccc-4ccc-8ccc-cccccccccccc';
const CREATED_ID = 'dddddddd-dddd-4ddd-8ddd-dddddddddddd';
const AUTHOR_NAME = 'Autor Teste';

function buildPostView(overrides: RowOverrides<CommunityPostView> = {}): CommunityPostView {
  return applyOverrides({
    ...buildIdentity(KNOWN_ID),
    authorId: TEST_USER_ID,
    authorName: AUTHOR_NAME,
    content: 'Levei meu filho ao parque hoje.',
    category: 'experiencia',
    likesCount: 0,
    hasLiked: false,
    commentsCount: 0,
    hasImage: false,
  }, overrides);
}

/** As curtidas vivem em linhas; likesCount e hasLiked saem delas, nunca de coluna. */
function createFakePostRepository(
  posts: CommunityPostView[],
  likes: Set<string>,
): CommunityPostRepository {
  const likeKey = (postId: string, userId: string): string => `${postId}:${userId}`;
  const project = (post: CommunityPostView, viewerId: string): CommunityPostView => ({
    ...post,
    likesCount: [...likes].filter((key) => key.startsWith(`${post.id}:`)).length,
    hasLiked: likes.has(likeKey(post.id, viewerId)),
  });

  const images = new Map<string, { contentType: string; base64: string }>();

  return {
    findImage: async (postId) => images.get(postId),
    list: async ({ viewerId, filters, limit, offset }) => {
      const visible = posts.filter(
        (post) => filters.category === undefined || post.category === filters.category,
      );
      return {
        items: visible.slice(offset, offset + limit).map((post) => project(post, viewerId)),
        total: visible.length,
      };
    },
    findById: async ({ postId, viewerId }) => {
      const post = posts.find((row) => row.id === postId);
      return post === undefined ? undefined : project(post, viewerId);
    },
    exists: async (postId) => posts.some((post) => post.id === postId),
    insert: async ({ authorId, values }) => {
      const { image, ...fields } = values;
      if (image !== undefined) images.set(CREATED_ID, splitImageDataUrl(image));
      const created = buildPostView({
        ...buildIdentity(CREATED_ID),
        authorId,
        ...fields,
        hasImage: image !== undefined,
      });
      posts.push(created);
      return created;
    },
    addLike: async ({ postId, userId }) => {
      likes.add(likeKey(postId, userId));
    },
    removeLike: async ({ postId, userId }) => {
      likes.delete(likeKey(postId, userId));
    },
    remove: async ({ postId, authorId }) => {
      const index = posts.findIndex((post) => post.id === postId && post.authorId === authorId);
      if (index < 0) return false;
      posts.splice(index, 1);
      return true;
    },
  };
}

const JPEG_BYTES = Buffer.from([0xff, 0xd8, 0xff, 0xe0, 0, 16, 0x4a, 0x46, 0x49, 0x46, 0, 1]);
const JPEG_DATA_URL = `data:image/jpeg;base64,${JPEG_BYTES.toString('base64')}`;

let client: RawTestClient;

beforeEach(() => {
  const posts = [
    buildPostView(),
    buildPostView({ ...buildIdentity(FOREIGN_POST_ID), authorId: OTHER_USER_ID }),
  ];
  const useCases = createCommunityPostUseCases(createFakePostRepository(posts, new Set()));
  client = createTestClient({ routes: buildCommunityPostRoutes(useCases) });
});

describe('GET /v1/community/posts', () => {
  test('a comunidade e publica: lista tambem o post de outro autor', async () => {
    const response = await client.send({ method: HTTP_METHODS.GET, path: POSTS_PATH });
    expect(response.status).toBe(200);
    expect(readDataList(response)).toHaveLength(2);
  });

  test('categoria invalida no filtro responde 400', async () => {
    const response = await client.send({
      method: HTTP_METHODS.GET,
      path: `${POSTS_PATH}?category=inexistente`,
    });
    expect(response.status).toBe(400);
    expect(readErrorCode(response)).toBe(ERROR_CODES.shared.VALIDATION_FAILED);
  });
});

describe('POST /v1/community/posts', () => {
  test('publica e responde 201', async () => {
    const response = await client.send({
      method: HTTP_METHODS.POST,
      path: POSTS_PATH,
      body: { content: 'Primeira noite dormindo sozinho.', category: 'conquista' },
    });
    expect(response.status).toBe(201);
    expect(readDataRecord(response).id).toBe(CREATED_ID);
  });

  test('sem categoria responde 400', async () => {
    const response = await client.send({
      method: HTTP_METHODS.POST,
      path: POSTS_PATH,
      body: { content: 'Sem categoria.' },
    });
    expect(response.status).toBe(400);
  });
});

describe('GET /v1/community/posts/:postId', () => {
  test('detalha o post', async () => {
    const response = await client.send({ method: HTTP_METHODS.GET, path: `${POSTS_PATH}/${KNOWN_ID}` });
    expect(response.status).toBe(200);
    expect(readDataRecord(response).commentsCount).toBe(0);
  });

  /** O nome do autor vem do JOIN: sem ele o card da comunidade renderiza em branco. */
  test('o post carrega o nome do autor', async () => {
    const response = await client.send({ method: HTTP_METHODS.GET, path: `${POSTS_PATH}/${KNOWN_ID}` });
    expect(readDataRecord(response).authorName).toBe(AUTHOR_NAME);
  });

  test('post inexistente responde 404', async () => {
    const response = await client.send({
      method: HTTP_METHODS.GET,
      path: `${POSTS_PATH}/${MISSING_ID}`,
    });
    expect(response.status).toBe(404);
    expect(readErrorCode(response)).toBe(ERROR_CODES.community.POST_NOT_FOUND);
  });
});

describe('curtida', () => {
  test('PUT curte e o contador sobe pela linha, nao por coluna', async () => {
    const response = await client.send({
      method: HTTP_METHODS.PUT,
      path: `${POSTS_PATH}/${KNOWN_ID}/like`,
    });
    expect(response.status).toBe(200);
    expect(readDataRecord(response).likesCount).toBe(1);
    expect(readDataRecord(response).hasLiked).toBe(true);
  });

  test('PUT duas vezes nao curte duas vezes', async () => {
    await client.send({ method: HTTP_METHODS.PUT, path: `${POSTS_PATH}/${KNOWN_ID}/like` });
    const response = await client.send({
      method: HTTP_METHODS.PUT,
      path: `${POSTS_PATH}/${KNOWN_ID}/like`,
    });
    expect(readDataRecord(response).likesCount).toBe(1);
  });

  test('DELETE descurte', async () => {
    await client.send({ method: HTTP_METHODS.PUT, path: `${POSTS_PATH}/${KNOWN_ID}/like` });
    const response = await client.send({
      method: HTTP_METHODS.DELETE,
      path: `${POSTS_PATH}/${KNOWN_ID}/like`,
    });
    expect(readDataRecord(response).likesCount).toBe(0);
  });

  test('curtir post inexistente responde 404', async () => {
    const response = await client.send({
      method: HTTP_METHODS.PUT,
      path: `${POSTS_PATH}/${MISSING_ID}/like`,
    });
    expect(response.status).toBe(404);
  });
});

describe('DELETE /v1/community/posts/:postId', () => {
  test('o autor apaga o proprio post', async () => {
    const response = await client.send({
      method: HTTP_METHODS.DELETE,
      path: `${POSTS_PATH}/${KNOWN_ID}`,
    });
    expect(response.status).toBe(204);
  });

  test('apagar post de outro autor responde 404', async () => {
    const response = await client.send({
      method: HTTP_METHODS.DELETE,
      path: `${POSTS_PATH}/${FOREIGN_POST_ID}`,
    });
    expect(response.status).toBe(404);
    expect(readErrorCode(response)).toBe(ERROR_CODES.community.POST_NOT_FOUND);
  });
});

describe('foto do post', () => {
  test('publica com foto: o post diz que tem foto, e a foto volta pela rota propria', async () => {
    const created = await client.send({
      method: HTTP_METHODS.POST,
      path: POSTS_PATH,
      body: { content: 'Olha o castelo de areia.', category: 'conquista', image: JPEG_DATA_URL },
    });
    expect(created.status).toBe(201);
    expect(readDataRecord(created).hasImage).toBe(true);
    expect(readDataRecord(created)).not.toHaveProperty('image');

    const image = await client.sendRaw({ method: HTTP_METHODS.GET, path: `${POSTS_PATH}/${CREATED_ID}/image` });
    expect(image.status).toBe(200);
    expect(image.headers.get('content-type')).toBe('image/jpeg');
    expect(Buffer.from(image.bytes).equals(JPEG_BYTES)).toBe(true);
  });

  test('SVG disfarcado de foto responde 400', async () => {
    const response = await client.send({
      method: HTTP_METHODS.POST,
      path: POSTS_PATH,
      body: { content: 'x', category: 'dica', image: 'data:image/svg+xml;base64,PHN2Zz4=' },
    });
    expect(response.status).toBe(400);
  });

  test('post sem foto: a rota da foto responde 404', async () => {
    const response = await client.sendRaw({ method: HTTP_METHODS.GET, path: `${POSTS_PATH}/${KNOWN_ID}/image` });
    expect(response.status).toBe(404);
  });
});
