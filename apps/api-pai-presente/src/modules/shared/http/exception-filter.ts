/**
 * Pai Presente — API
 * Copyright (c) 2026. Todos os direitos reservados.
 * Licenca: proprietaria.
 */

import { AppError } from '../errors/app.error';
import { ERROR_CODES } from '../errors/codes';
import { createLogger } from '../logger/logger';
import { respondWithError } from './response.util';

export type HandleUncaughtErrorParams = {
  readonly error: unknown;
  readonly method: string;
  readonly path: string;
};

/**
 * Unico lugar que converte erro em resposta (§7). Use case e controller nao
 * capturam; erro desconhecido vira 500 generico, sem stack trace ao cliente.
 */
export function handleUncaughtError({ error, method, path }: HandleUncaughtErrorParams): Response {
  const logger = createLogger(crypto.randomUUID());

  if (error instanceof AppError) {
    if (error.statusCode >= 500) logger.error(error.code, { method, path });
    return respondWithError({
      code: error.code,
      message: error.message,
      statusCode: error.statusCode,
      details: error.details,
    });
  }

  logger.error(ERROR_CODES.shared.INTERNAL_ERROR, {
    method,
    path,
    cause: error instanceof Error ? error.message : 'desconhecido',
  });
  return respondWithError({
    code: ERROR_CODES.shared.INTERNAL_ERROR,
    message: 'Erro interno.',
    statusCode: 500,
    details: [],
  });
}
