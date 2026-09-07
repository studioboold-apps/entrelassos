/**
 * Pai Presente — API
 * Copyright (c) 2026. Todos os direitos reservados.
 * Licenca: proprietaria.
 */

import { DomainError } from '../shared/errors/app.error';
import { ERROR_CODES } from '../shared/errors/codes';
import { HTTP_STATUS } from '../shared/http/http.constant';
import { CHILD_FILE_MAX_BYTES } from '../shared/shared.constant';
import {
  CHILD_FILE_QUOTA_SCOPES,
  formatByteCeiling,
  type ChildFileQuotaScope,
} from './child-file.constant';

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
 *
 * Sem `details`: o front prefere a LISTA DE CAMPOS a' mensagem, entao um
 * `{field: 'file'}` aqui trocava a frase que diz o teto por um "Confira: file."
 * — e `file` nem tem rotulo no mapa de nomes. Nao ha' campo a corrigir; o
 * tamanho do arquivo nao e' coisa que se digite no formulario.
 */
export class ChildFileTooLargeError extends DomainError {
  constructor(byteSize: number) {
    super({
      code: ERROR_CODES.childFile.CHILD_FILE_TOO_LARGE,
      message: `Arquivo grande demais: ${formatByteCeiling(byteSize)}. O limite e' de ${formatByteCeiling(CHILD_FILE_MAX_BYTES)}.`,
      statusCode: 413,
    });
  }
}

/**
 * O codigo e' um POR ESCOPO, e nao um so' com o escopo dentro da mensagem: a
 * tela diz coisas diferentes para "o album deste filho encheu" e "sua conta
 * encheu", e com um codigo unico ela teria de ler a frase para decidir — ou
 * seja, tratar texto de humano como contrato de maquina.
 */
const QUOTA_CODES = {
  [CHILD_FILE_QUOTA_SCOPES.CHILD]: ERROR_CODES.childFile.CHILD_FILE_CHILD_QUOTA_EXCEEDED,
  [CHILD_FILE_QUOTA_SCOPES.ACCOUNT]: ERROR_CODES.childFile.CHILD_FILE_ACCOUNT_QUOTA_EXCEEDED,
} as const;

const QUOTA_SUBJECTS = {
  [CHILD_FILE_QUOTA_SCOPES.CHILD]: 'O album deste filho',
  [CHILD_FILE_QUOTA_SCOPES.ACCOUNT]: 'Sua conta',
} as const;

type ChildFileQuotaExceededParams = {
  readonly scope: ChildFileQuotaScope;
  readonly quotaBytes: number;
  readonly usedBytes: number;
};

/**
 * 413 tambem aqui, e nao 507: 5xx diz "foi culpa nossa, tente de novo", e cota
 * cheia e' deliberada — repetir nunca resolve. Nem 403, que diz "voce nao pode
 * isto", quando o que falta e' espaco.
 *
 * Sem `details`: o `describeApiFailure` do front prefere a lista de campos a'
 * mensagem, entao um `{field: 'file'}` aqui trocaria a frase que EXPLICA por um
 * "Confira: file." — e nao ha campo errado nenhum. O arquivo esta' certo; o
 * album e' que nao tem mais lugar.
 */
export class ChildFileQuotaExceededError extends DomainError {
  constructor({ scope, quotaBytes, usedBytes }: ChildFileQuotaExceededParams) {
    super({
      code: QUOTA_CODES[scope],
      message: `${QUOTA_SUBJECTS[scope]} chegou ao limite de ${formatByteCeiling(quotaBytes)}. Em uso: ${formatByteCeiling(usedBytes)}. Apague algo para abrir espaco.`,
      statusCode: 413,
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

/**
 * 403 e nao 400: o pedido esta bem formado, os bytes sao um PDF de verdade, e o
 * que falta nao e' dado — e' AUTORIZACAO LEGAL. O art. 14 §1 da LGPD exige
 * consentimento especifico e em destaque de um dos pais para tratar dado de
 * crianca, e exame e' dado de saude (art. 11).
 *
 * A recusa acontece ANTES do primeiro byte chegar ao balde. Aceitar e recusar
 * depois deixaria dado de saude de menor guardado sem base legal, ainda que por
 * um instante — e um instante de dado sensivel sem base legal e' exatamente o
 * que o artigo proibe.
 *
 * O codigo e' estavel porque a TELA depende dele: e' por ele que `H5.3` sabe
 * mostrar o aviso de consentimento em vez de "nao foi possivel enviar".
 */
export class ChildExamConsentMissingError extends DomainError {
  constructor(purpose: string) {
    super({
      code: ERROR_CODES.childFile.CHILD_EXAM_CONSENT_MISSING,
      message: 'Antes do primeiro exame, registre o consentimento para dados de saude.',
      statusCode: HTTP_STATUS.FORBIDDEN,
      details: [{ field: 'consent', message: purpose }],
    });
  }
}
