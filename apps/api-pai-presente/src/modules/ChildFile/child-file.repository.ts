/**
 * Pai Presente — API
 * Copyright (c) 2026. Todos os direitos reservados.
 * Licenca: proprietaria.
 */

import { and, count, eq, sql, type SQL } from 'drizzle-orm';

import type { Database } from '../../database/client';
import { childFilesTable, type ChildFileRow, type NewChildFileRow } from './child-file.table';
import type {
  ChildFileChildScopeParams,
  ChildFileRepository,
  FindChildFileParams,
  ListChildFilesParams,
  ListChildFilesResult,
  ListUserFilesParams,
} from './types/child-file.types';

/**
 * O escopo do dono e' UMA funcao, usada por toda consulta. Filtrar com `if`
 * depois de buscar seria autorizacao no lugar errado: a linha ja teria saido do
 * banco, e basta um `return` esquecido para ela sair da API.
 *
 * Duas fabricas e nenhum `where` avulso — o teste conta os `.where(` do arquivo
 * e exige que todos venham daqui.
 */
export function buildFileScope({ fileId, userId }: FindChildFileParams): SQL {
  const scope = and(eq(childFilesTable.id, fileId), eq(childFilesTable.userId, userId));
  if (scope === undefined) throw new Error('escopo de arquivo vazio');
  return scope;
}

export function buildChildScope({ childId, userId }: ChildFileChildScopeParams): SQL {
  const scope = and(eq(childFilesTable.childId, childId), eq(childFilesTable.userId, userId));
  if (scope === undefined) throw new Error('escopo de filho vazio');
  return scope;
}

export function buildUserScope({ userId }: ListUserFilesParams): SQL {
  return eq(childFilesTable.userId, userId);
}

/**
 * A ordem da linha do tempo, numa expressao SO' — a mesma que `H5.2` vai usar
 * para misturar foto, exame e atividade.
 *
 * `takenOn` e' nulo quando o pai nao disse a data, e `DESC` no Postgres poe
 * NULO PRIMEIRO: a foto sem data pularia para o topo do album, acima da de
 * hoje. O `coalesce` diz mais que um `nulls last`: sem data declarada, o dia do
 * ENVIO e' o melhor palpite que existe, e a foto cai onde ela entrou em vez de
 * ir para um deposito no fim da lista.
 *
 * Template parametrizado do Drizzle, sem nenhum valor de usuario dentro
 * (`database.md`): o que se interpola aqui sao as colunas.
 */
export const CHILD_FILE_TIMELINE_ORDER = sql`coalesce(${childFilesTable.takenOn}, ${childFilesTable.createdAt}::date) desc, ${childFilesTable.createdAt} desc`;

export function createChildFileRepository(database: Database): ChildFileRepository {
  return {
    async insert(row: NewChildFileRow): Promise<ChildFileRow> {
      const inserted = await database.insert(childFilesTable).values(row).returning();
      const created = inserted[0];
      if (created === undefined) throw new Error('insert de arquivo do filho nao retornou linha');
      return created;
    },

    async findById(params: FindChildFileParams): Promise<ChildFileRow | undefined> {
      const rows = await database.select().from(childFilesTable).where(buildFileScope(params)).limit(1);
      return rows[0];
    },

    /**
     * O escopo se monta DUAS vezes de proposito, uma por consulta: guardar o
     * `SQL` numa variavel e passar `.where(scope)` apagaria a prova que o teste
     * do repositorio cobra — todo `.where(` tem de vir de uma fabrica de escopo,
     * e um apelido faria a proxima consulta sem dono passar batida.
     */
    async listByChild(params: ListChildFilesParams): Promise<ListChildFilesResult> {
      const [items, totals] = await Promise.all([
        database
          .select()
          .from(childFilesTable)
          .where(buildChildScope(params))
          .orderBy(CHILD_FILE_TIMELINE_ORDER)
          .limit(params.limit)
          .offset(params.offset),
        database.select({ value: count() }).from(childFilesTable).where(buildChildScope(params)),
      ]);
      return { items, total: totals[0]?.value ?? 0 };
    },

    /** Para a varredura do balde quando o filho e' apagado: sem teto de pagina. */
    listAllByChild(params: ChildFileChildScopeParams): Promise<ChildFileRow[]> {
      return database.select().from(childFilesTable).where(buildChildScope(params));
    },

    /** Para a exportacao do art. 18 e para o `DELETE /v1/me`, que precisa das chaves. */
    listByUser(params: ListUserFilesParams): Promise<ChildFileRow[]> {
      return database.select().from(childFilesTable).where(buildUserScope(params));
    },

    async remove(params: FindChildFileParams): Promise<ChildFileRow | undefined> {
      const rows = await database.delete(childFilesTable).where(buildFileScope(params)).returning();
      return rows[0];
    },
  };
}
