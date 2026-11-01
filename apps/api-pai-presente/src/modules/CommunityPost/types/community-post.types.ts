/**
 * Pai Presente — API
 * Copyright (c) 2026. Todos os direitos reservados.
 * Licenca: proprietaria.
 */

import type { CommunityPostRow } from '../community-post.table';
import type {
  CreateCommunityPostBody,
  ListCommunityPostsQuery,
} from '../community-post.schema';

/**
 * likesCount sai do COUNT das curtidas, nunca de coluna guardada ao lado:
 * as duas verdades concordam ate a primeira curtida perdida (decisao de TB.4).
 */
/** A foto nao viaja no post; `hasImage` diz se ha' uma para buscar. */
export type CommunityPostView = Omit<CommunityPostRow, 'imageData' | 'imageContentType'> & {
  readonly hasImage: boolean;
  /** Vem do JOIN com users: a tabela guarda o vinculo, nunca uma copia do nome. */
  readonly authorName: string | null;
  readonly likesCount: number;
  readonly hasLiked: boolean;
  readonly commentsCount: number;
};

export type ListCommunityPostsParams = {
  readonly viewerId: string;
  readonly filters: ListCommunityPostsQuery;
  readonly limit: number;
  readonly offset: number;
};

export type ListCommunityPostsResult = {
  readonly items: readonly CommunityPostView[];
  readonly total: number;
};

export type FindCommunityPostParams = {
  readonly postId: string;
  readonly viewerId: string;
};

export type CreateCommunityPostParams = {
  readonly authorId: string;
  readonly values: CreateCommunityPostBody;
};

export type ToggleLikeParams = {
  readonly postId: string;
  readonly userId: string;
};

export type CommunityPostImage = {
  readonly contentType: string;
  readonly base64: string;
};

export type CommunityPostRepository = {
  findImage(postId: string): Promise<CommunityPostImage | undefined>;
  list(params: ListCommunityPostsParams): Promise<ListCommunityPostsResult>;
  findById(params: FindCommunityPostParams): Promise<CommunityPostView | undefined>;
  exists(postId: string): Promise<boolean>;
  insert(params: CreateCommunityPostParams): Promise<CommunityPostView>;
  addLike(params: ToggleLikeParams): Promise<void>;
  removeLike(params: ToggleLikeParams): Promise<void>;
  remove(params: { readonly postId: string; readonly authorId: string }): Promise<boolean>;
};
