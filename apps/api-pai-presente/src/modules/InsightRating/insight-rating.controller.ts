/**
 * Pai Presente — API
 * Copyright (c) 2026. Todos os direitos reservados.
 * Licenca: proprietaria.
 */

import { HTTP_METHODS } from '../shared/http/http.constant';
import { parseJsonBody, parsePagination, parseWithSchema } from '../shared/http/request.util';
import { respondWithData, respondWithList } from '../shared/http/response.util';
import type { RouteDefinition } from '../shared/http/route.types';
import { insightIdSchema, putInsightRatingBodySchema } from './insight-rating.schema';
import type { InsightRatingUseCases } from './insight-rating.use-case';

export function buildInsightRatingRoutes(
  useCases: InsightRatingUseCases,
): readonly RouteDefinition[] {
  return [
    {
      method: HTTP_METHODS.GET,
      path: '/v1/insight-ratings',
      summary: 'Lista as notas de insight do usuario autenticado.',
      handle: async ({ url, authenticatedUser }) => {
        const { page, perPage, offset } = parsePagination(url);
        const { items, total } = await useCases.list({
          userId: authenticatedUser.userId,
          limit: perPage,
          offset,
        });
        return respondWithList(items, { total, page, perPage });
      },
    },
    {
      method: HTTP_METHODS.PUT,
      path: '/v1/insight-ratings/:insightId',
      summary: 'Grava a nota de um insight; reavaliar atualiza a mesma linha.',
      handle: async ({ request, pathParams, authenticatedUser }) => {
        const insightId = parseWithSchema(insightIdSchema, pathParams.insightId);
        const values = await parseJsonBody(request, putInsightRatingBodySchema);
        const rating = await useCases.put({
          userId: authenticatedUser.userId,
          insightId,
          values,
        });
        return respondWithData(rating);
      },
    },
  ];
}
