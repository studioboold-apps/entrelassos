/**
 * Pai Presente — API
 * Copyright (c) 2026. Todos os direitos reservados.
 * Licenca: proprietaria.
 */

import { HTTP_STATUS } from '../http/http.constant';
import { respondWithData } from '../http/response.util';

export const HEALTH_STATUS = { OK: 'ok', DEGRADED: 'degradado' } as const;
export type HealthStatus = (typeof HEALTH_STATUS)[keyof typeof HEALTH_STATUS];

export const DATABASE_HEALTH = { OK: 'ok', UNREACHABLE: 'inacessivel' } as const;
export type DatabaseHealth = (typeof DATABASE_HEALTH)[keyof typeof DATABASE_HEALTH];

export type CheckHealthParams = {
  readonly pingDatabase: () => Promise<unknown>;
};

export type CheckHealthResult = {
  readonly status: HealthStatus;
  readonly database: DatabaseHealth;
};

/**
 * A saude PERGUNTA ao banco. Sem isso ela responde por si mesma, e uma API que
 * subiu sem conseguir conectar continua dizendo `ok` — foi o que aconteceu na
 * primeira fumaca das imagens: contêiner saudavel, banco inalcancavel, e o
 * provedor promoveria o deploy assim mesmo.
 *
 * O erro e' engolido de proposito (`code-standart.md` §7, fallback gracioso):
 * o que ele diz — endereco, usuario, driver — e' topologia, e topologia nao sai
 * em resposta publica (`security.md` §1).
 */
export async function checkHealth({ pingDatabase }: CheckHealthParams): Promise<CheckHealthResult> {
  try {
    await pingDatabase();
    return { status: HEALTH_STATUS.OK, database: DATABASE_HEALTH.OK };
  } catch {
    return { status: HEALTH_STATUS.DEGRADED, database: DATABASE_HEALTH.UNREACHABLE };
  }
}

export function respondWithHealth(result: CheckHealthResult): Response {
  const statusCode =
    result.status === HEALTH_STATUS.OK ? HTTP_STATUS.OK : HTTP_STATUS.SERVICE_UNAVAILABLE;

  return respondWithData(result, statusCode);
}
