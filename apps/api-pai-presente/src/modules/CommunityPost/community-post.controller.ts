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
  createCommunityPostBodySchema,
  listCommunityPostsQuerySchema,
} from './community-post.schema';
import type { CommunityPostUseCases } from './community-post.use-case';

const POSTS_PATH = '/v1/community/posts';
const POST_PATH = '/v1/community/posts/:postId';
const POST_LIKE_PATH = '/v1/community/posts/:postId/like';

export function buildCommunityPostRoutes(
  useCases: CommunityPostUseCases,
): readonly RouteDefinition[] {
  return [
    {
      method: HTTP_METHODS.GET,
      path: POSTS_PATH,
      summary: 'Lista os posts da comunidade.',
      handle: async ({ url, authenticatedUser }) => {
        const { page, perPage, offset } = parsePagination(url);
        const filters = parseWithSchema(
          listCommunityPostsQuerySchema,
          Object.fromEntries(url.searchParams),
        );
        const { items, total } = await useCases.list({
          viewerId: authenticatedUser.userId,
          filters,
          limit: perPage,
          offset,
        });
        return respondWithList(items, { total, page, perPage });
      },
    },
    {
      method: HTTP_METHODS.POST,
      path: POSTS_PATH,
      summary: 'Publica um post na comunidade.',
      handle: async ({ request, authenticatedUser }) => {
        const values = await parseJsonBody(request, createCommunityPostBodySchema);
        const post = await useCases.create({ authorId: authenticatedUser.userId, values });
        return respondWithData(post, HTTP_STATUS.CREATED);
      },
    },
    {
      method: HTTP_METHODS.GET,
      path: POST_PATH,
      summary: 'Detalha um post da comunidade.',
      handle: async ({ pathParams, authenticatedUser }) => {
        const postId = parseWithSchema(uuidSchema, pathParams.postId);
        const post = await useCases.getById({ postId, viewerId: authenticatedUser.userId });
        return respondWithData(post);
      },
    },
    {
      method: HTTP_METHODS.DELETE,
      path: POST_PATH,
      summary: 'Remove um post do proprio autor.',
      handle: async ({ pathParams, authenticatedUser }) => {
        const postId = parseWithSchema(uuidSchema, pathParams.postId);
        await useCases.remove({ postId, authorId: authenticatedUser.userId });
        return respondWithNoContent();
      },
    },
    {
      method: HTTP_METHODS.PUT,
      path: POST_LIKE_PATH,
      summary: 'Curte um post; repetir a chamada nao acumula curtida.',
      handle: async ({ pathParams, authenticatedUser }) => {
        const postId = parseWithSchema(uuidSchema, pathParams.postId);
        const post = await useCases.like({ postId, userId: authenticatedUser.userId });
        return respondWithData(post);
      },
    },
    {
      method: HTTP_METHODS.DELETE,
      path: POST_LIKE_PATH,
      summary: 'Descurte um post.',
      handle: async ({ pathParams, authenticatedUser }) => {
        const postId = parseWithSchema(uuidSchema, pathParams.postId);
        const post = await useCases.unlike({ postId, userId: authenticatedUser.userId });
        return respondWithData(post);
      },
    },
  ];
}
