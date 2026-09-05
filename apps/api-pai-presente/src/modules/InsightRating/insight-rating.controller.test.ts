/**
 * Pai Presente — API
 * Copyright (c) 2026. Todos os direitos reservados.
 * Licenca: proprietaria.
 */

import { beforeEach, describe, expect, test } from 'bun:test';

import {
  createTestClient,
  KNOWN_ID,
  OTHER_USER_ID,
  readDataList,
  readDataRecord,
  readErrorCode,
  TEST_USER_ID,
  type TestClient,
} from '../../testing/http-test.util';
import { applyOverrides, buildIdentity, type RowOverrides } from '../../testing/row.factory';
import { ERROR_CODES } from '../shared/errors/codes';
import { HTTP_METHODS } from '../shared/http/http.constant';
import { buildInsightRatingRoutes } from './insight-rating.controller';
import { createInsightRatingUseCases } from './insight-rating.use-case';
import type { InsightRatingRow } from './insight-rating.table';
import type { InsightRatingRepository } from './types/insight-rating.types';

const RATINGS_PATH = '/v1/insight-ratings';
const INSIGHT_ID = 'insight-comportamento-noite';
const OTHER_ROW_ID = '99999999-9999-4999-8999-999999999999';

function buildRatingRow(overrides: RowOverrides<InsightRatingRow> = {}): InsightRatingRow {
  return applyOverrides({
    ...buildIdentity(KNOWN_ID),
    userId: TEST_USER_ID,
    insightId: INSIGHT_ID,
    category: 'comportamento',
    rating: 3,
    insightTitle: null,
  }, overrides);
}

/** A unicidade (userId, insightId) e o que faz reavaliar virar UPDATE, nao linha nova. */
function createFakeInsightRatingRepository(rows: InsightRatingRow[]): InsightRatingRepository {
  return {
    list: async ({ userId, limit, offset }) => {
      const owned = rows.filter((row) => row.userId === userId);
      return { items: owned.slice(offset, offset + limit), total: owned.length };
    },
    listMonthDigest: async ({ userId, month }) =>
      rows
        .filter((row) => row.userId === userId && row.createdAt.toISOString().startsWith(month))
        .map(({ category, rating }) => ({ category, rating })),
    upsert: async ({ userId, insightId, values }) => {
      const index = rows.findIndex((row) => row.userId === userId && row.insightId === insightId);
      const current = rows[index];
      if (current === undefined) {
        const created = buildRatingRow({ userId, insightId, ...values });
        rows.push(created);
        return created;
      }
      const updated: InsightRatingRow = applyOverrides(current, values);
      rows[index] = updated;
      return updated;
    },
  };
}

let rows: InsightRatingRow[];
let client: TestClient;

beforeEach(() => {
  rows = [
    buildRatingRow(),
    buildRatingRow({ ...buildIdentity(OTHER_ROW_ID), userId: OTHER_USER_ID }),
  ];
  const useCases = createInsightRatingUseCases(createFakeInsightRatingRepository(rows));
  client = createTestClient({ routes: buildInsightRatingRoutes(useCases) });
});

describe('GET /v1/insight-ratings', () => {
  test('lista so as notas do usuario', async () => {
    const response = await client.send({ method: HTTP_METHODS.GET, path: RATINGS_PATH });
    expect(response.status).toBe(200);
    expect(readDataList(response)).toHaveLength(1);
  });
});

describe('PUT /v1/insight-ratings/:insightId', () => {
  test('reavaliar o mesmo insight atualiza a linha em vez de criar outra', async () => {
    const response = await client.send({
      method: HTTP_METHODS.PUT,
      path: `${RATINGS_PATH}/${INSIGHT_ID}`,
      body: { category: 'comportamento', rating: 5 },
    });
    expect(response.status).toBe(200);
    expect(readDataRecord(response).rating).toBe(5);
    expect(rows.filter((row) => row.userId === TEST_USER_ID)).toHaveLength(1);
  });

  test('nota fora de 1..5 responde 400', async () => {
    const response = await client.send({
      method: HTTP_METHODS.PUT,
      path: `${RATINGS_PATH}/${INSIGHT_ID}`,
      body: { category: 'comportamento', rating: 0 },
    });
    expect(response.status).toBe(400);
    expect(readErrorCode(response)).toBe(ERROR_CODES.shared.VALIDATION_FAILED);
  });
});
