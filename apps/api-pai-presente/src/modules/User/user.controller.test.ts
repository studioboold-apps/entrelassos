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
import { UNKNOWN_CLIENT_IP } from '../shared/shared.constant';
import { buildUserRoutes } from './user.controller';
import { ME_EXPORT_PATH, ME_PATH } from './user.constant';
import { createUserUseCases } from './user.use-case';
import type { UserRow } from './user.table';
import type { AccountExport, DeleteUserParams, UserRepository } from './types/user.types';

type RecordedRemoval = { readonly userId: string; readonly clientIp: string };

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

function buildAccountExport(row: UserRow): AccountExport {
  return {
    user: row,
    authIdentities: [],
    children: [],
    activities: [],
    insightRatings: [],
    communityPosts: [],
    communityPostLikes: [],
    communityComments: [],
    chatMessages: [],
  };
}

function createFakeUserRepository(rows: UserRow[], removals: RecordedRemoval[]): UserRepository {
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
    deleteById: async ({ userId, clientIp }: DeleteUserParams) => {
      const index = indexOf(userId);
      if (index < 0) return false;
      rows.splice(index, 1);
      removals.push({ userId, clientIp });
      return true;
    },
    exportAll: async ({ userId }) => {
      const row = rows[indexOf(userId)];
      return row === undefined ? undefined : buildAccountExport(row);
    },
  };
}

function buildClient(rows: UserRow[], removals: RecordedRemoval[]): TestClient {
  return createTestClient({
    routes: buildUserRoutes(createUserUseCases(createFakeUserRepository(rows, removals))),
  });
}

let client: TestClient;
let removals: RecordedRemoval[];

beforeEach(() => {
  removals = [];
  client = buildClient([buildUserRow()], removals);
});

describe('GET /v1/me', () => {
  test('devolve o usuario da sessao', async () => {
    const response = await client.send({ method: HTTP_METHODS.GET, path: ME_PATH });
    expect(response.status).toBe(200);
    expect(readDataRecord(response).email).toBe(TEST_USER.email);
  });

  test('sessao apontando para usuario inexistente responde 404', async () => {
    const orphan = buildClient([{ ...buildUserRow(), ...buildIdentity(MISSING_ID) }], removals);
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

  /**
   * `TL.1`: orientacao sexual, religiosa e politica sao dado sensivel (LGPD
   * art. 11) e nao existem na base nova. O prompt de IA, unico consumidor que
   * elas tinham na Base44, deixou de as pedir.
   *
   * A tela ja parou de perguntar, mas tela se reescreve; a fronteira e' que
   * decide. Sem este teste, uma coluna de volta passaria despercebida — foi
   * exatamente assim que o Perfil ficou um mes oferecendo tres campos que o
   * cliente descartava antes de enviar.
   */
  test('campo de orientacao no corpo responde 400: dado sensivel nao entra', async () => {
    for (const field of ['sexualOrientation', 'religiousOrientation', 'politicalOrientation']) {
      const response = await client.send({
        method: HTTP_METHODS.PATCH,
        path: ME_PATH,
        body: { [field]: 'qualquer' },
      });
      expect(response.status).toBe(400);
      expect(readErrorCode(response)).toBe(ERROR_CODES.shared.VALIDATION_FAILED);
    }
  });
});

/**
 * Art. 18 da LGPD da ao titular ELIMINACAO (inciso VI) e PORTABILIDADE (V), e
 * este produto guarda dado de crianca. Ate aqui `/v1/me` so tinha `GET` e
 * `PATCH`: o pai que quisesse sair teria de pedir por e-mail a alguem que
 * apagasse na mao — o que nao e' direito exercivel, e' favor.
 */
describe('DELETE /v1/me', () => {
  test('apagar responde 204 e a conta deixa de existir', async () => {
    const removed = await client.send({ method: HTTP_METHODS.DELETE, path: ME_PATH });
    expect(removed.status).toBe(204);

    const after = await client.send({ method: HTTP_METHODS.GET, path: ME_PATH });
    expect(after.status).toBe(404);
  });

  test('apagar duas vezes responde 404 na segunda, nao 204 mentindo', async () => {
    await client.send({ method: HTTP_METHODS.DELETE, path: ME_PATH });
    const again = await client.send({ method: HTTP_METHODS.DELETE, path: ME_PATH });

    expect(again.status).toBe(404);
    expect(readErrorCode(again)).toBe(ERROR_CODES.user.USER_NOT_FOUND);
  });

  /**
   * `security.md` §10: a trilha guarda ator, alvo, IP e instante. O IP tem de
   * ATRAVESSAR a rota ate a escrita — foi por nao atravessar que a auditoria
   * de outros produtos nasceu com a coluna sempre vazia.
   */
  test('o endereco de quem pediu chega ate a escrita', async () => {
    await client.send({
      method: HTTP_METHODS.DELETE,
      path: ME_PATH,
      headers: { 'x-forwarded-for': '203.0.113.7, 10.0.0.1' },
    });

    expect(removals).toEqual([{ userId: TEST_USER_ID, clientIp: '203.0.113.7' }]);
  });

  test('sem cabecalho de proxy, a trilha registra que nao sabe o endereco', async () => {
    await client.send({ method: HTTP_METHODS.DELETE, path: ME_PATH });

    expect(removals[0]?.clientIp).toBe(UNKNOWN_CLIENT_IP);
  });
});

describe('GET /v1/me/export', () => {
  /**
   * Portabilidade so vale se vier TUDO: uma secao ausente e' indistinguivel de
   * uma secao vazia para quem recebe o arquivo, e o titular nao tem como saber
   * que faltou. Por isso a chave existe mesmo sem linha nenhuma.
   */
  test('devolve o perfil e todas as secoes, mesmo as vazias', async () => {
    const response = await client.send({ method: HTTP_METHODS.GET, path: ME_EXPORT_PATH });

    expect(response.status).toBe(200);
    const payload = readDataRecord(response);
    expect(payload.user).toMatchObject({ email: TEST_USER.email });
    for (const section of [
      'authIdentities',
      'children',
      'activities',
      'insightRatings',
      'communityPosts',
      'communityPostLikes',
      'communityComments',
      'chatMessages',
    ]) {
      expect(Array.isArray(payload[section])).toBe(true);
    }
  });

  test('conta ja apagada nao exporta nada', async () => {
    await client.send({ method: HTTP_METHODS.DELETE, path: ME_PATH });
    const response = await client.send({ method: HTTP_METHODS.GET, path: ME_EXPORT_PATH });

    expect(response.status).toBe(404);
  });
});
