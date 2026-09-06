/**
 * Pai Presente — API
 * Copyright (c) 2026. Todos os direitos reservados.
 * Licenca: proprietaria.
 */

import { describe, expect, test } from 'bun:test';

import { isUniqueViolation } from './postgres-error';

/**
 * A forma abaixo NAO foi inventada: e a que o Postgres de verdade produziu em
 * 06/09/2026, lida com `Object.keys` no erro que o Drizzle deixou passar. O
 * teste existe para que o portao de unidade, que roda sem Docker, ainda proteja
 * a leitura — o e2e prova que a forma e essa, e este prova que a leitura casa.
 */
function measuredDrizzleError(): unknown {
  const driverError = Object.assign(new Error('duplicate key value violates unique constraint'), {
    name: 'PostgresError',
    code: 'ERR_POSTGRES_SERVER_ERROR',
    errno: '23505',
    constraint: 'users_email_unique',
  });
  return Object.assign(new Error('Failed query'), { name: 'Error', cause: driverError });
}

describe('o unique_violation e reconhecido atraves das embalagens', () => {
  test('o erro medido do Drizzle sobre o driver do Bun e reconhecido', () => {
    expect(isUniqueViolation(measuredDrizzleError())).toBe(true);
  });

  /** A casca do Drizzle sozinha nao tem `code`: quem le so ela nunca acerta. */
  test('a casca do Drizzle sem cause nao e confundida com violacao', () => {
    expect(isUniqueViolation(Object.assign(new Error('Failed query'), { name: 'Error' }))).toBe(false);
  });

  /** Driver que volte a por o SQLSTATE em `code` continua entendido. */
  test('o SQLSTATE em code tambem conta', () => {
    expect(isUniqueViolation(Object.assign(new Error('x'), { code: '23505' }))).toBe(true);
  });

  test('outra falha do banco nao vira e-mail repetido', () => {
    const other = Object.assign(new Error('x'), { code: 'ERR_POSTGRES_SERVER_ERROR', errno: '23503' });
    expect(isUniqueViolation(Object.assign(new Error('Failed query'), { cause: other }))).toBe(false);
  });

  test('erro que nao e objeto nao quebra a leitura', () => {
    expect(isUniqueViolation('deu ruim')).toBe(false);
    expect(isUniqueViolation(undefined)).toBe(false);
  });

  /** Corrente sem fim nao existe, mas cause circular ja apareceu em driver. */
  test('cause circular nao prende a leitura', () => {
    const loop: Record<string, unknown> = { code: 'X' };
    loop.cause = loop;
    expect(isUniqueViolation(loop)).toBe(false);
  });
});
