/**
 * Pai Presente — API
 * Copyright (c) 2026. Todos os direitos reservados.
 * Licenca: proprietaria.
 */

import { describe, expect, test } from 'bun:test';
import { getTableConfig } from 'drizzle-orm/pg-core';

import { childConsentsTable } from './child-consent.table';

const CONFIG = getTableConfig(childConsentsTable);
const COLUMN_NAMES = CONFIG.columns.map((column) => column.name);

describe('o conjunto de colunas e fechado', () => {
  test('e o esperado, e nada mais', () => {
    expect([...COLUMN_NAMES].sort()).toEqual(
      ['child_id', 'created_at', 'granted_at', 'id', 'purpose', 'updated_at', 'user_id'].sort(),
    );
  });
});

describe('a data do consentimento e uma coluna propria', () => {
  /**
   * `created_at` e' escrituracao da linha: um backfill, uma correcao de fuso ou
   * um `touch` de migration o reescreve sem ninguem achar isso estranho. A data
   * que o art. 14 §1 cobra e' outra coisa — e' a data em que este pai disse sim
   * — e ela nao pode depender de a linha nunca ter sido mexida.
   */
  test('granted_at existe, e nao e o created_at', () => {
    const grantedAt = CONFIG.columns.find((column) => column.name === 'granted_at');

    expect(grantedAt?.notNull).toBe(true);
    expect(grantedAt?.name).not.toBe('created_at');
  });
});

describe('uma linha por finalidade, e o banco e quem decide', () => {
  /**
   * Sem esta restricao, o `onConflictDoUpdate` do repositorio nao tem em que
   * conflitar: dois toques no botao virariam duas linhas, e "desde quando este
   * pai consentiu" passaria a ter duas respostas. A tabela guarda o estado de
   * HOJE; o historico esta na trilha de auditoria, que so' insere.
   */
  test('child_id e purpose sao unicos juntos', () => {
    const columnSets = CONFIG.uniqueConstraints.map((constraint) =>
      constraint.columns.map((column) => column.name).sort(),
    );

    expect(columnSets).toContainEqual(['child_id', 'purpose']);
  });
});

describe('apagar o filho ou a conta leva o consentimento', () => {
  /**
   * Consentimento sem filho nao e' nada, e consentimento de conta apagada seria
   * base legal orfa — pior que ausencia, porque parece valer.
   */
  test('as duas referencias cascateiam', () => {
    const cascades = CONFIG.foreignKeys.map((foreignKey) => foreignKey.onDelete);

    expect(cascades).toHaveLength(2);
    expect(cascades.every((onDelete) => onDelete === 'cascade')).toBe(true);
  });
});

/** Tabela fora do esquema e' tabela que o `drizzle-kit` nao ve. */
describe('o drizzle-kit ve a tabela', () => {
  test('a tabela sai pelo esquema unico', async () => {
    const schema = (await import('../../database/schema')) as Record<string, unknown>;

    expect(schema['childConsentsTable']).toBe(childConsentsTable);
  });
});
