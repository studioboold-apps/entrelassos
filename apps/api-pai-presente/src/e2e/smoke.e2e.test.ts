/**
 * Pai Presente — API
 * Copyright (c) 2026. Todos os direitos reservados.
 * Licenca: proprietaria.
 */

import { afterAll, beforeAll, describe, expect, test } from 'bun:test';
import { randomUUID } from 'node:crypto';

import { DEVELOPMENT_AUTH_PROVIDER, SESSIONS_PATH } from '../modules/Auth/auth.constant';
import { HTTP_METHODS, HTTP_STATUS } from '../modules/shared/http/http.constant';
import { startEndToEndApi, type EndToEndApi } from '../testing/e2e-server.util';
import { readDataList, readDataRecord, type TestClient } from '../testing/http-test.util';

/**
 * Este arquivo precisa de Postgres no ar e sobe um processo — nao pode entrar no
 * portao de unidade, que roda sem Docker. O interruptor e EXPLICITO (`make
 * test-e2e` o liga) para o teste nunca ser pulado em silencio por descuido.
 */
const IS_ENABLED = Bun.env.PP_E2E === '1';

const CHILDREN_PATH = '/v1/children';
const ACTIVITIES_PATH = '/v1/activities';
const BOOT_TIMEOUT_MS = 30_000;
const UNAUTHORIZED_STATUS = 401;

/** Identidade nova a cada rodada: o aceite pede independencia de seed e de ordem. */
const RUN_ID = randomUUID();
const PARENT_EMAIL = `e2e-${RUN_ID}@teste.dev`;
const PARENT_ID_TOKEN = `${PARENT_EMAIL}|Pai de Teste`;
const TODAY = new Date().toISOString().slice(0, 10);

function readId(record: Record<string, unknown>): string {
  const { id } = record;
  if (typeof id !== 'string') throw new Error('recurso criado sem id');
  return id;
}

describe.skipIf(!IS_ENABLED)('fumaca ponta a ponta contra a API de verdade', () => {
  let api: EndToEndApi;
  let client: TestClient;
  let childId = '';
  let activityId = '';

  beforeAll(async () => {
    api = await startEndToEndApi();
    client = api.client;
  }, BOOT_TIMEOUT_MS);

  afterAll(async () => {
    await api?.stop();
  });

  test('sem cookie, a lista de filhos e recusada', async () => {
    const response = await client.send({ method: HTTP_METHODS.GET, path: CHILDREN_PATH });

    expect(response.status).toBe(UNAUTHORIZED_STATUS);
  });

  test('entrar abre a sessao e devolve o pai', async () => {
    const response = await client.send({
      method: HTTP_METHODS.POST,
      path: SESSIONS_PATH,
      body: { provider: DEVELOPMENT_AUTH_PROVIDER, idToken: PARENT_ID_TOKEN },
    });

    expect(response.status).toBe(HTTP_STATUS.CREATED);
    expect(readDataRecord(response).user).toMatchObject({ email: PARENT_EMAIL });
  });

  test('criar filho responde 201 com o filho', async () => {
    const response = await client.send({
      method: HTTP_METHODS.POST,
      path: CHILDREN_PATH,
      body: { name: 'Filho de Teste', age: 7, gender: 'masculino' },
    });

    expect(response.status).toBe(HTTP_STATUS.CREATED);
    childId = readId(readDataRecord(response));
  });

  test('listar filhos traz o que acabou de nascer', async () => {
    const response = await client.send({ method: HTTP_METHODS.GET, path: CHILDREN_PATH });

    expect(response.status).toBe(HTTP_STATUS.OK);
    // Procura POR ID, nunca por posicao: posicao amarraria o teste a uma ordem
    // que o aceite proibe justamente para ele sobreviver a banco ja povoado.
    const found = readDataList(response).find((child) => child.id === childId);
    expect(found).toMatchObject({ id: childId, name: 'Filho de Teste' });
  });

  test('criar atividade nasce pendente e ligada ao filho', async () => {
    const response = await client.send({
      method: HTTP_METHODS.POST,
      path: ACTIVITIES_PATH,
      body: { title: `Parquinho ${RUN_ID}`, activityDate: TODAY, childId },
    });

    expect(response.status).toBe(HTTP_STATUS.CREATED);
    const activity = readDataRecord(response);
    expect(activity).toMatchObject({ childId, isCompleted: false });
    activityId = readId(activity);
  });

  test('concluir a atividade PERSISTE, e nao so ecoa', async () => {
    const updated = await client.send({
      method: HTTP_METHODS.PATCH,
      path: `${ACTIVITIES_PATH}/${activityId}`,
      body: { isCompleted: true },
    });
    expect(updated.status).toBe(HTTP_STATUS.OK);
    expect(readDataRecord(updated)).toMatchObject({ id: activityId, isCompleted: true });

    // A releitura e o que separa "a resposta disse que sim" de "o banco guardou".
    const listed = await client.send({ method: HTTP_METHODS.GET, path: ACTIVITIES_PATH });
    const found = readDataList(listed).find((activity) => activity.id === activityId);
    expect(found).toMatchObject({ id: activityId, isCompleted: true });
  });
});
