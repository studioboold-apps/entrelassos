/**
 * Pai Presente — API
 * Copyright (c) 2026. Todos os direitos reservados.
 * Licenca: proprietaria.
 */

import { describe, expect, test } from 'bun:test';

import { ERROR_CODES } from '../shared/errors/codes';
import { HTTP_METHODS, HTTP_STATUS } from '../shared/http/http.constant';
import {
  createFakeAccountRepository,
  createFakeSessionRepository,
  createFakeVerifierRegistry,
  VALID_GOOGLE_TOKEN,
  type FakeSessionRepository,
} from '../../testing/auth-fakes';
import {
  createTestClient,
  readDataRecord,
  readErrorCode,
  type TestClient,
  type TestResponse,
} from '../../testing/http-test.util';
import {
  ACCESS_COOKIE_NAME,
  REFRESH_COOKIE_NAME,
  SESSIONS_PATH,
  type AuthProvider,
} from './auth.constant';
import { buildAuthRoutes } from './auth.controller';
import { createAuthUseCases } from './auth.use-case';
import { createTokenService } from './token.service';

const JWT_SECRET = 'segredo_de_teste_com_mais_de_32_caracteres';

type Harness = {
  readonly client: TestClient;
  readonly sessions: FakeSessionRepository;
};

function createHarness(): Harness {
  const sessions = createFakeSessionRepository();
  const useCases = createAuthUseCases({
    verifiers: createFakeVerifierRegistry(),
    accounts: createFakeAccountRepository(),
    sessions,
    tokenService: createTokenService(JWT_SECRET),
  });
  const client = createTestClient({
    routes: [],
    publicRoutes: buildAuthRoutes({ useCases, isSecureCookie: true }),
    user: undefined,
  });
  return { client, sessions };
}

function readSetCookies(response: TestResponse): readonly string[] {
  return response.headers.getSetCookie();
}

function findCookie(response: TestResponse, name: string): string {
  const cookie = readSetCookies(response).find((value) => value.startsWith(`${name}=`));
  if (cookie === undefined) throw new Error(`resposta sem cookie ${name}`);
  return cookie;
}

function readCookieValue(response: TestResponse, name: string): string {
  const raw = findCookie(response, name);
  const value = raw.slice(name.length + 1, raw.indexOf(';'));
  return decodeURIComponent(value);
}

function signIn(client: TestClient, provider: AuthProvider = 'google'): Promise<TestResponse> {
  return client.send({
    method: HTTP_METHODS.POST,
    path: SESSIONS_PATH,
    body: { provider, idToken: VALID_GOOGLE_TOKEN },
  });
}

function withRefreshCookie(response: TestResponse): Readonly<Record<string, string>> {
  return { Cookie: `${REFRESH_COOKIE_NAME}=${readCookieValue(response, REFRESH_COOKIE_NAME)}` };
}

describe('rotas de sessao', () => {
  test('o login devolve os dois tokens SO em Set-Cookie', async () => {
    const { client } = createHarness();

    const response = await signIn(client);

    expect(response.status).toBe(HTTP_STATUS.CREATED);
    const accessToken = readCookieValue(response, ACCESS_COOKIE_NAME);
    const refreshToken = readCookieValue(response, REFRESH_COOKIE_NAME);
    // O aceite do TB.6: o token nao pode existir em nenhum lugar que o
    // JavaScript da pagina alcance — nem no corpo, nem na URL.
    const body = JSON.stringify(response.payload);
    expect(body).not.toContain(accessToken);
    expect(body).not.toContain(refreshToken);
    expect(SESSIONS_PATH).not.toContain(accessToken);
    expect(readDataRecord(response).user).toMatchObject({ email: 'pai@example.com' });
  });

  test('os cookies sao HttpOnly, Secure e SameSite', async () => {
    const { client } = createHarness();

    const response = await signIn(client);

    for (const name of [ACCESS_COOKIE_NAME, REFRESH_COOKIE_NAME]) {
      const cookie = findCookie(response, name);
      expect(cookie).toContain('HttpOnly');
      expect(cookie).toContain('Secure');
      expect(cookie).toContain('SameSite=Lax');
    }
    // O refresh so viaja na rota que o usa; o de acesso vai em toda chamada.
    expect(findCookie(response, REFRESH_COOKIE_NAME)).toContain('Path=/v1/auth');
    expect(findCookie(response, ACCESS_COOKIE_NAME)).toContain('Path=/');
  });

  test('id_token recusado nao abre sessao nem devolve cookie', async () => {
    const { client } = createHarness();

    const response = await client.send({
      method: HTTP_METHODS.POST,
      path: SESSIONS_PATH,
      body: { provider: 'google', idToken: 'lixo' },
    });

    expect(response.status).toBe(401);
    expect(readErrorCode(response)).toBe(ERROR_CODES.auth.IDENTITY_TOKEN_INVALID);
    expect(readSetCookies(response)).toHaveLength(0);
  });

  test('provedor sem configuracao responde 503, e nao 401', async () => {
    const { client } = createHarness();

    const response = await signIn(client, 'apple');

    expect(response.status).toBe(HTTP_STATUS.SERVICE_UNAVAILABLE);
    expect(readErrorCode(response)).toBe(ERROR_CODES.auth.PROVIDER_NOT_CONFIGURED);
  });

  test('provedor fora da lista e recusado na fronteira', async () => {
    const { client } = createHarness();

    const response = await client.send({
      method: HTTP_METHODS.POST,
      path: SESSIONS_PATH,
      body: { provider: 'facebook', idToken: VALID_GOOGLE_TOKEN },
    });

    expect(response.status).toBe(400);
    expect(readErrorCode(response)).toBe(ERROR_CODES.shared.VALIDATION_FAILED);
  });

  test('entrar duas vezes pelo mesmo provedor nao cria segunda conta', async () => {
    const { client } = createHarness();

    const first = readDataRecord(await signIn(client)).user;
    const second = readDataRecord(await signIn(client)).user;

    expect(second).toEqual(first);
  });
});

describe('rotacao do refresh', () => {
  test('o PUT troca o refresh e o anterior deixa de valer', async () => {
    const { client } = createHarness();
    const login = await signIn(client);

    const rotated = await client.send({
      method: HTTP_METHODS.PUT,
      path: SESSIONS_PATH,
      headers: withRefreshCookie(login),
    });
    expect(rotated.status).toBe(HTTP_STATUS.OK);
    expect(readCookieValue(rotated, REFRESH_COOKIE_NAME)).not.toBe(
      readCookieValue(login, REFRESH_COOKIE_NAME),
    );

    const reused = await client.send({
      method: HTTP_METHODS.PUT,
      path: SESSIONS_PATH,
      headers: withRefreshCookie(login),
    });
    expect(reused.status).toBe(401);
    expect(readErrorCode(reused)).toBe(ERROR_CODES.auth.REFRESH_TOKEN_INVALID);
  });

  test('reapresentar refresh revogado derruba TODAS as sessoes do usuario', async () => {
    const { client, sessions } = createHarness();
    const login = await signIn(client);
    const rotated = await client.send({
      method: HTTP_METHODS.PUT,
      path: SESSIONS_PATH,
      headers: withRefreshCookie(login),
    });
    expect(sessions.countLiveSessions()).toBe(1);

    // Refresh usado duas vezes so acontece com copia: a sessao viva pode ser a
    // do ladrao, entao derruba-se tudo e o dono entra de novo.
    await client.send({
      method: HTTP_METHODS.PUT,
      path: SESSIONS_PATH,
      headers: withRefreshCookie(login),
    });

    expect(sessions.countLiveSessions()).toBe(0);
    const afterTheft = await client.send({
      method: HTTP_METHODS.PUT,
      path: SESSIONS_PATH,
      headers: withRefreshCookie(rotated),
    });
    expect(afterTheft.status).toBe(401);
  });

  test('PUT sem cookie nenhum responde 401', async () => {
    const { client } = createHarness();

    const response = await client.send({ method: HTTP_METHODS.PUT, path: SESSIONS_PATH });

    expect(response.status).toBe(401);
    expect(readErrorCode(response)).toBe(ERROR_CODES.auth.REFRESH_TOKEN_INVALID);
  });
});

describe('saida', () => {
  test('o DELETE apaga os dois cookies e revoga a sessao', async () => {
    const { client, sessions } = createHarness();
    const login = await signIn(client);

    const response = await client.send({
      method: HTTP_METHODS.DELETE,
      path: SESSIONS_PATH,
      headers: withRefreshCookie(login),
    });

    expect(response.status).toBe(HTTP_STATUS.NO_CONTENT);
    expect(sessions.countLiveSessions()).toBe(0);
    for (const name of [ACCESS_COOKIE_NAME, REFRESH_COOKIE_NAME]) {
      expect(findCookie(response, name)).toContain('Max-Age=0');
    }
  });

  test('sair sem cookie ainda apaga os cookies do navegador', async () => {
    const { client } = createHarness();

    const response = await client.send({ method: HTTP_METHODS.DELETE, path: SESSIONS_PATH });

    expect(response.status).toBe(HTTP_STATUS.NO_CONTENT);
    expect(readSetCookies(response)).toHaveLength(2);
  });
});
