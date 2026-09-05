/**
 * Pai Presente — API
 * Copyright (c) 2026. Todos os direitos reservados.
 * Licenca: proprietaria.
 */

import { AppError, DomainError, type FieldErrorDetail } from './app.error';
import { ERROR_CODES } from './codes';

export class ValidationError extends AppError {
  constructor(details: readonly FieldErrorDetail[]) {
    super({
      code: ERROR_CODES.shared.VALIDATION_FAILED,
      message: 'Requisicao invalida.',
      statusCode: 400,
      details,
    });
  }
}

export class RouteNotFoundError extends AppError {
  constructor() {
    super({
      code: ERROR_CODES.shared.ROUTE_NOT_FOUND,
      message: 'Rota nao encontrada.',
      statusCode: 404,
    });
  }
}

export class UnauthenticatedError extends AppError {
  constructor() {
    super({
      code: ERROR_CODES.shared.UNAUTHENTICATED,
      message: 'Autenticacao necessaria.',
      statusCode: 401,
    });
  }
}

export class ForbiddenOriginError extends AppError {
  constructor() {
    super({
      code: ERROR_CODES.shared.FORBIDDEN_ORIGIN,
      message: 'Origem nao permitida.',
      statusCode: 403,
    });
  }
}

/** `Retry-After` e obrigatorio no 429 (apis.md § Rate Limiting). */
export class TooManyRequestsError extends AppError {
  constructor(retryAfterSeconds: number) {
    super({
      code: ERROR_CODES.shared.TOO_MANY_REQUESTS,
      message: 'Limite de requisicoes excedido.',
      statusCode: 429,
      responseHeaders: { 'Retry-After': String(retryAfterSeconds) },
    });
  }
}

export class ResourceNotFoundError extends DomainError {
  constructor(code: string, message: string) {
    super({ code, message, statusCode: 404 });
  }
}

export class ResourceNotOwnedError extends DomainError {
  constructor(code: string, message: string) {
    super({ code, message, statusCode: 403 });
  }
}
