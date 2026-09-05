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
  createActivityBodySchema,
  listActivitiesQuerySchema,
  updateActivityBodySchema,
} from './activity.schema';
import type { ActivityUseCases } from './activity.use-case';

const ACTIVITIES_PATH = '/v1/activities';
const ACTIVITY_PATH = '/v1/activities/:activityId';

export function buildActivityRoutes(useCases: ActivityUseCases): readonly RouteDefinition[] {
  return [
    {
      method: HTTP_METHODS.GET,
      path: ACTIVITIES_PATH,
      summary: 'Lista as atividades do usuario autenticado.',
      handle: async ({ url, authenticatedUser }) => {
        const { page, perPage, offset } = parsePagination(url);
        const filters = parseWithSchema(
          listActivitiesQuerySchema,
          Object.fromEntries(url.searchParams),
        );
        const { items, total } = await useCases.list({
          userId: authenticatedUser.userId,
          filters,
          limit: perPage,
          offset,
        });
        return respondWithList(items, { total, page, perPage });
      },
    },
    {
      method: HTTP_METHODS.POST,
      path: ACTIVITIES_PATH,
      summary: 'Cria uma atividade.',
      handle: async ({ request, authenticatedUser }) => {
        const values = await parseJsonBody(request, createActivityBodySchema);
        const activity = await useCases.create({ userId: authenticatedUser.userId, values });
        return respondWithData(activity, HTTP_STATUS.CREATED);
      },
    },
    {
      method: HTTP_METHODS.GET,
      path: ACTIVITY_PATH,
      summary: 'Detalha uma atividade.',
      handle: async ({ pathParams, authenticatedUser }) => {
        const activityId = parseWithSchema(uuidSchema, pathParams.activityId);
        const activity = await useCases.getById({ activityId, userId: authenticatedUser.userId });
        return respondWithData(activity);
      },
    },
    {
      method: HTTP_METHODS.PATCH,
      path: ACTIVITY_PATH,
      summary: 'Atualiza uma atividade.',
      handle: async ({ request, pathParams, authenticatedUser }) => {
        const activityId = parseWithSchema(uuidSchema, pathParams.activityId);
        const values = await parseJsonBody(request, updateActivityBodySchema);
        const activity = await useCases.update({
          activityId,
          userId: authenticatedUser.userId,
          values,
        });
        return respondWithData(activity);
      },
    },
    {
      method: HTTP_METHODS.DELETE,
      path: ACTIVITY_PATH,
      summary: 'Remove uma atividade.',
      handle: async ({ pathParams, authenticatedUser }) => {
        const activityId = parseWithSchema(uuidSchema, pathParams.activityId);
        await useCases.remove({ activityId, userId: authenticatedUser.userId });
        return respondWithNoContent();
      },
    },
  ];
}
