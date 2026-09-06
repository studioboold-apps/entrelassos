/**
 * Pai Presente — API
 * Copyright (c) 2026. Todos os direitos reservados.
 * Licenca: proprietaria.
 */

import { afterAll, beforeAll, describe, expect, test } from 'bun:test';
import { randomUUID } from 'node:crypto';

import { PASSWORD_AUTH_PROVIDER, REGISTRATIONS_PATH, SESSIONS_PATH } from '../modules/Auth/auth.constant';
import { ERROR_CODES } from '../modules/shared/errors/codes';
import { HTTP_METHODS, HTTP_STATUS } from '../modules/shared/http/http.constant';
import { startEndToEndApi, type EndToEndApi } from '../testing/e2e-server.util';
import { readDataRecord, type TestClient } from '../testing/http-test.util';

/**
 * O teste de rota (`auth.controller.test.ts`) cobre e-mail repetido com um
 * repositorio de mentira que LANCA `EmailAlreadyRegisteredError` de proposito.
 * Ele prova o que o controlador faz com o erro, e nao prova a unica coisa que
 * so o Postgres decide: se o `unique_violation` VIRA aquele erro.
 *
 * Medido em 06/09/2026 no app publicado: cadastro repetido respondia
 * `500 INTERNAL_ERROR` em vez de `409`. A leitura do codigo de erro do driver
 * estava errada, e nenhum teste de unidade podia ver isso — nenhum deles fala
 * com um banco de verdade.
 */
const IS_ENABLED = Bun.env.PP_E2E === '1';

const BOOT_TIMEOUT_MS = 30_000;
/** `HTTP_STATUS` nao declara 401 — a recusa de login mora em `auth.error.ts`. */
const UNAUTHORIZED_STATUS = 401;
const RUN_ID = randomUUID();
const EMAIL = `senha-${RUN_ID}@teste.dev`;
/** Acima do piso de `PASSWORD_MIN_LENGTH`; o valor exato nao importa aqui. */
const PASSWORD = `senha-de-teste-${RUN_ID}`;

describe.skipIf(!IS_ENABLED)('entrar por e-mail e senha, contra o banco de verdade', () => {
  let api: EndToEndApi;
  let client: TestClient;

  beforeAll(async () => {
    api = await startEndToEndApi();
    client = api.client;
  }, BOOT_TIMEOUT_MS);

  afterAll(async () => {
    await api?.stop();
  });

  test('cadastrar cria a conta e ja abre a sessao', async () => {
    const response = await client.send({
      method: HTTP_METHODS.POST,
      path: REGISTRATIONS_PATH,
      body: { email: EMAIL, password: PASSWORD, fullName: 'Pai de Teste' },
    });

    expect(response.status).toBe(HTTP_STATUS.CREATED);
    expect(readDataRecord(response).user).toMatchObject({ email: EMAIL });
  });

  /**
   * O 409 nao e enfeite: a tela ANCORA a frase "este e-mail ja tem conta" no
   * campo de e-mail lendo este codigo (`use-sign-in.js`). Com 500 generico ela
   * cai no aviso de rodape, que nao diz a quem cadastrou de novo o que fazer.
   */
  test('cadastrar o MESMO e-mail responde 409 com o codigo estavel', async () => {
    const response = await client.send({
      method: HTTP_METHODS.POST,
      path: REGISTRATIONS_PATH,
      body: { email: EMAIL, password: PASSWORD },
    });

    expect(response.status).toBe(HTTP_STATUS.CONFLICT);
    expect(response.payload).toMatchObject({
      error: { code: ERROR_CODES.auth.EMAIL_ALREADY_REGISTERED },
    });
  });

  test('entrar com a senha certa abre a sessao', async () => {
    const response = await client.send({
      method: HTTP_METHODS.POST,
      path: SESSIONS_PATH,
      body: { provider: PASSWORD_AUTH_PROVIDER, email: EMAIL, password: PASSWORD },
    });

    expect(response.status).toBe(HTTP_STATUS.CREATED);
    expect(readDataRecord(response).user).toMatchObject({ email: EMAIL });
  });

  /** A recusa e a MESMA de e-mail desconhecido: dizer "senha errada" confirmaria a conta. */
  test('entrar com a senha errada recusa sem contar o motivo', async () => {
    const response = await client.send({
      method: HTTP_METHODS.POST,
      path: SESSIONS_PATH,
      body: { provider: PASSWORD_AUTH_PROVIDER, email: EMAIL, password: `${PASSWORD}-errada` },
    });

    expect(response.status).toBe(UNAUTHORIZED_STATUS);
    expect(response.payload).toMatchObject({
      error: { code: ERROR_CODES.auth.IDENTITY_TOKEN_INVALID },
    });
  });

  test('e-mail desconhecido recusa com a MESMA resposta da senha errada', async () => {
    const response = await client.send({
      method: HTTP_METHODS.POST,
      path: SESSIONS_PATH,
      body: { provider: PASSWORD_AUTH_PROVIDER, email: `ninguem-${randomUUID()}@teste.dev`, password: PASSWORD },
    });

    expect(response.status).toBe(UNAUTHORIZED_STATUS);
    expect(response.payload).toMatchObject({
      error: { code: ERROR_CODES.auth.IDENTITY_TOKEN_INVALID },
    });
  });
});
