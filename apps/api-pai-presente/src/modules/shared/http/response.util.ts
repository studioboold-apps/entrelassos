/**
 * Pai Presente — API
 * Copyright (c) 2026. Todos os direitos reservados.
 * Licenca: proprietaria.
 */

import type { FieldErrorDetail } from '../errors/app.error';
import { CONTENT_TYPE_JSON, HTTP_STATUS, SECURITY_HEADERS, SET_COOKIE_HEADER } from './http.constant';

export type PaginationEnvelope = {
  readonly total: number;
  readonly page: number;
  readonly perPage: number;
};

function buildHeaders(): Headers {
  const headers = new Headers(SECURITY_HEADERS);
  headers.set('Content-Type', CONTENT_TYPE_JSON);
  return headers;
}

export function respondWithData(data: unknown, statusCode: number = HTTP_STATUS.OK): Response {
  return new Response(JSON.stringify({ data }), { status: statusCode, headers: buildHeaders() });
}

export function respondWithList(data: readonly unknown[], pagination: PaginationEnvelope): Response {
  return new Response(JSON.stringify({ data, pagination }), {
    status: HTTP_STATUS.OK,
    headers: buildHeaders(),
  });
}

export function respondWithNoContent(): Response {
  return new Response(null, { status: HTTP_STATUS.NO_CONTENT, headers: new Headers(SECURITY_HEADERS) });
}

export type RespondWithErrorParams = {
  readonly code: string;
  readonly message: string;
  readonly statusCode: number;
  readonly details: readonly FieldErrorDetail[];
};

export function respondWithError({
  code,
  message,
  statusCode,
  details,
}: RespondWithErrorParams): Response {
  const error = details.length > 0 ? { code, message, details } : { code, message };
  return new Response(JSON.stringify({ error }), { status: statusCode, headers: buildHeaders() });
}

/**
 * Cookie NAO entra no corpo nem na URL: a unica saida de token e este cabecalho,
 * e por isso ele se acrescenta a resposta pronta em vez de virar mais um
 * parametro em cada helper.
 */
export function withCookies(response: Response, cookies: readonly string[]): Response {
  const headers = new Headers(response.headers);
  for (const cookie of cookies) headers.append(SET_COOKIE_HEADER, cookie);
  return new Response(response.body, { status: response.status, headers });
}
