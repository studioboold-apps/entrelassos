/**
 * Pai Presente — API
 * Copyright (c) 2026. Todos os direitos reservados.
 * Licenca: proprietaria.
 */

import { DomainError } from '../shared/errors/app.error';
import { ERROR_CODES } from '../shared/errors/codes';
import { MEDIA_DIRECTORY_VARIABLE } from './media.constant';

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

/**
 * 503 pelo mesmo motivo da chave: pasta sem escrita e' configuracao do
 * servidor, e nao ha nada que o pai possa fazer tentando de novo.
 *
 * Medido em producao: a imagem roda com `WORKDIR /app` e usuario sem escrita
 * ali, e `MEDIA_DIRECTORY` valia o padrao relativo `.media`. A subida
 * respondia `500 INTERNAL_ERROR` e a causa (`EACCES ... mkdir '/app/.media'`)
 * so existia no log do servidor — invisivel para quem opera pelo cliente.
 */
export class MediaDirectoryNotWritableError extends DomainError {
  constructor(directory: string) {
    super({
      code: ERROR_CODES.media.DIRECTORY_NOT_WRITABLE,
      message: `Sem permissao de escrita em ${directory}. Aponte ${MEDIA_DIRECTORY_VARIABLE} para uma pasta gravavel.`,
      statusCode: 503,
    });
  }
}
