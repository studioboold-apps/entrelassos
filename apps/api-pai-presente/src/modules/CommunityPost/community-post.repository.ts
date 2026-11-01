/**
 * Pai Presente — API
 * Copyright (c) 2026. Todos os direitos reservados.
 * Licenca: proprietaria.
 */

import { and, count, desc, eq, getTableColumns, isNotNull, sql, type SQL } from 'drizzle-orm';

import type { Database } from '../../database/client';
import { communityCommentsTable } from '../CommunityComment/community-comment.table';
import { usersTable } from '../User/user.table';
import { splitImageDataUrl } from '../shared/shared.schema';
import { communityPostLikesTable, communityPostsTable, type CommunityPostRow } from './community-post.table';
import type {
  CommunityPostRepository,
  CommunityPostView,
  CreateCommunityPostParams,
  CommunityPostImage,
  FindCommunityPostParams,
  ListCommunityPostsParams,
  ListCommunityPostsResult,
  ToggleLikeParams,
} from './types/community-post.types';

/** Tudo do post MENOS a foto: o feed lista dezenas de posts, e a foto pesa. */
const { imageData, imageContentType: _imageContentType, ...POST_COLUMNS } = getTableColumns(communityPostsTable);

export function createCommunityPostRepository(database: Database): CommunityPostRepository {
  function buildSelection(viewerId: string) {
    return {
      post: POST_COLUMNS,
      hasImage: isNotNull(imageData).mapWith(Boolean),
      authorName: usersTable.fullName,
      likesCount: sql<number>`(
        select count(*) from ${communityPostLikesTable}
        where ${communityPostLikesTable.postId} = ${communityPostsTable.id}
      )`.mapWith(Number),
      commentsCount: sql<number>`(
        select count(*) from ${communityCommentsTable}
        where ${communityCommentsTable.postId} = ${communityPostsTable.id}
      )`.mapWith(Number),
      hasLiked: sql<boolean>`exists (
        select 1 from ${communityPostLikesTable}
        where ${communityPostLikesTable.postId} = ${communityPostsTable.id}
          and ${communityPostLikesTable.userId} = ${viewerId}
      )`.mapWith(Boolean),
    } as const;
  }

  const AUTHOR_JOIN = eq(usersTable.id, communityPostsTable.authorId);

  type JoinedRow = {
    readonly post: Omit<CommunityPostRow, 'imageData' | 'imageContentType'>;
    readonly hasImage: boolean;
    readonly authorName: string | null;
    readonly likesCount: number;
    readonly commentsCount: number;
    readonly hasLiked: boolean;
  };

  function toView({ post, hasImage, authorName, likesCount, commentsCount, hasLiked }: JoinedRow): CommunityPostView {
    return { ...post, hasImage, authorName, likesCount, commentsCount, hasLiked };
  }

  async function loadView(postId: string, viewerId: string): Promise<CommunityPostView | undefined> {
    const rows = await database
      .select(buildSelection(viewerId))
      .from(communityPostsTable)
      .innerJoin(usersTable, AUTHOR_JOIN)
      .where(eq(communityPostsTable.id, postId))
      .limit(1);
    const row = rows[0];
    return row === undefined ? undefined : toView(row);
  }

  return {
    async list({ viewerId, filters, limit, offset }: ListCommunityPostsParams): Promise<ListCommunityPostsResult> {
      const where: SQL | undefined =
        filters.category === undefined ? undefined : eq(communityPostsTable.category, filters.category);
      const [rows, totals] = await Promise.all([
        database
          .select(buildSelection(viewerId))
          .from(communityPostsTable)
          .innerJoin(usersTable, AUTHOR_JOIN)
          .where(where)
          .orderBy(desc(communityPostsTable.createdAt))
          .limit(limit)
          .offset(offset),
        database.select({ value: count() }).from(communityPostsTable).where(where),
      ]);
      return { items: rows.map(toView), total: totals[0]?.value ?? 0 };
    },

    findById: ({ postId, viewerId }: FindCommunityPostParams) => loadView(postId, viewerId),

    async findImage(postId: string): Promise<CommunityPostImage | undefined> {
      const rows = await database
        .select({ base64: imageData, contentType: communityPostsTable.imageContentType })
        .from(communityPostsTable)
        .where(eq(communityPostsTable.id, postId))
        .limit(1);
      const row = rows[0];
      if (row?.base64 == null || row.contentType == null) return undefined;
      return { base64: row.base64, contentType: row.contentType };
    },

    async exists(postId: string): Promise<boolean> {
      const rows = await database
        .select({ id: communityPostsTable.id })
        .from(communityPostsTable)
        .where(eq(communityPostsTable.id, postId))
        .limit(1);
      return rows.length > 0;
    },

    async insert({ authorId, values }: CreateCommunityPostParams): Promise<CommunityPostView> {
      const rows = await database
        .insert(communityPostsTable)
        .values({
          content: values.content,
          category: values.category,
          authorId,
          ...(values.image === undefined
            ? {}
            : (({ contentType, base64 }) => ({ imageData: base64, imageContentType: contentType }))(
                splitImageDataUrl(values.image),
              )),
        })
        .returning({ id: communityPostsTable.id });
      const postId = rows[0]?.id;
      if (postId === undefined) throw new Error('insert de post nao retornou linha');
      const view = await loadView(postId, authorId);
      if (view === undefined) throw new Error('post inserido nao foi encontrado');
      return view;
    },

    /** Curtir duas vezes e a mesma curtida: a PK composta absorve a repeticao. */
    async addLike({ postId, userId }: ToggleLikeParams): Promise<void> {
      await database
        .insert(communityPostLikesTable)
        .values({ postId, userId })
        .onConflictDoNothing();
    },

    async removeLike({ postId, userId }: ToggleLikeParams): Promise<void> {
      await database
        .delete(communityPostLikesTable)
        .where(
          and(eq(communityPostLikesTable.postId, postId), eq(communityPostLikesTable.userId, userId)),
        );
    },

    async remove({ postId, authorId }): Promise<boolean> {
      const rows = await database
        .delete(communityPostsTable)
        .where(and(eq(communityPostsTable.id, postId), eq(communityPostsTable.authorId, authorId)))
        .returning({ id: communityPostsTable.id });
      return rows.length > 0;
    },
  };
}
