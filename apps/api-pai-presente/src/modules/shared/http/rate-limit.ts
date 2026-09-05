/**
 * Pai Presente — API
 * Copyright (c) 2026. Todos os direitos reservados.
 * Licenca: proprietaria.
 */

import { TooManyRequestsError } from '../errors/shared.error';

export type RateLimitPolicy = {
  readonly maxRequests: number;
  readonly windowSeconds: number;
};

export type RateLimiter = {
  /** Consome uma vaga da janela, ou lanca 429. */
  consume(key: string): void;
};

const MILLISECONDS_PER_SECOND = 1000;

/**
 * Janela deslizante em MEMORIA: vale por processo, e e proposital enquanto a
 * API roda numa instancia so. Trocar por Redis e trocar este arquivo — o
 * chamador so conhece `consume`.
 *
 * O limite e por CHAVE do usuario autenticado, nao por IP: um predio inteiro
 * atras do mesmo IP nao pode gastar a cota de um so (security.md §3).
 */
export function createRateLimiter({ maxRequests, windowSeconds }: RateLimitPolicy): RateLimiter {
  const windowMilliseconds = windowSeconds * MILLISECONDS_PER_SECOND;
  const hits = new Map<string, number[]>();

  return {
    consume(key: string): void {
      const now = Date.now();
      const cutoff = now - windowMilliseconds;
      const recent = (hits.get(key) ?? []).filter((moment) => moment > cutoff);

      if (recent.length >= maxRequests) {
        const oldest = recent[0] ?? now;
        const waitMilliseconds = oldest + windowMilliseconds - now;
        throw new TooManyRequestsError(Math.ceil(waitMilliseconds / MILLISECONDS_PER_SECOND));
      }

      recent.push(now);
      hits.set(key, recent);
    },
  };
}
