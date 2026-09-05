/**
 * Pai Presente — API
 * Copyright (c) 2026. Todos os direitos reservados.
 * Licenca: proprietaria.
 */

import type { InsightRatingRow } from './insight-rating.table';
import type {
  InsightRatingRepository,
  ListInsightRatingsParams,
  ListInsightRatingsResult,
  PutInsightRatingParams,
} from './types/insight-rating.types';

export type InsightRatingUseCases = {
  list(params: ListInsightRatingsParams): Promise<ListInsightRatingsResult>;
  put(params: PutInsightRatingParams): Promise<InsightRatingRow>;
};

export function createInsightRatingUseCases(
  repository: InsightRatingRepository,
): InsightRatingUseCases {
  return {
    list: (params) => repository.list(params),
    put: (params) => repository.upsert(params),
  };
}
