/**
 * Pai Presente — API
 * Copyright (c) 2026. Todos os direitos reservados.
 * Licenca: proprietaria.
 */

import { and, asc, count, eq } from 'drizzle-orm';

import type { Database } from '../../database/client';
import { communityCommentsTable, type CommunityCommentRow } from './community-comment.table';
import type {
  CommunityCommentRepository,
  CreateCommunityCommentParams,
  ListCommunityCommentsParams,
  ListCommunityCommentsResult,
  RemoveCommunityCommentParams,
} from './types/community-comment.types';

export function createCommunityCommentRepository(database: Database): CommunityCommentRepository {
  return {
    async list({ postId, limit, offset }: ListCommunityCommentsParams): Promise<ListCommunityCommentsResult> {
      const where = eq(communityCommentsTable.postId, postId);
      const [items, totals] = await Promise.all([
        database
          .select()
          .from(communityCommentsTable)
          .where(where)
          .orderBy(asc(communityCommentsTable.createdAt))
          .limit(limit)
          .offset(offset),
        database.select({ value: count() }).from(communityCommentsTable).where(where),
      ]);
      return { items, total: totals[0]?.value ?? 0 };
    },

    async insert({ authorId, values }: CreateCommunityCommentParams): Promise<CommunityCommentRow> {
      const rows = await database
        .insert(communityCommentsTable)
        .values({ ...values, authorId })
        .returning();
      const row = rows[0];
      if (row === undefined) throw new Error('insert de comentario nao retornou linha');
      return row;
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
