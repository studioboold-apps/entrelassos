/**
 * Pai Presente — API
 * Copyright (c) 2026. Todos os direitos reservados.
 * Licenca: proprietaria.
 */

import { describe, expect, test } from 'bun:test';

import { buildPostgresEnvironment } from './postgres.adapter';

describe('a senha do banco nao vai na linha de comando', () => {
  /**
   * Argumento de processo aparece em `ps` para qualquer usuario da maquina.
   * Passar a URL inteira ao `pg_dump` publicaria a senha do banco de producao no
   * contêiner do job — segredo em terminal e' segredo queimado (`security.md` §4).
   */
  test('a URL vira variaveis de ambiente do libpq', () => {
    const environment = buildPostgresEnvironment('postgres://pai:segredo@localhost:55400/paipresente');

    expect(environment).toEqual({
      PGHOST: 'localhost',
      PGPORT: '55400',
      PGUSER: 'pai',
      PGPASSWORD: 'segredo',
      PGDATABASE: 'paipresente',
    });
  });

  test('porta ausente cai na porta do Postgres, nao em vazio', () => {
    expect(buildPostgresEnvironment('postgres://pai:s@banco/paipresente').PGPORT).toBe('5432');
  });

  /** Senha com `@` ou `/` chega escapada na URL e precisa voltar ao original. */
  test('senha escapada volta ao valor de verdade', () => {
    const environment = buildPostgresEnvironment('postgres://pai:a%40b%2Fc@banco:5432/pp');

    expect(environment.PGPASSWORD).toBe('a@b/c');
  });
});
