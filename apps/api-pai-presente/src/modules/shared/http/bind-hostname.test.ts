/**
 * Pai Presente — API
 * Copyright (c) 2026. Todos os direitos reservados.
 * Licenca: proprietaria.
 */

import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { describe, expect, test } from 'bun:test';

import { SERVER_BIND_HOSTNAME } from './http.constant';

/**
 * A rede privada do Railway e' IPv6, e a checagem de saude chega por ela.
 *
 * Medido em 05/09/2026: o container subiu, escreveu `api no ar port=3000`, e
 * ficou cinco minutos recusando a checagem — dez tentativas, todas "service
 * unavailable", ate o deploy ser descartado com o processo VIVO. O padrao do
 * `Bun.serve` e' `0.0.0.0`, que so escuta IPv4: quem chama pelo endereco
 * interno bate numa porta que, daquele lado, nao existe.
 *
 * O sintoma nao fala de IPv6 em nenhum momento — fala de saude. Por isso o
 * endereco de escuta e' constante com nome, e nao um padrao herdado.
 */
const MAIN_SOURCE = readFileSync(join(import.meta.dir, '../../../main.ts'), 'utf8');

describe('a API escuta onde a rede privada chama', () => {
  test('o endereco de escuta e o de todas as interfaces, IPv6 inclusive', () => {
    expect(SERVER_BIND_HOSTNAME).toBe('::');
  });

  test('o servidor usa a constante, e nao o padrao do Bun', () => {
    expect(MAIN_SOURCE).toContain('hostname: SERVER_BIND_HOSTNAME');
  });
});
