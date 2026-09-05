/**
 * Pai Presente — API
 * Copyright (c) 2026. Todos os direitos reservados.
 * Licenca: proprietaria.
 */

import { DomainError } from '../shared/errors/app.error';
import { ERROR_CODES } from '../shared/errors/codes';

const INTERNAL_STATUS = 500;

/**
 * O backup nao tem rota: ele e' job. O `statusCode` existe so porque a hierarquia
 * pede um — nunca lancar `AppError` direto (code-standart.md §7).
 */
export class BackupKeyInvalidError extends DomainError {
  constructor(message: string) {
    super({ code: ERROR_CODES.backup.KEY_INVALID, message, statusCode: INTERNAL_STATUS });
  }
}

export class BackupEnvelopeInvalidError extends DomainError {
  constructor(message: string) {
    super({ code: ERROR_CODES.backup.ENVELOPE_INVALID, message, statusCode: INTERNAL_STATUS });
  }
}
