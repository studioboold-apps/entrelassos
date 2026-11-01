/**
 * Pai Presente — API
 * Copyright (c) 2026. Todos os direitos reservados.
 * Licenca: proprietaria.
 */

import { and, count, desc, eq, gte, lte, type SQL } from 'drizzle-orm';

import type { Database } from '../../database/client';
import { childrenTable } from '../Child/child.table';
import { activitiesTable, type NewActivityRow } from './activity.table';
import type { ListActivitiesQuery } from './activity.schema';
import { buildMonthRange } from '../shared/date.util';
import type {
  ActivityMonthDigestParams,
  ActivityMonthDigestRow,
  ActivityRecentDigestParams,
  ActivityRepository,
  ActivityView,
  FindActivityParams,
  ListActivitiesParams,
  ListActivitiesResult,
  UpdateActivityParams,
} from './types/activity.types';

/** As mesmas colunas para o mes e para as recentes: o modulo Ai le um formato so'. */
const DIGEST_COLUMNS = {
  title: activitiesTable.title,
  category: activitiesTable.category,
  isCompleted: activitiesTable.isCompleted,
  rating: activitiesTable.rating,
};

type JoinedRow = {
  readonly activity: typeof activitiesTable.$inferSelect;
  readonly childName: string | null;
};

function toView({ activity, childName }: JoinedRow): ActivityView {
  return { ...activity, childName: childName ?? undefined };
}

function buildFilters(userId: string, filters: ListActivitiesQuery): SQL | undefined {
  const conditions: SQL[] = [eq(activitiesTable.userId, userId)];
  if (filters.childId !== undefined) conditions.push(eq(activitiesTable.childId, filters.childId));
  if (filters.isCompleted !== undefined) {
    conditions.push(eq(activitiesTable.isCompleted, filters.isCompleted));
  }
  if (filters.fromDate !== undefined) conditions.push(gte(activitiesTable.activityDate, filters.fromDate));
  if (filters.toDate !== undefined) conditions.push(lte(activitiesTable.activityDate, filters.toDate));
  return and(...conditions);
}

export function createActivityRepository(database: Database): ActivityRepository {
  const selection = { activity: activitiesTable, childName: childrenTable.name } as const;

  function selectJoined() {
    return database
      .select(selection)
      .from(activitiesTable)
      .leftJoin(childrenTable, eq(activitiesTable.childId, childrenTable.id));
  }

  async function loadView(activityId: string, userId: string): Promise<ActivityView | undefined> {
    const rows = await selectJoined()
      .where(and(eq(activitiesTable.id, activityId), eq(activitiesTable.userId, userId)))
      .limit(1);
    const row = rows[0];
    return row === undefined ? undefined : toView(row);
  }

  return {
    async list({ userId, filters, limit, offset }: ListActivitiesParams): Promise<ListActivitiesResult> {
      const where = buildFilters(userId, filters);
      const [rows, totals] = await Promise.all([
        selectJoined().where(where).orderBy(desc(activitiesTable.activityDate)).limit(limit).offset(offset),
        database.select({ value: count() }).from(activitiesTable).where(where),
      ]);
      return { items: rows.map(toView), total: totals[0]?.value ?? 0 };
    },

    findById: ({ activityId, userId }: FindActivityParams) => loadView(activityId, userId),

    async insert(row: NewActivityRow): Promise<ActivityView> {
      const inserted = await database.insert(activitiesTable).values(row).returning({ id: activitiesTable.id });
      const activityId = inserted[0]?.id;
      if (activityId === undefined) throw new Error('insert de atividade nao retornou linha');
      const view = await loadView(activityId, row.userId);
      if (view === undefined) throw new Error('atividade inserida nao foi encontrada');
      return view;
    },

    async update({ activityId, userId, values }: UpdateActivityParams): Promise<ActivityView | undefined> {
      const updated = await database
        .update(activitiesTable)
        .set({ ...values, updatedAt: new Date() })
        .where(and(eq(activitiesTable.id, activityId), eq(activitiesTable.userId, userId)))
        .returning({ id: activitiesTable.id });
      if (updated.length === 0) return undefined;
      return loadView(activityId, userId);
    },

    async listMonthDigest({
      userId,
      month,
    }: ActivityMonthDigestParams): Promise<readonly ActivityMonthDigestRow[]> {
      const { firstDay, lastDay } = buildMonthRange(month);
      return database
        .select(DIGEST_COLUMNS)
        .from(activitiesTable)
        .where(
          and(
            eq(activitiesTable.userId, userId),
            gte(activitiesTable.activityDate, firstDay),
            lte(activitiesTable.activityDate, lastDay),
          ),
        );
    },

    async listRecentDigest({
      userId,
      limit,
    }: ActivityRecentDigestParams): Promise<readonly ActivityMonthDigestRow[]> {
      return database
        .select(DIGEST_COLUMNS)
        .from(activitiesTable)
        .where(eq(activitiesTable.userId, userId))
        .orderBy(desc(activitiesTable.activityDate))
        .limit(limit);
    },

    async remove({ activityId, userId }: FindActivityParams): Promise<boolean> {
      const rows = await database
        .delete(activitiesTable)
        .where(and(eq(activitiesTable.id, activityId), eq(activitiesTable.userId, userId)))
        .returning({ id: activitiesTable.id });
      return rows.length > 0;
    },
  };
}
