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
import { CHILD_CONSENT_PURPOSES } from './child-consent.constant';
import { childConsentsTable } from './child-consent.table';
import {
  buildChildConsentScope,
  buildConsentScope,
  createChildConsentRepository,
} from './child-consent.repository';

/** Nenhum teste aqui conecta: `toSQL()` monta a consulta sem ir ao banco. */
const DATABASE = createDatabaseClient('postgres://ninguem:nada@127.0.0.1:1/nenhum');

const PAI_A = '11111111-1111-4111-8111-111111111111';
const PAI_B = '22222222-2222-4222-8222-222222222222';
const FILHO_DE_A = '33333333-3333-4333-8333-333333333333';
const HEALTH = CHILD_CONSENT_PURPOSES.HEALTH_DATA;

/** O comentario e' retirado antes de contar: ele proprio cita `.where(`. */
const SOURCE = readFileSync(join(import.meta.dir, 'child-consent.repository.ts'), 'utf8')
  .replace(/\/\*[\s\S]*?\*\//g, '')
  .replace(/^\s*\/\/.*$/gm, '');

function sqlOf(scope: SQL): { readonly sql: string; readonly params: readonly unknown[] } {
  return DATABASE.select().from(childConsentsTable).where(scope).toSQL();
}

/**
 * BOLA (OWASP API1, `security.md` §2) na forma mais direta: sem o dono no
 * WHERE, um `childId` adivinhado LERIA — e pior, REVOGARIA — a base legal do
 * filho de outro pai. Revogar de fora e' o ataque mais barato: derruba o
 * consentimento e o proximo exame daquele pai passa a ser recusado.
 */
describe('toda consulta filtra o dono no proprio SQL', () => {
  test('a busca de uma finalidade escopa o usuario', () => {
    const { sql, params } = sqlOf(
      buildConsentScope({ childId: FILHO_DE_A, userId: PAI_A, purpose: HEALTH }),
    );

    expect(sql).toContain('"child_consents"."user_id" = $');
    expect(params).toEqual([FILHO_DE_A, PAI_A, HEALTH]);
  });

  test('a lista do filho escopa o usuario', () => {
    const { sql, params } = sqlOf(buildChildConsentScope({ childId: FILHO_DE_A, userId: PAI_A }));

    expect(sql).toContain('"child_consents"."user_id" = $');
    expect(params).toEqual([FILHO_DE_A, PAI_A]);
  });

  test('o dono da consulta e quem pediu, nao quem e dono da linha', () => {
    const { params } = sqlOf(
      buildConsentScope({ childId: FILHO_DE_A, userId: PAI_B, purpose: HEALTH }),
    );

    expect(params).toContain(PAI_B);
    expect(params).not.toContain(PAI_A);
  });
});

describe('nao ha where avulso no repositorio', () => {
  /**
   * O tipo obriga `userId` no parametro, mas nao obriga ninguem a USAR ele no
   * WHERE — foi assim que L-032 aconteceu. Contar os `.where(` e' o que impede
   * a proxima consulta de nascer sem dono.
   */
  test('todo where vem de uma fabrica de escopo', () => {
    const wheres = SOURCE.match(/\.where\(/g) ?? [];
    const scoped = SOURCE.match(/\.where\(build(?:Consent|ChildConsent)Scope\(/g) ?? [];

    expect(wheres.length).toBeGreaterThan(0);
    expect(scoped.length).toBe(wheres.length);
  });

  test('nenhuma fabrica de escopo dispensa o usuario', () => {
    const factories = SOURCE.match(/export function build\w+Scope\([^)]*\)/g) ?? [];

    expect(factories).toHaveLength(2);
    expect(factories.every((factory) => factory.includes('userId'))).toBe(true);
  });
});

describe('conceder duas vezes e o banco quem resolve', () => {
  /**
   * "Buscar, e inserir se nao houver" tem uma janela entre as duas metades onde
   * cabe outra escrita — e o resultado seria a segunda linha para a mesma
   * finalidade, com o `unique` da tabela estourando um 500 no lugar de um 201.
   * Aqui quem decide e' a constraint, e reconceder atualiza a DATA.
   */
  test('o insert conflita na dupla filho e finalidade', () => {
    expect(SOURCE).toContain('onConflictDoUpdate');
    expect(SOURCE).toContain('target: [childConsentsTable.childId, childConsentsTable.purpose]');
  });

  test('o conflito renova a data da concessao', () => {
    expect(SOURCE).toContain('grantedAt: sql`now()`');
  });

  /** Nao ha leitura antes da escrita: a janela nao existe se ninguem a abrir. */
  test('conceder nao consulta antes de inserir', () => {
    const grant = SOURCE.slice(SOURCE.indexOf('async grant('), SOURCE.indexOf('async findOne('));

    expect(grant).not.toContain('.select(');
  });
});

describe('revogar devolve a linha, nao um sim ou nao', () => {
  /**
   * A trilha de auditoria precisa do id da linha que sumiu — sem ele, "retirou
   * o consentimento" nao aponta para nada. E o `undefined` e' o que distingue
   * 404 de 204: revogar o que nao existe nao pode responder "feito".
   */
  test('o delete devolve a linha apagada', () => {
    const repository = createChildConsentRepository(DATABASE);

    expect(SOURCE).toContain(
      '.delete(childConsentsTable)\n        .where(buildConsentScope(params))\n        .returning()',
    );
    expect(typeof repository.revoke).toBe('function');
  });
});

describe('a lista tem ordem estavel', () => {
  /**
   * Sem `order by`, o Postgres devolve na ordem que quiser, e a tela do `H5.3`
   * trocaria as finalidades de lugar entre duas aberturas sem nada ter mudado.
   */
  test('a lista ordena pela finalidade', () => {
    const ordered = DATABASE.select()
      .from(childConsentsTable)
      .where(buildChildConsentScope({ childId: FILHO_DE_A, userId: PAI_A }))
      .orderBy(childConsentsTable.purpose)
      .toSQL();

    expect(ordered.sql).toContain('order by "child_consents"."purpose"');
    expect(SOURCE).toContain('asc(childConsentsTable.purpose)');
  });
});
