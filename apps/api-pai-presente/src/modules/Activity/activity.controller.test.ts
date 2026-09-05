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
import { buildActivityRoutes } from './activity.controller';
import { createActivityUseCases } from './activity.use-case';
import type { ActivityRepository, ActivityView, ChildOwnershipPort } from './types/activity.types';

const ACTIVITIES_PATH = '/v1/activities';
const CREATED_ID = '66666666-6666-4666-8666-666666666666';
const OWNED_CHILD_ID = '77777777-7777-4777-8777-777777777777';
const FOREIGN_CHILD_ID = '88888888-8888-4888-8888-888888888888';
const ACTIVITY_DATE = '2026-03-10';

function buildActivityView(overrides: RowOverrides<ActivityView> = {}): ActivityView {
  return applyOverrides({
    ...buildIdentity(KNOWN_ID),
    userId: TEST_USER_ID,
    childId: OWNED_CHILD_ID,
    title: 'Pique-esconde',
    description: null,
    activityDate: ACTIVITY_DATE,
    activityTime: null,
    category: null,
    isSuggested: false,
    isCompleted: false,
    rating: null,
    feedback: null,
    childName: 'Ana',
  }, overrides);
}

/** So o filho OWNED_CHILD_ID pertence ao usuario do teste. */
const childOwnership: ChildOwnershipPort = {
  isOwnedByUser: async ({ childId, userId }) =>
    childId === OWNED_CHILD_ID && userId === TEST_USER_ID,
};

function createFakeActivityRepository(rows: ActivityView[]): ActivityRepository {
  const indexOf = (activityId: string, userId: string): number =>
    rows.findIndex((row) => row.id === activityId && row.userId === userId);

  return {
    list: async ({ userId, limit, offset }) => {
      const owned = rows.filter((row) => row.userId === userId);
      return { items: owned.slice(offset, offset + limit), total: owned.length };
    },
    findById: async ({ activityId, userId }) => rows[indexOf(activityId, userId)],
    listMonthDigest: async ({ userId, month }) =>
      rows
        .filter((row) => row.userId === userId && row.activityDate.startsWith(month))
        .map(({ category, isCompleted, rating }) => ({ category, isCompleted, rating })),
    insert: async (row) => {
      const created = buildActivityView({
        ...buildIdentity(CREATED_ID),
        userId: row.userId,
        title: row.title,
        activityDate: row.activityDate,
      });
      rows.push(created);
      return created;
    },
    update: async ({ activityId, userId, values }) => {
      const index = indexOf(activityId, userId);
      const current = rows[index];
      if (current === undefined) return undefined;
      const updated: ActivityView = applyOverrides(current, values);
      rows[index] = updated;
      return updated;
    },
    remove: async ({ activityId, userId }) => {
      const index = indexOf(activityId, userId);
      if (index < 0) return false;
      rows.splice(index, 1);
      return true;
    },
  };
}

let client: TestClient;

beforeEach(() => {
  const rows = [
    buildActivityView(),
    buildActivityView({ ...buildIdentity(MISSING_ID), userId: OTHER_USER_ID }),
  ];
  const useCases = createActivityUseCases({
    repository: createFakeActivityRepository(rows),
    childOwnership,
  });
  client = createTestClient({ routes: buildActivityRoutes(useCases) });
});

describe('GET /v1/activities', () => {
  test('devolve o childName vindo do vinculo, nao de coluna copiada', async () => {
    const response = await client.send({ method: HTTP_METHODS.GET, path: ACTIVITIES_PATH });
    expect(response.status).toBe(200);
    expect(readDataList(response)[0]?.childName).toBe('Ana');
  });

  test('nao lista atividade de outro usuario', async () => {
    const response = await client.send({ method: HTTP_METHODS.GET, path: ACTIVITIES_PATH });
    expect(readDataList(response).map((row) => row.id)).not.toContain(MISSING_ID);
  });

  test('filtro invalido na query responde 400', async () => {
    const response = await client.send({
      method: HTTP_METHODS.GET,
      path: `${ACTIVITIES_PATH}?childId=nao-e-uuid`,
    });
    expect(response.status).toBe(400);
    expect(readErrorCode(response)).toBe(ERROR_CODES.shared.VALIDATION_FAILED);
  });
});

describe('POST /v1/activities', () => {
  test('cria a atividade e responde 201', async () => {
    const response = await client.send({
      method: HTTP_METHODS.POST,
      path: ACTIVITIES_PATH,
      body: { title: 'Parque', activityDate: ACTIVITY_DATE, childId: OWNED_CHILD_ID },
    });
    expect(response.status).toBe(201);
    expect(readDataRecord(response).id).toBe(CREATED_ID);
  });

  test('filho de outro usuario no corpo responde 403 (BOLA)', async () => {
    const response = await client.send({
      method: HTTP_METHODS.POST,
      path: ACTIVITIES_PATH,
      body: { title: 'Parque', activityDate: ACTIVITY_DATE, childId: FOREIGN_CHILD_ID },
    });
    expect(response.status).toBe(403);
    expect(readErrorCode(response)).toBe(ERROR_CODES.activity.ACTIVITY_CHILD_NOT_OWNED);
  });
});

describe('/v1/activities/:activityId', () => {
  test('GET devolve a atividade do usuario', async () => {
    const response = await client.send({
      method: HTTP_METHODS.GET,
      path: `${ACTIVITIES_PATH}/${KNOWN_ID}`,
    });
    expect(response.status).toBe(200);
    expect(readDataRecord(response).title).toBe('Pique-esconde');
  });

  test('GET de atividade alheia responde 404', async () => {
    const response = await client.send({
      method: HTTP_METHODS.GET,
      path: `${ACTIVITIES_PATH}/${MISSING_ID}`,
    });
    expect(response.status).toBe(404);
    expect(readErrorCode(response)).toBe(ERROR_CODES.activity.ACTIVITY_NOT_FOUND);
  });

  test('PATCH conclui a atividade', async () => {
    const response = await client.send({
      method: HTTP_METHODS.PATCH,
      path: `${ACTIVITIES_PATH}/${KNOWN_ID}`,
      body: { isCompleted: true, rating: 5 },
    });
    expect(response.status).toBe(200);
    expect(readDataRecord(response).isCompleted).toBe(true);
  });

  test('PATCH com nota fora de 1..5 responde 400', async () => {
    const response = await client.send({
      method: HTTP_METHODS.PATCH,
      path: `${ACTIVITIES_PATH}/${KNOWN_ID}`,
      body: { rating: 9 },
    });
    expect(response.status).toBe(400);
  });

  test('DELETE remove e responde 204', async () => {
    const response = await client.send({
      method: HTTP_METHODS.DELETE,
      path: `${ACTIVITIES_PATH}/${KNOWN_ID}`,
    });
    expect(response.status).toBe(204);
  });

  test('DELETE de atividade alheia responde 404', async () => {
    const response = await client.send({
      method: HTTP_METHODS.DELETE,
      path: `${ACTIVITIES_PATH}/${MISSING_ID}`,
    });
    expect(response.status).toBe(404);
  });
});
