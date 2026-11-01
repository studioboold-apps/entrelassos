/**
 * Pai Presente — API
 * Copyright (c) 2026. Todos os direitos reservados.
 * Licenca: proprietaria.
 */

import { and, asc, eq, inArray, notInArray, or, sql } from 'drizzle-orm';

import type { Database } from '../../database/client';
import { FAMILY_VALUE_OPTION_MIN_USERS, type FamilyValueKind } from './family-values.constant';
import { normalizeFamilyValueKey, tidyFamilyValueLabel } from './family-values.normalize';
import { familyValueOptionsTable, userFamilyValuesTable } from './family-values.table';
import type { FamilyValueChoice, FamilyValuesRepository } from './types/family-values.types';

type Executor = Pick<Database, 'select' | 'insert'>;

/**
 * Acha a opcao pela CHAVE normalizada, ou cria. Duas pessoas escrevendo
 * "Catolica" e "católica" ao mesmo tempo caem na mesma linha: o
 * `onConflictDoNothing` absorve a corrida e a leitura seguinte acha a vencedora.
 */
async function resolveOptionId(executor: Executor, { kind, label }: FamilyValueChoice): Promise<string> {
  const normalizedKey = normalizeFamilyValueKey(label);
  await executor
    .insert(familyValueOptionsTable)
    .values({ kind, label: tidyFamilyValueLabel(label), normalizedKey })
    .onConflictDoNothing();
  const rows = await executor
    .select({ id: familyValueOptionsTable.id })
    .from(familyValueOptionsTable)
    .where(and(eq(familyValueOptionsTable.kind, kind), eq(familyValueOptionsTable.normalizedKey, normalizedKey)))
    .limit(1);
  const id = rows[0]?.id;
  if (id === undefined) throw new Error('opcao de valor da familia nao foi gravada');
  return id;
}

export function createFamilyValuesRepository(database: Database): FamilyValuesRepository {
  return {
    async findByUser(userId) {
      const rows = await database
        .select({
          kind: userFamilyValuesTable.kind,
          label: familyValueOptionsTable.label,
          grantedAt: userFamilyValuesTable.grantedAt,
        })
        .from(userFamilyValuesTable)
        .innerJoin(familyValueOptionsTable, eq(familyValueOptionsTable.id, userFamilyValuesTable.optionId))
        .where(eq(userFamilyValuesTable.userId, userId));
      return rows.map((row) => ({ ...row, kind: row.kind as FamilyValueKind }));
    },

    async replace({ userId, choices }) {
      await database.transaction(async (transaction) => {
        const keptKinds = choices.map((choice) => choice.kind);
        await transaction
          .delete(userFamilyValuesTable)
          .where(
            keptKinds.length === 0
              ? eq(userFamilyValuesTable.userId, userId)
              : and(eq(userFamilyValuesTable.userId, userId), notInArray(userFamilyValuesTable.kind, keptKinds)),
          );
        for (const choice of choices) {
          const optionId = await resolveOptionId(transaction, choice);
          await transaction
            .insert(userFamilyValuesTable)
            .values({ userId, kind: choice.kind, optionId })
            .onConflictDoUpdate({
              target: [userFamilyValuesTable.userId, userFamilyValuesTable.kind],
              set: { optionId, updatedAt: new Date() },
            });
        }
      });
    },

    async removeAll(userId) {
      const rows = await database
        .delete(userFamilyValuesTable)
        .where(eq(userFamilyValuesTable.userId, userId))
        .returning({ id: userFamilyValuesTable.id });
      return rows.length;
    },

    async listOptions(kind) {
      const usedEnough = database
        .select({ optionId: userFamilyValuesTable.optionId })
        .from(userFamilyValuesTable)
        .groupBy(userFamilyValuesTable.optionId)
        .having(sql`count(distinct ${userFamilyValuesTable.userId}) >= ${FAMILY_VALUE_OPTION_MIN_USERS}`);
      const rows = await database
        .select({ label: familyValueOptionsTable.label })
        .from(familyValueOptionsTable)
        .where(
          and(
            eq(familyValueOptionsTable.kind, kind),
            or(eq(familyValueOptionsTable.seeded, true), inArray(familyValueOptionsTable.id, usedEnough)),
          ),
        )
        .orderBy(asc(familyValueOptionsTable.label));
      return rows.map((row) => row.label);
    },
  };
}
