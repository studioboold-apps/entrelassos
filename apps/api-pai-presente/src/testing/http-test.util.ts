/**
 * Pai Presente — API
 * Copyright (c) 2026. Todos os direitos reservados.
 * Licenca: proprietaria.
 */

import type { AuthenticatedUser } from '../modules/shared/auth/authenticated-user.interface';
import type { PublicRouteDefinition, RouteDefinition } from '../modules/shared/http/route.types';
import { createRouter } from '../modules/shared/http/router';

export const TEST_USER_ID = '11111111-1111-4111-8111-111111111111';
export const OTHER_USER_ID = '22222222-2222-4222-8222-222222222222';
export const TEST_USER: AuthenticatedUser = { userId: TEST_USER_ID, email: 'pai@example.com' };

export const KNOWN_ID = '33333333-3333-4333-8333-333333333333';
export const MISSING_ID = '44444444-4444-4444-8444-444444444444';

export type TestResponse = {
  readonly status: number;
  readonly payload: unknown;
  readonly headers: Headers;
};

export type SendParams = {
  readonly method: string;
  readonly path: string;
  readonly body?: unknown;
  readonly headers?: Readonly<Record<string, string>> | undefined;
};

/**
 * Resposta que NAO e' JSON. Existe porque uma rota deste produto serve arquivo
 * (`GET .../files/:fileId/content`), e ler o corpo dela com `JSON.parse`
 * estoura no primeiro byte de um PDF.
 */
export type RawTestResponse = {
  readonly status: number;
  readonly bytes: Uint8Array;
  readonly headers: Headers;
};

export type TestClient = {
  send(params: SendParams): Promise<TestResponse>;
};

/**
 * Ler bytes e' capacidade OPCIONAL POR PRESENCA, nao um metodo que todo cliente
 * de teste tem de ter: o cliente do E2E fala por rede com pote de cookies e
 * nunca busca arquivo, e obriga-lo a um segundo caminho de leitura de corpo
 * seria encanamento que nada exercita.
 */
export type RawTestClient = TestClient & {
  sendRaw(params: SendParams): Promise<RawTestResponse>;
};

export type CreateTestClientParams = {
  readonly routes: readonly RouteDefinition[];
  readonly publicRoutes?: readonly PublicRouteDefinition[] | undefined;
  readonly user?: AuthenticatedUser | undefined;
};

export function createTestClient(params: CreateTestClientParams): RawTestClient {
  // 'user' presente e undefined significa anonimo; ausente significa o padrao.
  // Valor default nao distingue os dois, e foi assim que o teste de 401 passou verde.
  const user = 'user' in params ? params.user : TEST_USER;
  const router = createRouter({
    routes: params.routes,
    publicRoutes: params.publicRoutes,
    authenticatedUserResolver: { resolve: async () => user },
  });

  function buildRequest({ method, path, body, headers }: SendParams): Request {
    const requestHeaders = new Headers(headers);
    // `FormData` passa INTEIRO, sem `content-type` nosso: quem escreve o
    // cabecalho com a fronteira certa e' o `Request`. Forcar json aqui fazia o
    // upload chegar ao controlador como a string "[object FormData]".
    const isFormData = body instanceof FormData;
    if (body !== undefined && !isFormData) requestHeaders.set('content-type', 'application/json');
    const init: RequestInit =
      body === undefined
        ? { method, headers: requestHeaders }
        : {
            method,
            body: isFormData || typeof body === 'string' ? (body as RequestInit['body']) : JSON.stringify(body),
            headers: requestHeaders,
          };
    return new Request(`http://localhost${path}`, init);
  }

  return {
    async send(params: SendParams): Promise<TestResponse> {
      const response = await router.handle(buildRequest(params));
      const text = await response.text();
      return {
        status: response.status,
        payload: text.length > 0 ? JSON.parse(text) : undefined,
        headers: response.headers,
      };
    },

    async sendRaw(params: SendParams): Promise<RawTestResponse> {
      const response = await router.handle(buildRequest(params));
      return {
        status: response.status,
        bytes: new Uint8Array(await response.arrayBuffer()),
        headers: response.headers,
      };
    },
  };
}

function asRecord(value: unknown): Record<string, unknown> {
  if (typeof value !== 'object' || value === null) throw new Error('resposta nao e objeto');
  return value as Record<string, unknown>;
}

export function readData(response: TestResponse): unknown {
  const payload = asRecord(response.payload);
  if (!('data' in payload)) throw new Error('resposta sem envelope { data }');
  return payload.data;
}

export function readDataRecord(response: TestResponse): Record<string, unknown> {
  return asRecord(readData(response));
}

export function readDataList(response: TestResponse): readonly Record<string, unknown>[] {
  const data = readData(response);
  if (!Array.isArray(data)) throw new Error('envelope de lista sem array em data');
  return data.map(asRecord);
}

export function readPagination(response: TestResponse): Record<string, unknown> {
  const payload = asRecord(response.payload);
  if (!('pagination' in payload)) throw new Error('lista sem pagination');
  return asRecord(payload.pagination);
}

export function readErrorCode(response: TestResponse): string {
  const payload = asRecord(response.payload);
  if (!('error' in payload)) throw new Error('resposta sem envelope { error }');
  const error = asRecord(payload.error);
  if (typeof error.code !== 'string') throw new Error('erro sem code');
  return error.code;
}
