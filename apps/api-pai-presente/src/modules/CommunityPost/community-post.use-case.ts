/**
 * Pai Presente — API
 * Copyright (c) 2026. Todos os direitos reservados.
 * Licenca: proprietaria.
 */

import { ERROR_CODES } from '../shared/errors/codes';
import { ResourceNotFoundError } from '../shared/errors/shared.error';
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

function postNotFound(): never {
  throw new ResourceNotFoundError(ERROR_CODES.community.POST_NOT_FOUND, 'Post nao encontrado.');
}

export type CommunityPostUseCases = {
  list(params: ListCommunityPostsParams): Promise<ListCommunityPostsResult>;
  getById(params: FindCommunityPostParams): Promise<CommunityPostView>;
  create(params: CreateCommunityPostParams): Promise<CommunityPostView>;
  like(params: ToggleLikeParams): Promise<CommunityPostView>;
  unlike(params: ToggleLikeParams): Promise<CommunityPostView>;
  remove(params: { readonly postId: string; readonly authorId: string }): Promise<void>;
  readImage(postId: string): Promise<CommunityPostImage>;
};

export function createCommunityPostUseCases(
  repository: CommunityPostRepository,
): CommunityPostUseCases {
  async function reload(postId: string, viewerId: string): Promise<CommunityPostView> {
    const post = await repository.findById({ postId, viewerId });
    return post ?? postNotFound();
  }

  return {
    list: (params) => repository.list(params),

    getById: ({ postId, viewerId }) => reload(postId, viewerId),

    create: (params) => repository.insert(params),

    async like({ postId, userId }) {
      if (!(await repository.exists(postId))) postNotFound();
      await repository.addLike({ postId, userId });
      return reload(postId, userId);
    },

    async unlike({ postId, userId }) {
      if (!(await repository.exists(postId))) postNotFound();
      await repository.removeLike({ postId, userId });
      return reload(postId, userId);
    },

    async readImage(postId) {
      return (await repository.findImage(postId)) ?? postNotFound();
    },

    async remove(params) {
      const wasRemoved = await repository.remove(params);
      if (!wasRemoved) postNotFound();
    },
  };
}
