/**
 * Pai Presente — API
 * Copyright (c) 2026. Todos os direitos reservados.
 * Licenca: proprietaria.
 */

import { eq } from 'drizzle-orm';

import type { Database } from '../../database/client';
import type { FindUserParams, UpdateUserParams, UserRepository } from './types/user.types';
import { usersTable, type UserRow } from './user.table';

export function createUserRepository(database: Database): UserRepository {
  return {
    async findById({ userId }: FindUserParams): Promise<UserRow | undefined> {
      const rows = await database.select().from(usersTable).where(eq(usersTable.id, userId)).limit(1);
      return rows[0];
    },

    async update({ userId, values }: UpdateUserParams): Promise<UserRow | undefined> {
      const rows = await database
        .update(usersTable)
        .set({ ...values, updatedAt: new Date() })
        .where(eq(usersTable.id, userId))
        .returning();
      return rows[0];
    },
  };
}
