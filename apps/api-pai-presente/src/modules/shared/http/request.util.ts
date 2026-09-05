/**
 * Pai Presente — API
 * Copyright (c) 2026. Todos os direitos reservados.
 * Licenca: proprietaria.
 */

import type { ZodType } from 'zod';

import type { FieldErrorDetail } from '../errors/app.error';
import { ValidationError } from '../errors/shared.error';
import { PAGE_SIZE_DEFAULT, PAGE_SIZE_MAX } from './http.constant';

export type PaginationQuery = {
  readonly page: number;
  readonly perPage: number;
  readonly offset: number;
};

export function parseWithSchema<TValue>(schema: ZodType<TValue>, value: unknown): TValue {
  const result = schema.safeParse(value);
  if (result.success) return result.data;

  const details: FieldErrorDetail[] = result.error.issues.map((issue) => ({
    field: issue.path.join('.'),
    message: issue.message,
  }));
  throw new ValidationError(details);
}

export async function parseJsonBody<TValue>(
  request: Request,
  schema: ZodType<TValue>,
): Promise<TValue> {
  const raw = await request.text();
  if (raw.length === 0) return parseWithSchema(schema, {});

  try {
    return parseWithSchema(schema, JSON.parse(raw) as unknown);
  } catch (error) {
    if (error instanceof ValidationError) throw error;
    throw new ValidationError([{ field: 'body', message: 'JSON invalido.' }]);
  }
}

function parsePositiveInteger(raw: string | null, fallback: number): number {
  if (raw === null) return fallback;
  const parsed = Number.parseInt(raw, 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

export function parsePagination(url: URL): PaginationQuery {
  const page = parsePositiveInteger(url.searchParams.get('page'), 1);
  const requested = parsePositiveInteger(url.searchParams.get('perPage'), PAGE_SIZE_DEFAULT);
  const perPage = Math.min(requested, PAGE_SIZE_MAX);
  return { page, perPage, offset: (page - 1) * perPage };
}
