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
import type { ChildFilePurgePort } from '../shared/child-file-purge.interface';
import type { ChildRepository } from './types/child.types';

const CHILDREN_PATH = '/v1/children';
const CREATED_ID = '55555555-5555-4555-8555-555555555555';

/** O IP entra na trilha do exame apagado, e vem do cabecalho do proxy. */
const CLIENT_IP = '203.0.113.7';
const PROXY_HEADERS = { 'x-forwarded-for': CLIENT_IP } as const;

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
    listContext: async (userId) =>
      rows
        .filter((row) => row.userId === userId)
        .map(({ name, age, gender }) => ({ name, age, gender })),
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

type PurgeCall = {
  readonly childId: string;
  readonly userId: string;
  readonly clientIp: string;
  /**
   * Se a linha do filho ainda estava la' na hora da varredura, os BYTES sairam
   * antes dela. E' a unica forma de afirmar a ordem sem espiar o codigo: uma
   * dupla que so' contasse chamadas ficaria verde com a ordem invertida.
   */
  readonly rowWasStillThere: boolean;
};

let client: TestClient;
let purgeCalls: PurgeCall[];

beforeEach(() => {
  const rows = [buildChildRow(), buildChildRow({ ...buildIdentity(MISSING_ID), userId: OTHER_USER_ID })];
  purgeCalls = [];
  const childFiles: ChildFilePurgePort = {
    purgeByChild: async ({ childId, userId, clientIp }) => {
      purgeCalls.push({ childId, userId, clientIp, rowWasStillThere: rows.some((row) => row.id === childId) });
    },
  };
  client = createTestClient({
    routes: buildChildRoutes(createChildUseCases({ repository: createFakeChildRepository(rows), childFiles })),
  });
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

  /**
   * `ON DELETE CASCADE` apaga as LINHAS dos arquivos e nenhum byte. Sem esta
   * varredura, o album e os exames do filho apagado ficariam no balde sem
   * ninguem capaz de nomea-los — `MediaStorage` nao tem `list()`.
   */
  test('os bytes do balde saem ANTES da linha do filho', async () => {
    const response = await client.send({
      method: HTTP_METHODS.DELETE,
      path: `${CHILDREN_PATH}/${KNOWN_ID}`,
      headers: PROXY_HEADERS,
    });

    expect(response.status).toBe(204);
    expect(purgeCalls).toHaveLength(1);
    expect(purgeCalls[0]).toEqual({
      childId: KNOWN_ID,
      userId: TEST_USER_ID,
      clientIp: CLIENT_IP,
      rowWasStillThere: true,
    });
  });

  /**
   * A varredura e' escopada por quem PEDIU, nunca pelo dono da linha: e' isso
   * que faz o apagamento de filho alheio varrer o proprio nada em vez do album
   * do vizinho (BOLA, OWASP API1).
   */
  test('apagar filho de outro pai varre no escopo de quem pediu', async () => {
    await client.send({
      method: HTTP_METHODS.DELETE,
      path: `${CHILDREN_PATH}/${MISSING_ID}`,
      headers: PROXY_HEADERS,
    });

    expect(purgeCalls).toHaveLength(1);
    expect(purgeCalls[0]?.userId).toBe(TEST_USER_ID);
  });
});
