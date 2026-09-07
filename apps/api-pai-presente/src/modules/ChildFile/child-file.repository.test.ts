/**
 * Pai Presente — API
 * Copyright (c) 2026. Todos os direitos reservados.
 * Licenca: proprietaria.
 */

import { describe, expect, test } from 'bun:test';
import type { SQL } from 'drizzle-orm';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { createDatabaseClient } from '../../database/client';
import { childFilesTable } from './child-file.table';
import {
  buildChildScope,
  buildFileScope,
  buildUserScope,
  createChildFileRepository,
} from './child-file.repository';

/**
 * O cliente e' construido com uma URL que nao existe, e NENHUM teste aqui
 * conecta: `toSQL()` monta a consulta sem ir ao banco. E' o que permite medir o
 * SQL de verdade — nao uma imitacao dele — num teste que roda em 5ms e na CI
 * sem Postgres.
 */
const DATABASE = createDatabaseClient('postgres://ninguem:nada@127.0.0.1:1/nenhum');

const PAI_A = '11111111-1111-4111-8111-111111111111';
const PAI_B = '22222222-2222-4222-8222-222222222222';
const FILHO_DE_A = '33333333-3333-4333-8333-333333333333';
const ARQUIVO_DE_A = '44444444-4444-4444-8444-444444444444';

/**
 * O comentario e' retirado antes de contar: o proprio texto que explica a regra
 * cita `.where(`, e um teste que le comentario mede prosa, nao codigo.
 */
const SOURCE = readFileSync(join(import.meta.dir, 'child-file.repository.ts'), 'utf8')
  .replace(/\/\*[\s\S]*?\*\//g, '')
  .replace(/^\s*\/\/.*$/gm, '');

function sqlOf(scope: SQL): { readonly sql: string; readonly params: readonly unknown[] } {
  return DATABASE.select().from(childFilesTable).where(scope).toSQL();
}

/**
 * BOLA e' o campeao em API REST (OWASP API1, `security.md` §2): a rota autoriza
 * "pai autenticado", a consulta esquece o dono, e o `uuid` do vizinho abre o
 * exame da crianca dele. Aqui o dono entra no WHERE, e o SQL provado e' o que o
 * banco recebe.
 */
describe('toda consulta filtra o dono no proprio SQL', () => {
  test('a busca por id do arquivo escopa o usuario', () => {
    const { sql, params } = sqlOf(buildFileScope({ fileId: ARQUIVO_DE_A, userId: PAI_A }));

    expect(sql).toContain('"child_files"."user_id" = $');
    expect(params).toEqual([ARQUIVO_DE_A, PAI_A]);
  });

  test('a lista do filho escopa o usuario', () => {
    const { sql, params } = sqlOf(buildChildScope({ childId: FILHO_DE_A, userId: PAI_A }));

    expect(sql).toContain('"child_files"."user_id" = $');
    expect(params).toEqual([FILHO_DE_A, PAI_A]);
  });

  test('a lista da conta inteira escopa o usuario', () => {
    const { sql, params } = sqlOf(buildUserScope({ userId: PAI_A }));

    expect(sql).toContain('"child_files"."user_id" = $');
    expect(params).toEqual([PAI_A]);
  });
});

/**
 * O teste negativo no nivel que existe hoje: o pai B pedindo o arquivo do filho
 * de A produz uma consulta que carrega o `uuid` de B, e por isso nao pode
 * casar com a linha de A. Zero linha e' a UNICA resposta possivel — e por isso
 * a rota so' tem `404` para dar, nunca `403`, que confirmaria que o `uuid`
 * existe. A afirmacao em HTTP entra com a rota, em `H3.2`/`H3.3`.
 */
describe('o arquivo do filho de outro pai nao tem como voltar', () => {
  test('o dono da consulta e quem pediu, nao quem e dono da linha', () => {
    const { params } = sqlOf(buildFileScope({ fileId: ARQUIVO_DE_A, userId: PAI_B }));

    expect(params).toContain(PAI_B);
    expect(params).not.toContain(PAI_A);
  });
});

/**
 * `Aceite` do `H2.2`: nao ha caminho de leitura que aceite `fileId` sem
 * `userId`. Contar os `.where(` e exigir que todos venham de uma fabrica de
 * escopo e' o que impede a proxima consulta de nascer sem dono — o tipo obriga
 * `userId` no parametro, mas nao obriga ninguem a USAR ele no WHERE.
 */
describe('nao ha where avulso no repositorio', () => {
  test('todo where vem de uma fabrica de escopo', () => {
    const wheres = SOURCE.match(/\.where\(/g) ?? [];
    const scoped = SOURCE.match(/\.where\(build(?:File|Child|User)Scope\(/g) ?? [];

    expect(wheres.length).toBeGreaterThan(0);
    expect(scoped.length).toBe(wheres.length);
  });

  test('nenhuma fabrica de escopo dispensa o usuario', () => {
    const factories = SOURCE.match(/export function build\w+Scope\([^)]*\)/g) ?? [];

    expect(factories).toHaveLength(3);
    expect(factories.every((factory) => factory.includes('userId'))).toBe(true);
  });
});

describe('quem apaga recebe a chave do objeto', () => {
  /**
   * Cascata no banco nao apaga byte no balde. Um `boolean` aqui esconderia
   * isso; a linha devolvida traz a `objectKey` que `H3.4` precisa apagar.
   */
  test('o remove devolve a linha, nao um sim ou nao', () => {
    const repository = createChildFileRepository(DATABASE);

    expect(SOURCE).toContain('.delete(childFilesTable).where(buildFileScope(params)).returning()');
    expect(typeof repository.remove).toBe('function');
  });
});
