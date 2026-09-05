/**
 * Pai Presente — API
 * Copyright (c) 2026. Todos os direitos reservados.
 * Licenca: proprietaria.
 */

import type { CommunityCommentRow } from '../community-comment.table';
import type { CreateCommunityCommentBody } from '../community-comment.schema';

/** authorName vem do JOIN com users: o nome nunca e copiado para esta tabela. */
export type CommunityCommentView = CommunityCommentRow & {
  readonly authorName: string | null;
};

export type ListCommunityCommentsParams = {
  readonly postId: string;
  readonly limit: number;
  readonly offset: number;
};

export type ListCommunityCommentsResult = {
  readonly items: readonly CommunityCommentView[];
  readonly total: number;
};

export type CreateCommunityCommentParams = {
  readonly authorId: string;
  readonly values: CreateCommunityCommentBody;
};

export type RemoveCommunityCommentParams = {
  readonly commentId: string;
  readonly authorId: string;
};

export type PostExistencePort = {
  exists(postId: string): Promise<boolean>;
};

export type CommunityCommentRepository = {
  list(params: ListCommunityCommentsParams): Promise<ListCommunityCommentsResult>;
  insert(params: CreateCommunityCommentParams): Promise<CommunityCommentView>;
  remove(params: RemoveCommunityCommentParams): Promise<boolean>;
};
