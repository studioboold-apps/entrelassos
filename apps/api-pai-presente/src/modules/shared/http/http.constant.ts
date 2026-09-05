/**
 * Pai Presente — API
 * Copyright (c) 2026. Todos os direitos reservados.
 * Licenca: proprietaria.
 */

export const HTTP_METHODS = {
  GET: 'GET',
  POST: 'POST',
  PUT: 'PUT',
  PATCH: 'PATCH',
  DELETE: 'DELETE',
  OPTIONS: 'OPTIONS',
} as const;
export type HttpMethod = (typeof HTTP_METHODS)[keyof typeof HTTP_METHODS];

export const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  NO_CONTENT: 204,
  FORBIDDEN: 403,
  SERVICE_UNAVAILABLE: 503,
} as const;

export const CONTENT_TYPE_JSON = 'application/json; charset=utf-8';

export const API_VERSION_PREFIX = '/v1';
export const SET_COOKIE_HEADER = 'Set-Cookie';
export const COOKIE_HEADER = 'Cookie';
export const ORIGIN_HEADER = 'Origin';
export const HEALTH_PATH = '/health';
export const SHUTDOWN_TIMEOUT_MS = 10_000;

/** Teto de paginacao (apis.md § Paginacao). */
export const PAGE_SIZE_DEFAULT = 20;
export const PAGE_SIZE_MAX = 100;

/** Cabecalhos de resposta obrigatorios (security.md §3). */
export const SECURITY_HEADERS = {
  'X-Frame-Options': 'DENY',
  'X-Content-Type-Options': 'nosniff',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
} as const;

/** Pre-flight (security.md §3): allowlist explicita, nunca `*` com credencial. */
export const CORS_ALLOWED_METHODS = 'GET, POST, PUT, PATCH, DELETE, OPTIONS';
export const CORS_ALLOWED_HEADERS = 'Content-Type';
export const CORS_MAX_AGE_SECONDS = '600';

/** Cabecalhos que o proxy usa para contar o endereco de origem. */
export const FORWARDED_FOR_HEADER = 'x-forwarded-for';
export const REAL_IP_HEADER = 'x-real-ip';
