/**
 * Pai Presente — API
 * Copyright (c) 2026. Todos os direitos reservados.
 * Licenca: proprietaria.
 */

import { describe, expect, test } from 'bun:test';

import { createTestClient, readErrorCode } from '../../../testing/http-test.util';
import { ERROR_CODES } from '../errors/codes';
import { HTTP_METHODS, SECURITY_HEADERS } from './http.constant';
import { respondWithData } from './response.util';
import type { RouteDefinition } from './route.types';

const PING_PATH = '/v1/ping';

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
    const router = await client.send({ method: HTTP_METHODS.GET, path: PING_PATH });
    expect(router.status).toBe(200);
    expect(SECURITY_HEADERS['X-Frame-Options']).toBe('DENY');
  });
});
