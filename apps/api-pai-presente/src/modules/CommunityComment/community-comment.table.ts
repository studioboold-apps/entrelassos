/**
 * Pai Presente — API
 * Copyright (c) 2026. Todos os direitos reservados.
 * Licenca: proprietaria.
 */

import { index, pgTable, text, uuid } from 'drizzle-orm/pg-core';

import { communityPostsTable } from '../CommunityPost/community-post.table';
import { usersTable } from '../User/user.table';
import { buildIdentityColumns } from '../shared/columns.constant';

// author_name saiu: e copia do nome que ja esta em users, e copia diverge.
export const communityCommentsTable = pgTable(
  'community_comments',
  {
    ...buildIdentityColumns(),
    postId: uuid('post_id')
      .notNull()
      .references(() => communityPostsTable.id, { onDelete: 'cascade' }),
    authorId: uuid('author_id')
      .notNull()
      .references(() => usersTable.id, { onDelete: 'cascade' }),
    content: text('content').notNull(),
  },
  (table) => [index('community_comments_post_id_idx').on(table.postId)],
);

export type CommunityCommentRow = typeof communityCommentsTable.$inferSelect;
export type NewCommunityCommentRow = typeof communityCommentsTable.$inferInsert;
