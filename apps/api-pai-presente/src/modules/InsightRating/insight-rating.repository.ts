/**
 * Pai Presente — API
 * Copyright (c) 2026. Todos os direitos reservados.
 * Licenca: proprietaria.
 */

import { count, desc, eq } from 'drizzle-orm';

import type { Database } from '../../database/client';
import { insightRatingsTable, type InsightRatingRow } from './insight-rating.table';
import type {
  InsightRatingRepository,
  ListInsightRatingsParams,
  ListInsightRatingsResult,
  PutInsightRatingParams,
} from './types/insight-rating.types';

export function createInsightRatingRepository(database: Database): InsightRatingRepository {
  return {
    async list({ userId, limit, offset }: ListInsightRatingsParams): Promise<ListInsightRatingsResult> {
      const where = eq(insightRatingsTable.userId, userId);
      const [items, totals] = await Promise.all([
        database
          .select()
          .from(insightRatingsTable)
          .where(where)
          .orderBy(desc(insightRatingsTable.createdAt))
          .limit(limit)
          .offset(offset),
        database.select({ value: count() }).from(insightRatingsTable).where(where),
      ]);
      return { items, total: totals[0]?.value ?? 0 };
    },

    /** Reavaliar ATUALIZA; a unique (user, insight) e quem garante isso. */
    async upsert({ userId, insightId, values }: PutInsightRatingParams): Promise<InsightRatingRow> {
      const rows = await database
        .insert(insightRatingsTable)
        .values({ ...values, userId, insightId })
        .onConflictDoUpdate({
          target: [insightRatingsTable.userId, insightRatingsTable.insightId],
          set: { ...values, updatedAt: new Date() },
        })
        .returning();
      const row = rows[0];
      if (row === undefined) throw new Error('upsert de nota nao retornou linha');
      return row;
    },
  };
}
