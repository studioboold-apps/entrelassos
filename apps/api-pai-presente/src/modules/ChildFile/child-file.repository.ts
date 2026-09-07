/**
 * Pai Presente — API
 * Copyright (c) 2026. Todos os direitos reservados.
 * Licenca: proprietaria.
 */

import { and, desc, eq, type SQL } from 'drizzle-orm';

import type { Database } from '../../database/client';
import { childFilesTable, type ChildFileRow, type NewChildFileRow } from './child-file.table';
import type {
  ChildFileRepository,
  FindChildFileParams,
  ListChildFilesParams,
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

export function buildChildScope({ childId, userId }: ListChildFilesParams): SQL {
  const scope = and(eq(childFilesTable.childId, childId), eq(childFilesTable.userId, userId));
  if (scope === undefined) throw new Error('escopo de filho vazio');
  return scope;
}

export function buildUserScope({ userId }: ListUserFilesParams): SQL {
  return eq(childFilesTable.userId, userId);
}

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

    listByChild(params: ListChildFilesParams): Promise<ChildFileRow[]> {
      return database
        .select()
        .from(childFilesTable)
        .where(buildChildScope(params))
        .orderBy(desc(childFilesTable.takenOn), desc(childFilesTable.createdAt));
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
