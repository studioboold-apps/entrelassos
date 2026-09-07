/**
 * Pai Presente — API
 * Copyright (c) 2026. Todos os direitos reservados.
 * Licenca: proprietaria.
 */

import { createHash, randomUUID } from 'node:crypto';

import { AUDIT_ACTIONS, AUDIT_TARGET_TYPES } from '../Audit/audit.constant';
import { detectContentType } from '../Media/detect-content-type';
import { encryptMedia, readMediaKey } from '../Media/media-cipher';
import { MEDIA_OBJECT_ROOT } from '../Media/media.constant';
import { ERROR_CODES } from '../shared/errors/codes';
import { ResourceNotFoundError } from '../shared/errors/shared.error';
import { CHILD_FILE_MAX_BYTES, type ChildFileKind } from '../shared/shared.constant';
import type { ChildFileRow } from './child-file.table';
import {
  CHILD_FILE_ALLOWED_CONTENT_TYPES,
  isHealthData,
} from './child-file.constant';
import {
  ChildFileTooLargeError,
  ChildFileTypeNotAllowedError,
  ChildFileTypeUnknownError,
} from './child-file.error';
import type {
  ChildFileUseCasesParams,
  ChildFileView,
  UploadChildFileParams,
} from './types/child-file.types';

/**
 * `null` do banco vira `undefined` na resposta: `exactOptionalPropertyTypes`
 * esta ligado, e misturar os dois faria a ausencia ter dois nomes.
 */
export function toChildFileView(row: ChildFileRow): ChildFileView {
  return {
    id: row.id,
    childId: row.childId,
    kind: row.kind,
    contentType: row.contentType,
    byteSize: row.byteSize,
    checksum: row.checksum,
    caption: row.caption ?? undefined,
    takenOn: row.takenOn ?? undefined,
    createdAt: row.createdAt,
  };
}

export type ChildFileUseCases = {
  upload(params: UploadChildFileParams): Promise<ChildFileView>;
};

/**
 * Os bytes se identificam sozinhos. Nem a extensao nem o `content-type` da
 * parte multipart entram nesta decisao: os dois sao texto escrito pelo cliente.
 */
function readContentType(bytes: Uint8Array, kind: ChildFileKind): string {
  const contentType = detectContentType(bytes);
  if (contentType === undefined) throw new ChildFileTypeUnknownError();
  if (!CHILD_FILE_ALLOWED_CONTENT_TYPES[kind].includes(contentType)) {
    throw new ChildFileTypeNotAllowedError({ kind, contentType });
  }
  return contentType;
}

export function createChildFileUseCases({
  repository,
  storage,
  childOwnership,
  audit,
  encodedEncryptionKey,
}: ChildFileUseCasesParams): ChildFileUseCases {
  /**
   * 404, e nao 403, quando o filho do CAMINHO nao e' deste pai — e a resposta e'
   * byte a byte a que o modulo `Child` da'. O `childId` aqui e' segmento de
   * URL, que e' justo o que um atacante enumera: um 403 confirmaria que o filho
   * de outro pai existe, e "existe, mas nao e' seu" ja e' informacao demais.
   *
   * (`Activity` responde 403 no mesmo caso porque la' o `childId` vem no CORPO,
   * como valor que o pai escolheu entre os proprios filhos.)
   */
  async function assertChildIsOwned(childId: string, userId: string): Promise<void> {
    const isOwned = await childOwnership.isOwnedByUser({ childId, userId });
    if (isOwned) return;
    throw new ResourceNotFoundError(ERROR_CODES.child.CHILD_NOT_FOUND, 'Filho nao encontrado.');
  }

  return {
    async upload({ childId, userId, kind, bytes, caption, takenOn, clientIp }) {
      await assertChildIsOwned(childId, userId);

      if (bytes.byteLength > CHILD_FILE_MAX_BYTES) {
        throw new ChildFileTooLargeError(bytes.byteLength);
      }

      const contentType = readContentType(bytes, kind);
      /** Do texto CLARO, sempre: e' o que permite dizer que o que voltou e' o que subiu. */
      const checksum = createHash('sha256').update(bytes).digest('hex');

      /**
       * A chave se le' AQUI, antes de qualquer escrita, e so' quando ha exame:
       * sem ela o 503 sai com o banco e o balde intactos, e a foto continua
       * subindo numa instalacao que nunca configurou chave nenhuma.
       */
      const isEncrypted = isHealthData(kind);
      const storedBytes = isEncrypted
        ? encryptMedia({ plaintext: bytes, key: readMediaKey(encodedEncryptionKey) })
        : bytes;

      const fileId = randomUUID();
      const objectKey = `${MEDIA_OBJECT_ROOT}/${childId}/${fileId}`;

      /**
       * LINHA primeiro, byte depois. Byte orfao e' invisivel para sempre — a
       * interface de midia nao tem `list()` de proposito —, e seria dado de
       * saude de crianca sem dono e sem caminho para ser apagado. Linha orfa,
       * ao contrario, aparece na listagem e se apaga.
       */
      const created = await repository.insert({
        id: fileId,
        userId,
        childId,
        kind,
        objectKey,
        contentType,
        byteSize: bytes.byteLength,
        checksum,
        isEncrypted,
        ...(caption !== undefined ? { caption } : {}),
        ...(takenOn !== undefined ? { takenOn } : {}),
      });

      try {
        await storage.put({ objectKey, bytes: storedBytes, contentType });
      } catch (failure) {
        /** Limpeza de recurso — o unico catch que a §7 do `code-standart.md` permite. */
        await repository.remove({ fileId, userId });
        throw failure;
      }

      /**
       * A trilha e' a ULTIMA coisa. Trilha a que falta uma linha e' uma lacuna;
       * trilha que afirma o que nao aconteceu e' pior que trilha nenhuma.
       */
      await audit.record({
        actorId: userId,
        action: isEncrypted ? AUDIT_ACTIONS.CHILD_EXAM_UPLOADED : AUDIT_ACTIONS.CHILD_PHOTO_UPLOADED,
        targetType: AUDIT_TARGET_TYPES.CHILD_FILE,
        targetId: fileId,
        clientIp,
      });

      return toChildFileView(created);
    },
  };
}
