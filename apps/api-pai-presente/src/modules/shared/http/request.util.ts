/**
 * Pai Presente — API
 * Copyright (c) 2026. Todos os direitos reservados.
 * Licenca: proprietaria.
 */

import type { ZodType } from 'zod';

import type { FieldErrorDetail } from '../errors/app.error';
import { ValidationError } from '../errors/shared.error';
import { CLIENT_IP_LENGTH, UNKNOWN_CLIENT_IP } from '../shared.constant';
import { FORWARDED_FOR_HEADER, PAGE_SIZE_DEFAULT, PAGE_SIZE_MAX, REAL_IP_HEADER } from './http.constant';

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

/**
 * `security.md` §10 pede o IP na trilha de auditoria, e a decisao D6 poe a API
 * atras de Fly.io ou Railway. La `server.requestIP()` devolve o endereco do
 * PROXY — o mesmo para todo mundo —, o que e pior que nao registrar: a coluna
 * ficaria cheia e inutil, parecendo prova. Quem sabe a origem e o proxy, e ele
 * conta no cabecalho.
 *
 * O primeiro da cadeia e o cliente; os seguintes sao os saltos. E o cabecalho
 * e entrada NAO CONFIAVEL: sem corte, um valor de dez mil caracteres derruba o
 * `INSERT` da auditoria — e com ele a exclusao inteira, que roda na mesma
 * transacao.
 */
export function readClientIp(request: Request): string {
  const chain = request.headers.get(FORWARDED_FOR_HEADER) ?? '';
  const [first = ''] = chain.split(',');
  const forwarded = first.trim();
  const candidate =
    forwarded.length > 0 ? forwarded : (request.headers.get(REAL_IP_HEADER) ?? '').trim();

  if (candidate.length === 0) return UNKNOWN_CLIENT_IP;
  return candidate.slice(0, CLIENT_IP_LENGTH);
}
