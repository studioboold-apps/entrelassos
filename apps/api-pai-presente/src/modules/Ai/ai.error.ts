/**
 * Pai Presente — API
 * Copyright (c) 2026. Todos os direitos reservados.
 * Licenca: proprietaria.
 */

import { DomainError } from '../shared/errors/app.error';
import { ERROR_CODES } from '../shared/errors/codes';

/** 502 e nao 500: quem falhou foi o terceiro, e o cliente pode tentar de novo. */
export class LlmProviderFailedError extends DomainError {
  constructor() {
    super({
      code: ERROR_CODES.ai.PROVIDER_FAILED,
      message: 'O provedor de IA nao respondeu.',
      statusCode: 502,
    });
  }
}

/** Saida fora do formato pedido e falha do provedor, nao do usuario. */
export class LlmResponseInvalidError extends DomainError {
  constructor() {
    super({
      code: ERROR_CODES.ai.RESPONSE_INVALID,
      message: 'A resposta do provedor de IA veio fora do formato.',
      statusCode: 502,
    });
  }
}

/** Sem filho cadastrado nao ha o que personalizar — e nao se gasta a chamada. */
export class NoChildrenRegisteredError extends DomainError {
  constructor() {
    super({
      code: ERROR_CODES.ai.NO_CHILDREN,
      message: 'Cadastre ao menos um filho antes de pedir sugestoes.',
      statusCode: 422,
    });
  }
}
