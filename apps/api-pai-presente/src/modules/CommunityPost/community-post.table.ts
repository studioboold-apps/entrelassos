/**
 * Pai Presente — API
 * Copyright (c) 2026. Todos os direitos reservados.
 * Licenca: proprietaria.
 */

import { index, pgTable, primaryKey, text, uuid, varchar } from 'drizzle-orm/pg-core';

import { usersTable } from '../User/user.table';
import { buildIdentityColumns } from '../shared/columns.constant';
import { DOMAIN_VALUE_LENGTH } from '../shared/shared.constant';

// A Base44 guardava likes_count AO LADO de liked_by[]: duas verdades para o
// mesmo fato, que concordam ate a primeira curtida perdida. Aqui a curtida e
// linha em community_post_likes e a contagem sai do COUNT.
export const communityPostsTable = pgTable(
  'community_posts',
  {
    ...buildIdentityColumns(),
    authorId: uuid('author_id')
      .notNull()
      .references(() => usersTable.id, { onDelete: 'cascade' }),
    content: text('content').notNull(),
    category: varchar('category', { length: DOMAIN_VALUE_LENGTH }).notNull(),
  },
  (table) => [index('community_posts_author_id_idx').on(table.authorId)],
);

export const communityPostLikesTable = pgTable(
  'community_post_likes',
  {
    postId: uuid('post_id')
      .notNull()
      .references(() => communityPostsTable.id, { onDelete: 'cascade' }),
    userId: uuid('user_id')
      .notNull()
      .references(() => usersTable.id, { onDelete: 'cascade' }),
  },
  (table) => [
    primaryKey({ columns: [table.postId, table.userId] }),
    index('community_post_likes_user_id_idx').on(table.userId),
  ],
);

export type CommunityPostRow = typeof communityPostsTable.$inferSelect;
export type NewCommunityPostRow = typeof communityPostsTable.$inferInsert;
export type CommunityPostLikeRow = typeof communityPostLikesTable.$inferSelect;
