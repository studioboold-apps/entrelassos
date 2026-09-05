/**
 * Pai Presente — API
 * Copyright (c) 2026. Todos os direitos reservados.
 * Licenca: proprietaria.
 */

import { COOKIE_HEADER } from '../shared/http/http.constant';

export function readCookie(request: Request, name: string): string | undefined {
  const header = request.headers.get(COOKIE_HEADER);
  if (header === null) return undefined;

  for (const part of header.split(';')) {
    const separator = part.indexOf('=');
    if (separator < 0) continue;
    if (part.slice(0, separator).trim() !== name) continue;
    return decodeURIComponent(part.slice(separator + 1).trim());
  }
  return undefined;
}

export type SessionCookieParams = {
  readonly name: string;
  readonly value: string;
  readonly path: string;
  readonly maxAgeSeconds: number;
  readonly isSecure: boolean;
};

/**
 * `HttpOnly` tira o token do alcance de qualquer script — e o que impede que
 * ele acabe em `localStorage` mesmo se alguem quiser (ADR-001 §2.1).
 * `SameSite=Lax` e o que barra POST vindo de outro site.
 */
export function buildSessionCookie({
  name,
  value,
  path,
  maxAgeSeconds,
  isSecure,
}: SessionCookieParams): string {
  const attributes = [
    `${name}=${encodeURIComponent(value)}`,
    `Path=${path}`,
    `Max-Age=${maxAgeSeconds}`,
    'HttpOnly',
    'SameSite=Lax',
  ];
  if (isSecure) attributes.push('Secure');
  return attributes.join('; ');
}

export type ClearedCookieParams = {
  readonly name: string;
  readonly path: string;
  readonly isSecure: boolean;
};

export function buildClearedCookie({ name, path, isSecure }: ClearedCookieParams): string {
  return buildSessionCookie({ name, value: '', path, maxAgeSeconds: 0, isSecure });
}
