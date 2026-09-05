/**
 * Pai Presente — API
 * Copyright (c) 2026. Todos os direitos reservados.
 * Licenca: proprietaria.
 */

import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { describe, expect, test } from 'bun:test';

import {
  readAiEnvironment,
  readDatabaseEnvironment,
  readEnvironment,
} from './environment';

const DATABASE_ONLY = { DATABASE_URL: 'postgres://user:pass@localhost:5432/db' };

describe('fatias de ambiente', () => {
  /**
   * O defeito medido em 05/09/2026: `bun run db:migrate` morria com
   * `ZodError: LLM_API_KEY`. Criar tabela nao gera texto nenhum.
   */
  test('criar tabela nao exige chave de IA', () => {
    expect(readDatabaseEnvironment(DATABASE_ONLY).DATABASE_URL).toBe(
      DATABASE_ONLY.DATABASE_URL,
    );
  });

  test('quem gera texto continua exigindo a chave', () => {
    expect(() => readAiEnvironment(DATABASE_ONLY)).toThrow();
  });

  test('o boot do servidor exige tudo de uma vez', () => {
    expect(() => readEnvironment(DATABASE_ONLY)).toThrow();
  });
});

describe('acoplamento de boot', () => {
  /**
   * Uma fatia so protege enquanto ninguem volta a pedir o pacote inteiro: o
   * defeito nao reaparece como erro de tipo, so como boot que morre.
   */
  test.each([
    ['../database/migrate.ts', 'readDatabaseEnvironment'],
    ['../main.ts', 'readEnvironment'],
  ])('%s le so a fatia dele', (relativePath, expectedReader) => {
    const source = readFileSync(join(import.meta.dir, relativePath), 'utf8');

    expect(source).toContain(expectedReader);
    expect(source).not.toMatch(/import \{ environment \}/);
  });
});
