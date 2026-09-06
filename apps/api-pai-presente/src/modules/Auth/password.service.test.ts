/**
 * Pai Presente — API
 * Copyright (c) 2026. Todos os direitos reservados.
 * Licenca: proprietaria.
 */

import { describe, expect, test } from 'bun:test';

import { PASSWORD_HASH_LENGTH, PASSWORD_MAX_LENGTH } from './auth.constant';
import { createPasswordHasher } from './password.service';

const PASSWORD = 'senha-comprida-de-teste';

/**
 * Poucos casos, e de proposito: cada `hash` aqui e' `argon2id` de verdade,
 * e o custo que protege a senha e' o mesmo que faria a suite arrastar. O resto
 * do modulo usa `createFakePasswordHasher`.
 */
describe('o hash de senha', () => {
  test('nao guarda a senha, e nao repete o mesmo hash', async () => {
    const hasher = createPasswordHasher();

    const first = await hasher.hash(PASSWORD);
    const second = await hasher.hash(PASSWORD);

    expect(first).not.toContain(PASSWORD);
    // Sal proprio por hash: dois iguais denunciariam hash sem sal.
    expect(first).not.toBe(second);
  });

  /** Hash maior que a coluna e' truncado pelo banco, e ninguem mais entra. */
  test('o hash da senha mais longa aceita cabe na coluna', async () => {
    const hasher = createPasswordHasher();

    const hash = await hasher.hash('x'.repeat(PASSWORD_MAX_LENGTH));

    expect(hash.length).toBeLessThanOrEqual(PASSWORD_HASH_LENGTH);
  });

  test('a senha certa passa e a errada nao', async () => {
    const hasher = createPasswordHasher();
    const passwordHash = await hasher.hash(PASSWORD);

    expect(await hasher.verify({ password: PASSWORD, passwordHash })).toBe(true);
    expect(await hasher.verify({ password: 'outra-senha-comprida', passwordHash })).toBe(false);
  });
});

describe('a conta que nao existe custa o mesmo tempo', () => {
  /**
   * Sem hash de mentira, o "nao existe" volta em microssegundos e o "senha
   * errada" em dezenas de milissegundos — e o relogio do atacante passa a
   * dizer quais e-mails tem conta aqui. Por isso o caminho sem hash tambem
   * verifica algo.
   *
   * O piso e' baixo de proposito: o que se afirma e' que houve trabalho de
   * `argon2id`, nao um numero de milissegundos que a maquina de CI decide.
   */
  test('verificar sem hash guardado ainda gasta trabalho', async () => {
    const hasher = createPasswordHasher();

    const startedAt = performance.now();
    const result = await hasher.verify({ password: PASSWORD, passwordHash: undefined });
    const elapsed = performance.now() - startedAt;

    expect(result).toBe(false);
    expect(elapsed).toBeGreaterThan(1);
  });
});
