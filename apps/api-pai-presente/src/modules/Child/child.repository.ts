/**
 * Pai Presente — API
 * Copyright (c) 2026. Todos os direitos reservados.
 * Licenca: proprietaria.
 */

import { and, count, desc, eq } from 'drizzle-orm';

import type { Database } from '../../database/client';
import { childrenTable, type ChildRow, type NewChildRow } from './child.table';
import type {
  ChildContextRow,
  ChildRepository,
  FindChildParams,
  ListChildrenParams,
  ListChildrenResult,
  UpdateChildParams,
} from './types/child.types';

export function createChildRepository(database: Database): ChildRepository {
  function scopeToUser(childId: string, userId: string) {
    return and(eq(childrenTable.id, childId), eq(childrenTable.userId, userId));
  }

  return {
    async list({ userId, limit, offset }: ListChildrenParams): Promise<ListChildrenResult> {
      const [items, totals] = await Promise.all([
        database
          .select()
          .from(childrenTable)
          .where(eq(childrenTable.userId, userId))
          .orderBy(desc(childrenTable.createdAt))
          .limit(limit)
          .offset(offset),
        database.select({ value: count() }).from(childrenTable).where(eq(childrenTable.userId, userId)),
      ]);
      return { items, total: totals[0]?.value ?? 0 };
    },

    async findById({ childId, userId }: FindChildParams): Promise<ChildRow | undefined> {
      const rows = await database.select().from(childrenTable).where(scopeToUser(childId, userId)).limit(1);
      return rows[0];
    },

    async insert(row: NewChildRow): Promise<ChildRow> {
      const rows = await database.insert(childrenTable).values(row).returning();
      const inserted = rows[0];
      if (inserted === undefined) throw new Error('insert de filho nao retornou linha');
      return inserted;
    },

    async update({ childId, userId, values }: UpdateChildParams): Promise<ChildRow | undefined> {
      const rows = await database
        .update(childrenTable)
        .set({ ...values, updatedAt: new Date() })
        .where(scopeToUser(childId, userId))
        .returning();
      return rows[0];
    },

    async listContext(userId: string): Promise<readonly ChildContextRow[]> {
      return database
        .select({
          name: childrenTable.name,
          age: childrenTable.age,
          gender: childrenTable.gender,
          birthDate: childrenTable.birthDate,
          favoriteHobby: childrenTable.favoriteHobby,
          favoriteFood: childrenTable.favoriteFood,
          favoriteMovieGenre: childrenTable.favoriteMovieGenre,
          favoriteColor: childrenTable.favoriteColor,
        })
        .from(childrenTable)
        .where(eq(childrenTable.userId, userId))
        .orderBy(desc(childrenTable.createdAt));
    },

    async remove({ childId, userId }: FindChildParams): Promise<boolean> {
      const rows = await database
        .delete(childrenTable)
        .where(scopeToUser(childId, userId))
        .returning({ id: childrenTable.id });
      return rows.length > 0;
    },
  };
}
