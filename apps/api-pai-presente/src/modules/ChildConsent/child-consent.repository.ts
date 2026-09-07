/**
 * Pai Presente — API
 * Copyright (c) 2026. Todos os direitos reservados.
 * Licenca: proprietaria.
 */

import { and, asc, eq, sql, type SQL } from 'drizzle-orm';

import type { Database } from '../../database/client';
import { childConsentsTable } from './child-consent.table';
import type { ChildConsentRow } from './child-consent.table';
import type {
  ChildConsentRepository,
  FindChildConsentParams,
  ListChildConsentsParams,
} from './types/child-consent.types';

/**
 * Duas fabricas de escopo, e nenhum `where` avulso — o teste conta os `.where(`
 * do arquivo e exige que todos venham daqui, com `userId` dentro. Sem o dono no
 * escopo, um `childId` adivinhado leria (ou revogaria) o consentimento do filho
 * de outro pai: BOLA (OWASP API1) na forma mais direta que existe.
 */
export function buildConsentScope({ childId, userId, purpose }: FindChildConsentParams): SQL {
  const scope = and(
    eq(childConsentsTable.childId, childId),
    eq(childConsentsTable.userId, userId),
    eq(childConsentsTable.purpose, purpose),
  );
  if (scope === undefined) throw new Error('escopo de consentimento vazio');
  return scope;
}

export function buildChildConsentScope({ childId, userId }: ListChildConsentsParams): SQL {
  const scope = and(
    eq(childConsentsTable.childId, childId),
    eq(childConsentsTable.userId, userId),
  );
  if (scope === undefined) throw new Error('escopo de filho vazio');
  return scope;
}

export function createChildConsentRepository(database: Database): ChildConsentRepository {
  return {
    /**
     * `on conflict` em vez de "buscar, e inserir se nao houver": entre a busca e
     * o insert cabe outra escrita, e o unico que decide e' a constraint do banco
     * (`database.md`). Reconceder atualiza a DATA, que e' o fato que a lei cobra.
     */
    async grant(params: FindChildConsentParams): Promise<ChildConsentRow> {
      const inserted = await database
        .insert(childConsentsTable)
        .values({ childId: params.childId, userId: params.userId, purpose: params.purpose })
        .onConflictDoUpdate({
          target: [childConsentsTable.childId, childConsentsTable.purpose],
          set: { grantedAt: sql`now()`, updatedAt: sql`now()` },
        })
        .returning();
      const granted = inserted[0];
      if (granted === undefined) throw new Error('insert de consentimento nao retornou linha');
      return granted;
    },

    async findOne(params: FindChildConsentParams): Promise<ChildConsentRow | undefined> {
      const rows = await database
        .select()
        .from(childConsentsTable)
        .where(buildConsentScope(params))
        .limit(1);
      return rows[0];
    },

    listByChild(params: ListChildConsentsParams): Promise<ChildConsentRow[]> {
      return database
        .select()
        .from(childConsentsTable)
        .where(buildChildConsentScope(params))
        .orderBy(asc(childConsentsTable.purpose));
    },

    async revoke(params: FindChildConsentParams): Promise<ChildConsentRow | undefined> {
      const rows = await database
        .delete(childConsentsTable)
        .where(buildConsentScope(params))
        .returning();
      return rows[0];
    },
  };
}
