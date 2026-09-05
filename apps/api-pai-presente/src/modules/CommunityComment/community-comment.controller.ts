/**
 * Pai Presente — API
 * Copyright (c) 2026. Todos os direitos reservados.
 * Licenca: proprietaria.
 */

import { HTTP_METHODS, HTTP_STATUS } from '../shared/http/http.constant';
import { parseJsonBody, parsePagination, parseWithSchema } from '../shared/http/request.util';
import {
  respondWithData,
  respondWithList,
  respondWithNoContent,
} from '../shared/http/response.util';
import type { RouteDefinition } from '../shared/http/route.types';
import { uuidSchema } from '../shared/shared.schema';
import {
  createCommunityCommentBodySchema,
  listCommunityCommentsQuerySchema,
} from './community-comment.schema';
import type { CommunityCommentUseCases } from './community-comment.use-case';

const COMMENTS_PATH = '/v1/community/comments';

export function buildCommunityCommentRoutes(
  useCases: CommunityCommentUseCases,
): readonly RouteDefinition[] {
  return [
    {
      method: HTTP_METHODS.GET,
      path: COMMENTS_PATH,
      summary: 'Lista os comentarios de um post.',
      handle: async ({ url }) => {
        const { page, perPage, offset } = parsePagination(url);
        const { postId } = parseWithSchema(
          listCommunityCommentsQuerySchema,
          Object.fromEntries(url.searchParams),
        );
        const { items, total } = await useCases.list({ postId, limit: perPage, offset });
        return respondWithList(items, { total, page, perPage });
      },
    },
    {
      method: HTTP_METHODS.POST,
      path: COMMENTS_PATH,
      summary: 'Comenta em um post.',
      handle: async ({ request, authenticatedUser }) => {
        const values = await parseJsonBody(request, createCommunityCommentBodySchema);
        const comment = await useCases.create({ authorId: authenticatedUser.userId, values });
        return respondWithData(comment, HTTP_STATUS.CREATED);
      },
    },
    {
      method: HTTP_METHODS.DELETE,
      path: '/v1/community/comments/:commentId',
      summary: 'Remove um comentario do proprio autor.',
      handle: async ({ pathParams, authenticatedUser }) => {
        const commentId = parseWithSchema(uuidSchema, pathParams.commentId);
        await useCases.remove({ commentId, authorId: authenticatedUser.userId });
        return respondWithNoContent();
      },
    },
  ];
}
