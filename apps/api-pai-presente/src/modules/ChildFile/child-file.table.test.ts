/**
 * Pai Presente — API
 * Copyright (c) 2026. Todos os direitos reservados.
 * Licenca: proprietaria.
 */

import { describe, expect, test } from 'bun:test';
import { getTableConfig } from 'drizzle-orm/pg-core';

import { childFilesTable } from './child-file.table';

const CONFIG = getTableConfig(childFilesTable);
const COLUMN_NAMES = CONFIG.columns.map((column) => column.name);

/**
 * `exame-joao-silva-2026.pdf` e' PII duas vezes: o nome da crianca no registro e
 * o nome da crianca na chave do objeto (`security.md` §7 proibe dado pessoal no
 * NOME da chave). O pai escreve uma legenda; o arquivo dele nao entra.
 *
 * Este teste afirma o conjunto FECHADO de colunas, e nao a ausencia de nomes
 * suspeitos: `file_name` seria pego por uma lista de proibidos, mas
 * `original_upload` ou `source` nao — e a proxima pessoa a acrescentar coluna
 * nao vai adivinhar quais palavras a lista tem.
 */
describe('nenhuma coluna guarda o nome do arquivo enviado', () => {
  test('o conjunto de colunas e o esperado, e nada mais', () => {
    expect([...COLUMN_NAMES].sort()).toEqual(
      [
        'byte_size',
        'caption',
        'checksum',
        'child_id',
        'content_type',
        'created_at',
        'id',
        'is_encrypted',
        'kind',
        'object_key',
        'taken_on',
        'updated_at',
        'user_id',
      ].sort(),
    );
  });
});

describe('o objeto no balde tem um dono so', () => {
  /** Dois registros na mesma chave fariam o apagar de um cegar o outro (H4.1). */
  test('a chave do objeto e unica', () => {
    const objectKey = CONFIG.columns.find((column) => column.name === 'object_key');

    expect(objectKey?.isUnique).toBe(true);
    expect(objectKey?.notNull).toBe(true);
  });
});

describe('apagar o filho leva os arquivos dele', () => {
  /**
   * Diferente de `activities.childId`, que usa `set null`: uma atividade sem
   * filho ainda e' um dia que existiu, mas foto sem filho nao e' nada.
   *
   * E cascata no banco NAO apaga byte no balde — quem apaga o filho apaga os
   * objetos primeiro (H4.1). Este teste afirma a linha, nao os bytes.
   */
  test('as duas referencias cascateiam', () => {
    const cascades = CONFIG.foreignKeys.map((foreignKey) => foreignKey.onDelete);

    expect(cascades).toHaveLength(2);
    expect(cascades.every((onDelete) => onDelete === 'cascade')).toBe(true);
  });
});

describe('o que a coluna precisa saber sozinha', () => {
  /**
   * `isEncrypted` nao se deriva do `kind`: no dia em que a chave girar, objetos
   * cifrados com a antiga e com a nova convivem, e sem a coluna nao se sabe
   * qual abre com qual.
   */
  test('a cifra e uma coluna, nao uma conta feita depois', () => {
    expect(COLUMN_NAMES).toContain('is_encrypted');
  });

  /**
   * O dia da FOTO, nao o do envio (`D6` do GOAL). Album antigo digitalizado num
   * sabado empilharia vinte anos naquele sabado.
   */
  test('o dia da foto e proprio, e pode faltar', () => {
    const takenOn = CONFIG.columns.find((column) => column.name === 'taken_on');

    expect(takenOn).toBeDefined();
    expect(takenOn?.notNull).toBe(false);
  });
});

/** Tabela fora do esquema e' tabela que o `drizzle-kit` nao ve — e migration que nunca nasce. */
describe('o drizzle-kit ve a tabela', () => {
  test('a tabela sai pelo esquema unico', async () => {
    const schema = (await import('../../database/schema')) as Record<string, unknown>;

    expect(schema['childFilesTable']).toBe(childFilesTable);
  });
});
