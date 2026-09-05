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
  readPagination,
  TEST_USER_ID,
  type TestClient,
} from '../../testing/http-test.util';
import { applyOverrides, buildIdentity, type RowOverrides } from '../../testing/row.factory';
import { ERROR_CODES } from '../shared/errors/codes';
import { HTTP_METHODS } from '../shared/http/http.constant';
import { buildChildRoutes } from './child.controller';
import { createChildUseCases } from './child.use-case';
import type { ChildRow } from './child.table';
import type { ChildRepository } from './types/child.types';

const CHILDREN_PATH = '/v1/children';
const CREATED_ID = '55555555-5555-4555-8555-555555555555';

function buildChildRow(overrides: RowOverrides<ChildRow> = {}): ChildRow {
  return applyOverrides({
    ...buildIdentity(KNOWN_ID),
    userId: TEST_USER_ID,
    name: 'Ana',
    age: 7,
    gender: 'feminino',
    birthDate: null,
    favoriteHobby: null,
    favoriteColor: null,
    favoriteFood: null,
    favoriteMovieGenre: null,
  }, overrides);
}

function createFakeChildRepository(rows: ChildRow[]): ChildRepository {
  const indexOf = (childId: string, userId: string): number =>
    rows.findIndex((row) => row.id === childId && row.userId === userId);

  return {
    list: async ({ userId, limit, offset }) => {
      const owned = rows.filter((row) => row.userId === userId);
      return { items: owned.slice(offset, offset + limit), total: owned.length };
    },
    findById: async ({ childId, userId }) => rows[indexOf(childId, userId)],
    insert: async (row) => {
      const created = buildChildRow({
        ...buildIdentity(CREATED_ID),
        userId: row.userId,
        name: row.name,
        age: row.age,
        gender: row.gender,
      });
      rows.push(created);
      return created;
    },
    update: async ({ childId, userId, values }) => {
      const index = indexOf(childId, userId);
      const current = rows[index];
      if (current === undefined) return undefined;
      const updated: ChildRow = applyOverrides(current, values);
      rows[index] = updated;
      return updated;
    },
    remove: async ({ childId, userId }) => {
      const index = indexOf(childId, userId);
      if (index < 0) return false;
      rows.splice(index, 1);
      return true;
    },
  };
}

let client: TestClient;

beforeEach(() => {
  const rows = [buildChildRow(), buildChildRow({ ...buildIdentity(MISSING_ID), userId: OTHER_USER_ID })];
  client = createTestClient({ routes: buildChildRoutes(createChildUseCases(createFakeChildRepository(rows))) });
});

describe('GET /v1/children', () => {
  test('lista os filhos do usuario com paginacao', async () => {
    const response = await client.send({ method: HTTP_METHODS.GET, path: CHILDREN_PATH });
    expect(response.status).toBe(200);
    expect(readDataList(response)).toHaveLength(1);
    expect(readPagination(response).total).toBe(1);
  });

  test('nao lista filho de outro usuario', async () => {
    const response = await client.send({ method: HTTP_METHODS.GET, path: CHILDREN_PATH });
    const ids = readDataList(response).map((row) => row.id);
    expect(ids).not.toContain(MISSING_ID);
  });
});

describe('POST /v1/children', () => {
  test('cria o filho e responde 201', async () => {
    const response = await client.send({
      method: HTTP_METHODS.POST,
      path: CHILDREN_PATH,
      body: { name: 'Bento', age: 5, gender: 'masculino' },
    });
    expect(response.status).toBe(201);
    expect(readDataRecord(response).id).toBe(CREATED_ID);
  });

  test('recusa genero fora do dominio com 400', async () => {
    const response = await client.send({
      method: HTTP_METHODS.POST,
      path: CHILDREN_PATH,
      body: { name: 'Bento', age: 5, gender: 'inexistente' },
    });
    expect(response.status).toBe(400);
    expect(readErrorCode(response)).toBe(ERROR_CODES.shared.VALIDATION_FAILED);
  });
});

describe('GET /v1/children/:childId', () => {
  test('devolve o filho do usuario', async () => {
    const response = await client.send({ method: HTTP_METHODS.GET, path: `${CHILDREN_PATH}/${KNOWN_ID}` });
    expect(response.status).toBe(200);
    expect(readDataRecord(response).name).toBe('Ana');
  });

  test('filho de outro usuario responde 404, nao 403', async () => {
    const response = await client.send({ method: HTTP_METHODS.GET, path: `${CHILDREN_PATH}/${MISSING_ID}` });
    expect(response.status).toBe(404);
    expect(readErrorCode(response)).toBe(ERROR_CODES.child.CHILD_NOT_FOUND);
  });
});

describe('PATCH /v1/children/:childId', () => {
  test('atualiza o campo enviado', async () => {
    const response = await client.send({
      method: HTTP_METHODS.PATCH,
      path: `${CHILDREN_PATH}/${KNOWN_ID}`,
      body: { favoriteColor: 'azul' },
    });
    expect(response.status).toBe(200);
    expect(readDataRecord(response).favoriteColor).toBe('azul');
  });

  test('campo desconhecido no corpo responde 400', async () => {
    const response = await client.send({
      method: HTTP_METHODS.PATCH,
      path: `${CHILDREN_PATH}/${KNOWN_ID}`,
      body: { userId: OTHER_USER_ID },
    });
    expect(response.status).toBe(400);
  });
});

describe('DELETE /v1/children/:childId', () => {
  test('remove e responde 204 sem corpo', async () => {
    const response = await client.send({ method: HTTP_METHODS.DELETE, path: `${CHILDREN_PATH}/${KNOWN_ID}` });
    expect(response.status).toBe(204);
    expect(response.payload).toBeUndefined();
  });

  test('remover filho de outro usuario responde 404', async () => {
    const response = await client.send({ method: HTTP_METHODS.DELETE, path: `${CHILDREN_PATH}/${MISSING_ID}` });
    expect(response.status).toBe(404);
  });
});
