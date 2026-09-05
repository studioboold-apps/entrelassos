/**
 * Pai Presente — API
 * Copyright (c) 2026. Todos os direitos reservados.
 * Licenca: proprietaria.
 */

import { DomainError } from '../shared/errors/app.error';
import { ERROR_CODES } from '../shared/errors/codes';
import { HTTP_STATUS } from '../shared/http/http.constant';

/**
 * A mensagem nao diz POR QUE o token nao serve (expirado, assinatura errada,
 * audiencia de outro app): isso e informacao para quem esta tentando adivinhar.
 */
export class IdentityTokenInvalidError extends DomainError {
  constructor() {
    super({
      code: ERROR_CODES.auth.IDENTITY_TOKEN_INVALID,
      message: 'Login recusado.',
      statusCode: 401,
    });
  }
}

export class RefreshTokenInvalidError extends DomainError {
  constructor() {
    super({
      code: ERROR_CODES.auth.REFRESH_TOKEN_INVALID,
      message: 'Sessao expirada.',
      statusCode: 401,
    });
  }
}

/** Falha de configuracao do servidor, nao erro de quem chamou. */
export class ProviderNotConfiguredError extends DomainError {
  constructor(provider: string) {
    super({
      code: ERROR_CODES.auth.PROVIDER_NOT_CONFIGURED,
      message: `Login por ${provider} indisponivel.`,
      statusCode: HTTP_STATUS.SERVICE_UNAVAILABLE,
    });
  }
}
