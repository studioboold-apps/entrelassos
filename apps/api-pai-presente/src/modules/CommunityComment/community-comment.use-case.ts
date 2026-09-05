/**
 * Pai Presente — API
 * Copyright (c) 2026. Todos os direitos reservados.
 * Licenca: proprietaria.
 */

import { ERROR_CODES } from '../shared/errors/codes';
import { ResourceNotFoundError } from '../shared/errors/shared.error';
import type {
  CommunityCommentRepository,
  CommunityCommentView,
  CreateCommunityCommentParams,
  ListCommunityCommentsParams,
  ListCommunityCommentsResult,
  PostExistencePort,
  RemoveCommunityCommentParams,
} from './types/community-comment.types';

export type CommunityCommentUseCases = {
  list(params: ListCommunityCommentsParams): Promise<ListCommunityCommentsResult>;
  create(params: CreateCommunityCommentParams): Promise<CommunityCommentView>;
  remove(params: RemoveCommunityCommentParams): Promise<void>;
};

export type CreateCommunityCommentUseCasesParams = {
  readonly repository: CommunityCommentRepository;
  readonly postExistence: PostExistencePort;
};

export function createCommunityCommentUseCases({
  repository,
  postExistence,
}: CreateCommunityCommentUseCasesParams): CommunityCommentUseCases {
  async function assertPostExists(postId: string): Promise<void> {
    if (await postExistence.exists(postId)) return;
    throw new ResourceNotFoundError(ERROR_CODES.community.POST_NOT_FOUND, 'Post nao encontrado.');
  }

  return {
    async list(params) {
      await assertPostExists(params.postId);
      return repository.list(params);
    },

    async create(params) {
      await assertPostExists(params.values.postId);
      return repository.insert(params);
    },

    async remove(params) {
      const wasRemoved = await repository.remove(params);
      if (wasRemoved) return;
      throw new ResourceNotFoundError(
        ERROR_CODES.community.COMMENT_NOT_FOUND,
        'Comentario nao encontrado.',
      );
    },
  };
}
