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

export type TestClient = {
  send(params: SendParams): Promise<TestResponse>;
};

export type CreateTestClientParams = {
  readonly routes: readonly RouteDefinition[];
  readonly publicRoutes?: readonly PublicRouteDefinition[] | undefined;
  readonly user?: AuthenticatedUser | undefined;
};

export function createTestClient(params: CreateTestClientParams): TestClient {
  // 'user' presente e undefined significa anonimo; ausente significa o padrao.
  // Valor default nao distingue os dois, e foi assim que o teste de 401 passou verde.
  const user = 'user' in params ? params.user : TEST_USER;
  const router = createRouter({
    routes: params.routes,
    publicRoutes: params.publicRoutes,
    authenticatedUserResolver: { resolve: async () => user },
  });

  return {
    async send({ method, path, body, headers }: SendParams): Promise<TestResponse> {
      const requestHeaders = new Headers(headers);
      if (body !== undefined) requestHeaders.set('content-type', 'application/json');
      const init: RequestInit =
        body === undefined
          ? { method, headers: requestHeaders }
          : {
              method,
              body: typeof body === 'string' ? body : JSON.stringify(body),
              headers: requestHeaders,
            };
      const response = await router.handle(new Request(`http://localhost${path}`, init));
      const text = await response.text();
      return {
        status: response.status,
        payload: text.length > 0 ? JSON.parse(text) : undefined,
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
