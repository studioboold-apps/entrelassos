/**
 * Pai Presente — API
 * Copyright (c) 2026. Todos os direitos reservados.
 * Licenca: proprietaria.
 */

import { describe, expect, test } from 'bun:test';

import { createTestClient, readErrorCode } from '../../../testing/http-test.util';
import { ERROR_CODES } from '../errors/codes';
import { HTTP_METHODS, SECURITY_HEADERS, TRACE_ID_HEADER } from './http.constant';
import { respondWithData } from './response.util';
import type { PublicRouteDefinition, RouteDefinition } from './route.types';

const PING_PATH = '/v1/ping';
const OPEN_PATH = '/v1/aberta';

const publicRoutes: readonly PublicRouteDefinition[] = [
  {
    method: HTTP_METHODS.GET,
    path: OPEN_PATH,
    summary: 'Rota anonima de teste.',
    handle: async () => respondWithData({ aberta: true }),
  },
];

const routes: readonly RouteDefinition[] = [
  {
    method: HTTP_METHODS.GET,
    path: PING_PATH,
    summary: 'Rota de teste.',
    handle: async () => respondWithData({ pong: true }),
  },
  {
    method: HTTP_METHODS.GET,
    path: '/v1/boom',
    summary: 'Rota que estoura por acidente.',
    handle: async () => {
      throw new Error('segredo do servidor');
    },
  },
];

describe('router', () => {
  test('entrega a rota casada ao usuario autenticado', async () => {
    const client = createTestClient({ routes });
    const response = await client.send({ method: HTTP_METHODS.GET, path: PING_PATH });
    expect(response.status).toBe(200);
  });

  test('caminho desconhecido responde 404 com codigo estavel', async () => {
    const client = createTestClient({ routes });
    const response = await client.send({ method: HTTP_METHODS.GET, path: '/v1/inexistente' });
    expect(response.status).toBe(404);
    expect(readErrorCode(response)).toBe(ERROR_CODES.shared.ROUTE_NOT_FOUND);
  });

  test('metodo diferente no mesmo caminho nao casa a rota', async () => {
    const client = createTestClient({ routes });
    const response = await client.send({ method: HTTP_METHODS.DELETE, path: PING_PATH });
    expect(response.status).toBe(404);
  });

  test('sem usuario resolvido responde 401', async () => {
    const client = createTestClient({ routes, user: undefined });
    const response = await client.send({ method: HTTP_METHODS.GET, path: PING_PATH });
    expect(response.status).toBe(401);
    expect(readErrorCode(response)).toBe(ERROR_CODES.shared.UNAUTHENTICATED);
  });

  test('erro inesperado vira 500 generico, sem vazar a mensagem interna', async () => {
    const client = createTestClient({ routes });
    const response = await client.send({ method: HTTP_METHODS.GET, path: '/v1/boom' });
    expect(response.status).toBe(500);
    expect(readErrorCode(response)).toBe(ERROR_CODES.shared.INTERNAL_ERROR);
    expect(JSON.stringify(response.payload)).not.toContain('segredo do servidor');
  });

  test('toda resposta carrega os cabecalhos de seguranca', async () => {
    const client = createTestClient({ routes });
    const response = await client.send({ method: HTTP_METHODS.GET, path: PING_PATH });
    expect(response.status).toBe(200);
    for (const [name, value] of Object.entries(SECURITY_HEADERS)) {
      expect(response.headers.get(name)).toBe(value);
    }
  });
});

describe('rotas publicas', () => {
  test('a rota publica responde sem usuario nenhum', async () => {
    const client = createTestClient({ routes, publicRoutes, user: undefined });
    const response = await client.send({ method: HTTP_METHODS.GET, path: OPEN_PATH });
    expect(response.status).toBe(200);
  });

  test('registrar rota publica NAO abre as rotas da tabela', async () => {
    const client = createTestClient({ routes, publicRoutes, user: undefined });
    const response = await client.send({ method: HTTP_METHODS.GET, path: PING_PATH });
    expect(response.status).toBe(401);
    expect(readErrorCode(response)).toBe(ERROR_CODES.shared.UNAUTHENTICATED);
  });
});

/**
 * O `traceId` era sorteado DENTRO do filtro de excecao: cada erro nascia com um
 * numero novo, que nao aparecia em lugar nenhum e nao ligava a nada. Rastro que
 * o pai nao consegue citar e' rastro que ninguem procura — e sem PII no log
 * (security.md §1), ele e' a UNICA forma de achar a chamada dele.
 */
describe('toda resposta sai com um rastro citavel', () => {
  test('a resposta de sucesso carrega o rastro', async () => {
    const client = createTestClient({ routes });
    const response = await client.send({ method: HTTP_METHODS.GET, path: PING_PATH });

    expect(response.headers.get(TRACE_ID_HEADER)).toMatch(/^[0-9a-f-]{36}$/);
  });

  test('a resposta de erro carrega o rastro, que e la que ele importa', async () => {
    const client = createTestClient({ routes });
    const response = await client.send({ method: HTTP_METHODS.GET, path: '/v1/boom' });

    expect(response.status).toBe(500);
    expect(response.headers.get(TRACE_ID_HEADER)).toMatch(/^[0-9a-f-]{36}$/);
  });

  test('duas chamadas nao compartilham rastro', async () => {
    const client = createTestClient({ routes });
    const first = await client.send({ method: HTTP_METHODS.GET, path: PING_PATH });
    const second = await client.send({ method: HTTP_METHODS.GET, path: PING_PATH });

    expect(first.headers.get(TRACE_ID_HEADER)).not.toBe(second.headers.get(TRACE_ID_HEADER));
  });

  /** O rastro do cabecalho e' o MESMO que foi para o log, senao nao junta nada. */
  test('o rastro do cabecalho e o que o log registrou', async () => {
    const written: string[] = [];
    const originalWrite = process.stdout.write.bind(process.stdout);
    process.stdout.write = ((chunk: string): boolean => {
      written.push(chunk);
      return true;
    }) as typeof process.stdout.write;

    const client = createTestClient({ routes });
    const response = await client.send({ method: HTTP_METHODS.GET, path: '/v1/boom' });
    process.stdout.write = originalWrite;

    const logged = written.map((line) => JSON.parse(line) as { traceId: string });
    expect(logged.map((line) => line.traceId)).toContain(response.headers.get(TRACE_ID_HEADER) ?? '');
  });
});
