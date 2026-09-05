/**
 * Pai Presente — API
 * Copyright (c) 2026. Todos os direitos reservados.
 * Licenca: proprietaria.
 */

import { and, asc, count, eq } from 'drizzle-orm';

import type { Database } from '../../database/client';
import { usersTable } from '../User/user.table';
import { communityCommentsTable } from './community-comment.table';
import type {
  CommunityCommentRepository,
  CommunityCommentView,
  CreateCommunityCommentParams,
  ListCommunityCommentsParams,
  ListCommunityCommentsResult,
  RemoveCommunityCommentParams,
} from './types/community-comment.types';

export function createCommunityCommentRepository(database: Database): CommunityCommentRepository {
  const SELECTION = {
    comment: communityCommentsTable,
    authorName: usersTable.fullName,
  } as const;

  const AUTHOR_JOIN = eq(usersTable.id, communityCommentsTable.authorId);

  type JoinedRow = {
    readonly comment: typeof communityCommentsTable.$inferSelect;
    readonly authorName: string | null;
  };

  function toView({ comment, authorName }: JoinedRow): CommunityCommentView {
    return { ...comment, authorName };
  }

  return {
    async list({ postId, limit, offset }: ListCommunityCommentsParams): Promise<ListCommunityCommentsResult> {
      const where = eq(communityCommentsTable.postId, postId);
      const [items, totals] = await Promise.all([
        database
          .select(SELECTION)
          .from(communityCommentsTable)
          .innerJoin(usersTable, AUTHOR_JOIN)
          .where(where)
          .orderBy(asc(communityCommentsTable.createdAt))
          .limit(limit)
          .offset(offset),
        database.select({ value: count() }).from(communityCommentsTable).where(where),
      ]);
      return { items: items.map(toView), total: totals[0]?.value ?? 0 };
    },

    async insert({ authorId, values }: CreateCommunityCommentParams): Promise<CommunityCommentView> {
      const inserted = await database
        .insert(communityCommentsTable)
        .values({ ...values, authorId })
        .returning({ id: communityCommentsTable.id });
      const commentId = inserted[0]?.id;
      if (commentId === undefined) throw new Error('insert de comentario nao retornou linha');
      const rows = await database
        .select(SELECTION)
        .from(communityCommentsTable)
        .innerJoin(usersTable, AUTHOR_JOIN)
        .where(eq(communityCommentsTable.id, commentId))
        .limit(1);
      const row = rows[0];
      if (row === undefined) throw new Error('comentario inserido nao foi encontrado');
      return toView(row);
    },

    async remove({ commentId, authorId }: RemoveCommunityCommentParams): Promise<boolean> {
      const rows = await database
        .delete(communityCommentsTable)
        .where(
          and(
            eq(communityCommentsTable.id, commentId),
            eq(communityCommentsTable.authorId, authorId),
          ),
        )
        .returning({ id: communityCommentsTable.id });
      return rows.length > 0;
    },
  };
}
