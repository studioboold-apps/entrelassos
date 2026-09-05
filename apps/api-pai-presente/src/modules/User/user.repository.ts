/**
 * Pai Presente — API
 * Copyright (c) 2026. Todos os direitos reservados.
 * Licenca: proprietaria.
 */

import { eq } from 'drizzle-orm';

import type { Database } from '../../database/client';
import { activitiesTable } from '../Activity/activity.table';
import { AUDIT_ACTIONS, AUDIT_TARGET_TYPES } from '../Audit/audit.constant';
import { recordAuditEntry } from '../Audit/audit.repository';
import { authIdentitiesTable } from '../Auth/auth.table';
import { chatMessagesTable } from '../ChatMessage/chat-message.table';
import { childrenTable } from '../Child/child.table';
import { communityCommentsTable } from '../CommunityComment/community-comment.table';
import {
  communityPostLikesTable,
  communityPostsTable,
} from '../CommunityPost/community-post.table';
import { insightRatingsTable } from '../InsightRating/insight-rating.table';
import type {
  AccountExport,
  DeleteUserParams,
  ExportUserParams,
  FindUserParams,
  UpdateUserParams,
  UserRepository,
} from './types/user.types';
import { usersTable, type UserRow } from './user.table';

async function readAccountSections(
  database: Database,
  userId: string,
): Promise<Omit<AccountExport, 'user'>> {
  const [
    authIdentities,
    children,
    activities,
    insightRatings,
    communityPosts,
    communityPostLikes,
    communityComments,
    chatMessages,
  ] = await Promise.all([
    database.select().from(authIdentitiesTable).where(eq(authIdentitiesTable.userId, userId)),
    database.select().from(childrenTable).where(eq(childrenTable.userId, userId)),
    database.select().from(activitiesTable).where(eq(activitiesTable.userId, userId)),
    database.select().from(insightRatingsTable).where(eq(insightRatingsTable.userId, userId)),
    database.select().from(communityPostsTable).where(eq(communityPostsTable.authorId, userId)),
    database
      .select()
      .from(communityPostLikesTable)
      .where(eq(communityPostLikesTable.userId, userId)),
    database
      .select()
      .from(communityCommentsTable)
      .where(eq(communityCommentsTable.authorId, userId)),
    database.select().from(chatMessagesTable).where(eq(chatMessagesTable.userId, userId)),
  ]);

  return {
    authIdentities,
    children,
    activities,
    insightRatings,
    communityPosts,
    communityPostLikes,
    communityComments,
    chatMessages,
  };
}

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

    /**
     * Apagar a linha de `users` basta: as outras nove apontam para ela com
     * `onDelete: cascade`, e a cascata mora no BANCO — nao ha ordem de exclusao
     * para alguem esquecer aqui.
     *
     * Exclusao e trilha na MESMA transacao, senao a auditoria mente numa das
     * duas direcoes: registrando exclusao que nao houve, ou perdendo o registro
     * de uma que houve.
     */
    async deleteById({ userId, clientIp }: DeleteUserParams): Promise<boolean> {
      return database.transaction(async (transaction) => {
        const removed = await transaction
          .delete(usersTable)
          .where(eq(usersTable.id, userId))
          .returning({ id: usersTable.id });

        if (removed.length === 0) return false;

        await recordAuditEntry({
          executor: transaction,
          entry: {
            actorId: userId,
            action: AUDIT_ACTIONS.ACCOUNT_DELETED,
            targetType: AUDIT_TARGET_TYPES.ACCOUNT,
            targetId: userId,
            clientIp,
          },
        });

        return true;
      });
    },

    async exportAll({ userId, clientIp }: ExportUserParams): Promise<AccountExport | undefined> {
      const rows = await database.select().from(usersTable).where(eq(usersTable.id, userId)).limit(1);
      const user = rows[0];
      if (user === undefined) return undefined;

      const sections = await readAccountSections(database, userId);

      await recordAuditEntry({
        executor: database,
        entry: {
          actorId: userId,
          action: AUDIT_ACTIONS.ACCOUNT_EXPORTED,
          targetType: AUDIT_TARGET_TYPES.ACCOUNT,
          targetId: userId,
          clientIp,
        },
      });

      return { user, ...sections };
    },
  };
}
