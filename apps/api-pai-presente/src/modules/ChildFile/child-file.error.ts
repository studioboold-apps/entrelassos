/**
 * Pai Presente — API
 * Copyright (c) 2026. Todos os direitos reservados.
 * Licenca: proprietaria.
 */

import { DomainError } from '../shared/errors/app.error';
import { ERROR_CODES } from '../shared/errors/codes';
import { CHILD_FILE_MAX_BYTES } from '../shared/shared.constant';

/** Formulario chegou, arquivo nao. E' erro de quem enviou: 400. */
export class ChildFileMissingError extends DomainError {
  constructor() {
    super({
      code: ERROR_CODES.childFile.CHILD_FILE_MISSING,
      message: 'Envie o arquivo no campo "file".',
      statusCode: 400,
    });
  }
}

/**
 * 413, e nao 400: o codigo do HTTP para "grande demais" existe, e o cliente que
 * ve 413 sabe que o pedido em si estava certo — o que sobrou foi tamanho.
 */
export class ChildFileTooLargeError extends DomainError {
  constructor(byteSize: number) {
    super({
      code: ERROR_CODES.childFile.CHILD_FILE_TOO_LARGE,
      message: `Arquivo grande demais. O limite e' de ${Math.floor(CHILD_FILE_MAX_BYTES / 1024 / 1024)} MB.`,
      statusCode: 413,
      details: [{ field: 'file', message: `Recebido ${byteSize} bytes.` }],
    });
  }
}

/**
 * 415 porque os BYTES nao disseram que tipo sao. Nao existe recusa "por
 * extensao" neste produto: extensao e `content-type` da parte multipart sao
 * texto escrito pelo cliente, e um `.jpg` com script dentro passaria nos dois.
 */
export class ChildFileTypeUnknownError extends DomainError {
  constructor() {
    super({
      code: ERROR_CODES.childFile.CHILD_FILE_TYPE_UNKNOWN,
      message: 'Nao reconhecemos este arquivo. Envie foto (JPEG, PNG, WEBP, HEIC) ou PDF.',
      statusCode: 415,
    });
  }
}

/**
 * O que voltou do balde nao e' o que subiu. 500 porque o pedido estava certo e
 * a culpa e' nossa — e recusar e' obrigatorio: entregar exame corrompido como se
 * fosse o laudo do filho e' pior que nao entregar nada, porque ninguem
 * desconfia de um numero errado num papel que abriu normalmente.
 *
 * O `checksum` foi guardado no envio para esta pergunta existir; sem a
 * conferencia na leitura, ele seria coluna decorativa.
 */
export class ChildFileCorruptedError extends DomainError {
  constructor(fileId: string) {
    super({
      code: ERROR_CODES.childFile.CHILD_FILE_CORRUPTED,
      message: 'Nao conseguimos abrir este arquivo com seguranca. Tente enviar de novo.',
      statusCode: 500,
      details: [{ field: 'fileId', message: fileId }],
    });
  }
}

/** Os bytes se identificaram, e o tipo nao serve para este registro. */
export class ChildFileTypeNotAllowedError extends DomainError {
  constructor(params: { readonly kind: string; readonly contentType: string }) {
    super({
      code: ERROR_CODES.childFile.CHILD_FILE_TYPE_NOT_ALLOWED,
      message: `Este arquivo (${params.contentType}) nao serve como ${params.kind}.`,
      statusCode: 415,
    });
  }
}
