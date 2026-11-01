/**
 * Pai Presente — API
 * Copyright (c) 2026. Todos os direitos reservados.
 * Licenca: proprietaria.
 */

import { RATING_MAX, RATING_MIN } from '../shared/shared.constant';
import { REPORT_GRADE_RUBRIC } from './ai.constant';
import type {
  ActivityDigestRow,
  ActivitySummary,
  InsightDigestRow,
  InsightSummary,
} from './types/ai.types';

const PERCENT_MULTIPLIER = 100;
const UNCATEGORIZED = 'sem_categoria';

function average(values: readonly number[]): number | undefined {
  if (values.length === 0) return undefined;
  return values.reduce((total, value) => total + value, 0) / values.length;
}

/**
 * O boletim se conta no SERVIDOR. Na Base44 a tela mandava `completionRate`
 * pronto no prompt: alem de ser uma segunda fonte da verdade, deixava o
 * cliente escolher a propria nota.
 */
export function summarizeActivities(rows: readonly ActivityDigestRow[]): ActivitySummary {
  const countByCategory = new Map<string, number>();
  const ratings: number[] = [];
  let completed = 0;

  for (const row of rows) {
    const category = row.category ?? UNCATEGORIZED;
    countByCategory.set(category, (countByCategory.get(category) ?? 0) + 1);
    if (row.isCompleted) completed += 1;
    if (row.rating !== null) ratings.push(row.rating);
  }

  const total = rows.length;
  return {
    total,
    completed,
    completionRate: total === 0 ? 0 : (completed / total) * PERCENT_MULTIPLIER,
    averageRating: average(ratings),
    countByCategory,
  };
}

export function summarizeInsights(rows: readonly InsightDigestRow[]): InsightSummary {
  const ratingsByCategory = new Map<string, number[]>();
  for (const row of rows) {
    const bucket = ratingsByCategory.get(row.category) ?? [];
    bucket.push(row.rating);
    ratingsByCategory.set(row.category, bucket);
  }

  const averageByCategory = new Map<string, number>();
  for (const [category, ratings] of ratingsByCategory) {
    const value = average(ratings);
    if (value !== undefined) averageByCategory.set(category, value);
  }

  return {
    ratedCount: rows.length,
    averageRating: average(rows.map((row) => row.rating)),
    averageByCategory,
  };
}

/** "Sem categoria" nao e' variedade: e' so' o pai que nao escolheu uma. */
function countCategories(summary: ActivitySummary): number {
  return [...summary.countByCategory.keys()].filter((category) => category !== UNCATEGORIZED).length;
}

function ratio(value: number, target: number): number {
  return Math.min(value / target, 1);
}

/**
 * Nota do boletim pela regua fixa (`REPORT_GRADE_RUBRIC`). Antes o modelo
 * "dava" a nota: o mesmo mes, gerado duas vezes, podia sair 6 e depois 8, e o
 * pai via a nota mudar sem ter feito nada. Mes sem atividade e' 0 — o texto
 * do boletim e' quem acolhe.
 */
export function computeReportGrade(summary: ActivitySummary): number {
  if (summary.total === 0) return 0;
  const { presence, consistency, variety, satisfaction, step } = REPORT_GRADE_RUBRIC;
  const satisfactionShare =
    summary.averageRating === undefined
      ? satisfaction.neutral
      : (summary.averageRating - RATING_MIN) / (RATING_MAX - RATING_MIN);
  const raw =
    presence.weight * ratio(summary.completed, presence.target) +
    consistency.weight * (summary.completionRate / PERCENT_MULTIPLIER) +
    variety.weight * ratio(countCategories(summary), variety.target) +
    satisfaction.weight * satisfactionShare;
  return Math.round(raw / step) * step;
}
