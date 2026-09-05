/**
 * Pai Presente — API
 * Copyright (c) 2026. Todos os direitos reservados.
 * Licenca: proprietaria.
 */

import { beforeEach, describe, expect, test } from 'bun:test';

import {
  createTestClient,
  MISSING_ID,
  readDataRecord,
  readErrorCode,
  TEST_USER,
  TEST_USER_ID,
  type TestClient,
} from '../../testing/http-test.util';
import { applyOverrides, buildIdentity } from '../../testing/row.factory';
import { ERROR_CODES } from '../shared/errors/codes';
import { HTTP_METHODS } from '../shared/http/http.constant';
import { buildUserRoutes } from './user.controller';
import { createUserUseCases } from './user.use-case';
import type { UserRow } from './user.table';
import type { UserRepository } from './types/user.types';

const ME_PATH = '/v1/me';

function buildUserRow(): UserRow {
  return {
    ...buildIdentity(TEST_USER_ID),
    email: TEST_USER.email,
    fullName: 'Joao',
    age: 34,
    maritalStatus: null,
    onboardingCompleted: false,
  };
}

function createFakeUserRepository(rows: UserRow[]): UserRepository {
  const indexOf = (userId: string): number => rows.findIndex((row) => row.id === userId);
  return {
    findById: async ({ userId }) => rows[indexOf(userId)],
    update: async ({ userId, values }) => {
      const index = indexOf(userId);
      const current = rows[index];
      if (current === undefined) return undefined;
      const updated: UserRow = applyOverrides(current, values);
      rows[index] = updated;
      return updated;
    },
  };
}

function buildClient(rows: UserRow[]): TestClient {
  return createTestClient({ routes: buildUserRoutes(createUserUseCases(createFakeUserRepository(rows))) });
}

let client: TestClient;

beforeEach(() => {
  client = buildClient([buildUserRow()]);
});

describe('GET /v1/me', () => {
  test('devolve o usuario da sessao', async () => {
    const response = await client.send({ method: HTTP_METHODS.GET, path: ME_PATH });
    expect(response.status).toBe(200);
    expect(readDataRecord(response).email).toBe(TEST_USER.email);
  });

  test('sessao apontando para usuario inexistente responde 404', async () => {
    const orphan = buildClient([{ ...buildUserRow(), ...buildIdentity(MISSING_ID) }]);
    const response = await orphan.send({ method: HTTP_METHODS.GET, path: ME_PATH });
    expect(response.status).toBe(404);
    expect(readErrorCode(response)).toBe(ERROR_CODES.user.USER_NOT_FOUND);
  });
});

describe('PATCH /v1/me', () => {
  test('conclui o onboarding', async () => {
    const response = await client.send({
      method: HTTP_METHODS.PATCH,
      path: ME_PATH,
      body: { onboardingCompleted: true },
    });
    expect(response.status).toBe(200);
    expect(readDataRecord(response).onboardingCompleted).toBe(true);
  });

  test('email no corpo responde 400: identidade vem da sessao, nao do cliente', async () => {
    const response = await client.send({
      method: HTTP_METHODS.PATCH,
      path: ME_PATH,
      body: { email: 'outro@exemplo.com' },
    });
    expect(response.status).toBe(400);
    expect(readErrorCode(response)).toBe(ERROR_CODES.shared.VALIDATION_FAILED);
  });
});
