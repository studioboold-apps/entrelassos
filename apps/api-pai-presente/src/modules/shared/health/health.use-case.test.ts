/**
 * Pai Presente — API
 * Copyright (c) 2026. Todos os direitos reservados.
 * Licenca: proprietaria.
 */

import { describe, expect, test } from 'bun:test';

import { HTTP_STATUS } from '../http/http.constant';
import { DATABASE_HEALTH, HEALTH_STATUS, checkHealth, respondWithHealth } from './health.use-case';

describe('a saude responde pelo banco, nao so por si mesma', () => {
  /**
   * Medido em 05/09: `/health` devolvia `{status:'ok'}` fixo, sem tocar no
   * banco. O contêiner subiu saudavel com o banco INALCANCAVEL — e e' esse
   * mesmo endereco que o provedor consulta para decidir se o deploy vingou.
   * Saude que nao pode falhar nao e' medicao, e' enfeite.
   */
  test('banco fora do ar derruba a saude', async () => {
    const result = await checkHealth({
      pingDatabase: () => Promise.reject(new Error('FailedToOpenSocket')),
    });

    expect(result.status).toBe(HEALTH_STATUS.DEGRADED);
    expect(result.database).toBe(DATABASE_HEALTH.UNREACHABLE);
  });

  test('banco respondendo mantem a saude', async () => {
    const result = await checkHealth({ pingDatabase: () => Promise.resolve() });

    expect(result.status).toBe(HEALTH_STATUS.OK);
    expect(result.database).toBe(DATABASE_HEALTH.OK);
  });

  test('degradado sai 503, para o provedor nao promover deploy quebrado', async () => {
    const response = respondWithHealth({
      status: HEALTH_STATUS.DEGRADED,
      database: DATABASE_HEALTH.UNREACHABLE,
    });

    expect(response.status).toBe(HTTP_STATUS.SERVICE_UNAVAILABLE);
  });

  test('saudavel sai 200', async () => {
    const response = respondWithHealth({ status: HEALTH_STATUS.OK, database: DATABASE_HEALTH.OK });

    expect(response.status).toBe(HTTP_STATUS.OK);
  });

  /** Erro de banco na resposta HTTP entrega a topologia (security.md §1). */
  test('a falha nao conta o que o banco disse', async () => {
    const result = await checkHealth({
      pingDatabase: () => Promise.reject(new Error('postgres://paipresente@10.0.0.7 recusou')),
    });
    const body = await respondWithHealth(result).text();

    expect(body).not.toContain('10.0.0.7');
    expect(body).not.toContain('paipresente');
  });
});
