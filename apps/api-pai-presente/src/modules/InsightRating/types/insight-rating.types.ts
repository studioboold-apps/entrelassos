/**
 * Pai Presente — API
 * Copyright (c) 2026. Todos os direitos reservados.
 * Licenca: proprietaria.
 */

import type { InsightRatingRow } from '../insight-rating.table';
import type { PutInsightRatingBody } from '../insight-rating.schema';

export type ListInsightRatingsParams = {
  readonly userId: string;
  readonly limit: number;
  readonly offset: number;
};

export type ListInsightRatingsResult = {
  readonly items: readonly InsightRatingRow[];
  readonly total: number;
};

export type PutInsightRatingParams = {
  readonly userId: string;
  readonly insightId: string;
  readonly values: PutInsightRatingBody;
};

export type InsightRatingMonthDigestParams = {
  readonly userId: string;
  /** `YYYY-MM`. */
  readonly month: string;
};

export type InsightRatingMonthDigestRow = {
  readonly category: string;
  readonly rating: number;
};

export type InsightRatingRepository = {
  list(params: ListInsightRatingsParams): Promise<ListInsightRatingsResult>;
  upsert(params: PutInsightRatingParams): Promise<InsightRatingRow>;
  listMonthDigest(
    params: InsightRatingMonthDigestParams,
  ): Promise<readonly InsightRatingMonthDigestRow[]>;
};
