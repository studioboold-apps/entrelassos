/**
 * Pai Presente — API
 * Copyright (c) 2026. Todos os direitos reservados.
 * Licenca: proprietaria.
 */

import { DomainError } from '../shared/errors/app.error';
import { ERROR_CODES } from '../shared/errors/codes';

/**
 * 503, e nao 500: a chave ausente e' configuracao do servidor, nao erro do pai.
 * O mesmo desenho do `AI_NOT_CONFIGURED` — a API sobe sem a chave (senao a
 * migration e a rota de saude morreriam por falta dela) e recusa em VOZ ALTA na
 * hora em que alguem tenta guardar um exame.
 */
export class MediaKeyInvalidError extends DomainError {
  constructor(message: string) {
    super({ code: ERROR_CODES.media.KEY_INVALID, message, statusCode: 503 });
  }
}

/**
 * 500 porque nao ha nada que o pai possa fazer: os bytes no balde nao abrem com
 * a chave que temos. Etiqueta que nao confere e' byte trocado, e devolver o
 * conteudo "quase certo" de um exame seria pior que recusar.
 */
export class MediaEnvelopeInvalidError extends DomainError {
  constructor(message: string) {
    super({ code: ERROR_CODES.media.ENVELOPE_INVALID, message, statusCode: 500 });
  }
}
