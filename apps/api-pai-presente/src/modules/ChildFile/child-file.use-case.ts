/**
 * Pai Presente — API
 * Copyright (c) 2026. Todos os direitos reservados.
 * Licenca: proprietaria.
 */

import { createHash, randomUUID } from 'node:crypto';

import { AUDIT_ACTIONS, AUDIT_TARGET_TYPES } from '../Audit/audit.constant';
import { CHILD_CONSENT_PURPOSES } from '../ChildConsent/child-consent.constant';
import { detectContentType } from '../Media/detect-content-type';
import { decryptMedia, encryptMedia, readMediaKey } from '../Media/media-cipher';
import { DEFAULT_PRESIGN_TTL_SECONDS, MEDIA_OBJECT_ROOT } from '../Media/media.constant';
import { ERROR_CODES } from '../shared/errors/codes';
import { ResourceNotFoundError } from '../shared/errors/shared.error';
import { CHILD_FILE_MAX_BYTES, type ChildFileKind } from '../shared/shared.constant';
import type { ChildFileRow } from './child-file.table';
import {
  CHILD_FILE_ALLOWED_CONTENT_TYPES,
  CHILD_FILE_DELIVERIES,
  isHealthData,
} from './child-file.constant';
import {
  ChildExamConsentMissingError,
  ChildFileCorruptedError,
  ChildFileTooLargeError,
  ChildFileTypeNotAllowedError,
  ChildFileTypeUnknownError,
} from './child-file.error';
import type {
  PurgeChildFilesParams,
  PurgeUserFilesParams,
} from '../shared/child-file-purge.interface';
import type {
  ChildFileContent,
  ChildFileUseCasesParams,
  ChildFileView,
  ListChildFilesParams,
  ListChildFilesView,
  DeleteChildFileParams,
  ReadChildFileContentParams,
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

type SweepParams = {
  readonly rows: readonly ChildFileRow[];
  readonly userId: string;
  readonly clientIp: string;
};

type FindOwnedFileParams = {
  readonly childId: string;
  readonly fileId: string;
  readonly userId: string;
};

export type ChildFileUseCases = {
  upload(params: UploadChildFileParams): Promise<ChildFileView>;
  list(params: ListChildFilesParams): Promise<ListChildFilesView>;
  readContent(params: ReadChildFileContentParams): Promise<ChildFileContent>;
  remove(params: DeleteChildFileParams): Promise<void>;
  purgeByChild(params: PurgeChildFilesParams): Promise<void>;
  purgeByUser(params: PurgeUserFilesParams): Promise<void>;
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
  childConsent,
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

  /**
   * A varredura do balde, numa funcao SO': o filho apagado e a conta apagada
   * fazem exatamente o mesmo servico, e o que os separa e' apenas a consulta
   * que diz quais linhas entram. Duas copias concordariam ate' a primeira
   * edicao (`code-standart.md` §16) — e a edicao que faltasse numa delas
   * deixaria byte de exame no balde.
   *
   * Nao apaga LINHA nenhuma: as linhas saem com a cascata do banco. E' a
   * metade que a cascata nao sabe fazer, porque o Postgres nao conhece o balde.
   */
  async function sweep({ rows, userId, clientIp }: SweepParams): Promise<void> {
    if (rows.length === 0) return;

    /**
     * Apagar byte que nao existe e' sucesso, entao repetir a varredura e'
     * seguro: se o balde cair no meio, o dono continua no banco e as linhas que
     * sobraram ainda nomeiam as chaves que faltam.
     */
    await Promise.all(rows.map((row) => storage.delete(row.objectKey)));

    /**
     * Trilha do EXAME, e nao de cada foto: o art. 46 pergunta o que houve com
     * dado de saude, e um album de trezentas fotos afogaria a resposta em
     * trezentas linhas que ninguem le'.
     */
    const exams = rows.filter((row) => isHealthData(row.kind));
    await Promise.all(
      exams.map((row) =>
        audit.record({
          actorId: userId,
          action: AUDIT_ACTIONS.CHILD_EXAM_DELETED,
          targetType: AUDIT_TARGET_TYPES.CHILD_FILE,
          targetId: row.id,
          clientIp,
        }),
      ),
    );
  }

  /**
   * A busca escopada e' UMA, usada por ler e por apagar. Duas copias da mesma
   * checagem concordam ate' a primeira edicao, e foi assim que L-032 aconteceu.
   */
  async function findOwnedFile({ childId, fileId, userId }: FindOwnedFileParams): Promise<ChildFileRow> {
    await assertChildIsOwned(childId, userId);

    const row = await repository.findById({ fileId, userId });
    /**
     * O arquivo tambem tem de ser DESTE filho. Sem esta comparacao, o caminho
     * de um filho serviria arquivo de outro — o `userId` blindaria contra o pai
     * vizinho, e nao contra a troca de segmento na propria URL.
     */
    if (row === undefined || row.childId !== childId) {
      throw new ResourceNotFoundError(
        ERROR_CODES.childFile.CHILD_FILE_NOT_FOUND,
        'Arquivo nao encontrado.',
      );
    }
    return row;
  }

  return {
    /**
     * Metadado, nunca byte. A lista e' o que a ficha do filho desenha e o que a
     * linha do tempo do `H5.2` consome: mandar conteudo aqui faria o album de
     * um ano baixar dezenas de megabytes para mostrar miniatura, e faria dado
     * de saude atravessar a rede sem que ninguem tenha pedido para LER exame —
     * que e' leitura com trilha propria (`H3.3`).
     *
     * E a lista NAO grava trilha de auditoria. Trilha existe para leitura de
     * dado de saude; carimbar cada abertura da ficha encheria a trilha de
     * linhas que nao contam nada e afogaria a linha que conta.
     */
    async list(params) {
      await assertChildIsOwned(params.childId, params.userId);
      const { items, total } = await repository.listByChild(params);
      return { items: items.map(toChildFileView), total };
    },

    /**
     * Foto sai por LINK assinado; exame sai por BYTES, decifrado por nos.
     *
     * Nao e' economia de banda em um caso e nao no outro: e' que link assinado
     * deixa de ser observavel no instante em que e' emitido. Quem tem a URL le'
     * o objeto direto no balde, sem passar por aqui, e nenhuma dessas leituras
     * aparece em trilha nenhuma. Para foto isso e' aceitavel e desejavel — o
     * album do fim de semana nao pesa no servidor. Para dado de saude de
     * crianca nao e': o art. 46 da LGPD cobra poder responder QUEM viu e QUANDO
     * (`security.md` §10), e so' o caminho que atravessa a API sabe disso.
     *
     * Por isso a decisao e' do `kind`, e nunca do cliente nem do que o balde
     * sabe fazer: um balde que aprendesse a assinar nao passaria a emitir link
     * de exame.
     */
    async readContent({ childId, fileId, userId, clientIp }) {
      const row = await findOwnedFile({ childId, fileId, userId });

      if (!isHealthData(row.kind) && storage.presignRead !== undefined) {
        const url = await storage.presignRead({
          objectKey: row.objectKey,
          ttlSeconds: DEFAULT_PRESIGN_TTL_SECONDS,
        });
        return { delivery: CHILD_FILE_DELIVERIES.LINK, url, ttlSeconds: DEFAULT_PRESIGN_TTL_SECONDS };
      }

      const stored = await storage.get(row.objectKey);
      /**
       * `isEncrypted` da LINHA decide decifrar, e nao `isHealthData` de novo: o
       * dia em que a politica mudar, o arquivo antigo continua sendo o que ele
       * era quando subiu, e e' a linha que sabe disso.
       */
      const bytes = row.isEncrypted
        ? decryptMedia({ envelope: stored, key: readMediaKey(encodedEncryptionKey) })
        : stored;

      if (createHash('sha256').update(bytes).digest('hex') !== row.checksum) {
        throw new ChildFileCorruptedError(fileId);
      }

      /**
       * A trilha vem ANTES de os bytes saírem — o contrario do envio, e de
       * proposito. No envio, trilha antes do fato afirmaria o que nao
       * aconteceu; aqui, bytes antes da trilha seria divulgacao de dado de
       * saude sem registro, que e' exatamente o que a trilha existe para
       * impedir. Falhar a leitura e' recuperavel; a lacuna nao.
       */
      if (isHealthData(row.kind)) {
        await audit.record({
          actorId: userId,
          action: AUDIT_ACTIONS.CHILD_EXAM_READ,
          targetType: AUDIT_TARGET_TYPES.CHILD_FILE,
          targetId: fileId,
          clientIp,
        });
      }

      return { delivery: CHILD_FILE_DELIVERIES.BYTES, bytes, contentType: row.contentType };
    },

    /**
     * BYTE primeiro, linha depois — o contrario do envio, e pelo mesmo motivo.
     *
     * `ON DELETE CASCADE` nao apaga byte nenhum (`D5`): quem apaga so' a linha
     * deixa no balde um objeto que ninguem consegue mais nomear, porque a
     * `objectKey` morreu com ela e a interface de midia nao tem `list()` de
     * proposito. Isso e' dado de saude de crianca sem dono e sem caminho para
     * ser eliminado — a violacao do art. 18 que nao quebra teste nenhum.
     *
     * Falhando entre os dois, sobra linha apontando para nada: ela aparece na
     * listagem e se apaga de novo. Das duas metades possiveis, e' a recuperavel.
     */
    async remove({ childId, fileId, userId, clientIp }) {
      const row = await findOwnedFile({ childId, fileId, userId });

      await storage.delete(row.objectKey);
      await repository.remove({ fileId, userId });

      /**
       * A trilha e' a ULTIMA coisa, como no envio: trilha que afirma um
       * apagamento que nao aconteceu e' pior que trilha nenhuma.
       */
      await audit.record({
        actorId: userId,
        action: isHealthData(row.kind)
          ? AUDIT_ACTIONS.CHILD_EXAM_DELETED
          : AUDIT_ACTIONS.CHILD_PHOTO_DELETED,
        targetType: AUDIT_TARGET_TYPES.CHILD_FILE,
        targetId: fileId,
        clientIp,
      });
    },

    /**
     * Tira do balde tudo o que e' deste filho, e NAO apaga linha: as linhas
     * saem com o filho, pela cascata do banco. E' a metade que a cascata nao
     * sabe fazer — o Postgres nao conhece o balde.
     *
     * Nao ha' `assertChildIsOwned` aqui: o escopo esta na consulta, com o
     * `userId` dentro do `where`. Repetir a checagem seria uma segunda copia da
     * mesma regra (`code-standart.md` §16), e ela responderia 404 de
     * `ChildFile` justamente quando quem chama esta' a um passo de responder o
     * seu proprio.
     */
    async purgeByChild({ childId, userId, clientIp }) {
      await sweep({ rows: await repository.listAllByChild({ childId, userId }), userId, clientIp });
    },

    /**
     * O outro dono da varredura: a conta inteira (LGPD art. 18 VI). Tambem sem
     * checagem de existencia — o `userId` da sessao esta no `where`, entao
     * conta que nao existe varre o proprio nada.
     *
     * Nao e' um laco de `purgeByChild`: uma consulta escopada por dono ja traz
     * o album de todos os filhos, e um laco por filho faria N+1 consultas e
     * ainda perderia o filho criado entre a listagem e a varredura.
     */
    async purgeByUser({ userId, clientIp }) {
      await sweep({ rows: await repository.listByUser({ userId }), userId, clientIp });
    },

    async upload({ childId, userId, kind, bytes, caption, takenOn, clientIp }) {
      await assertChildIsOwned(childId, userId);

      /**
       * O consentimento do art. 14 §1 se checa AQUI: antes do teto de tamanho,
       * antes de olhar os bytes, antes da linha no banco e antes do objeto no
       * balde. Recusar depois de guardar deixaria dado de saude de menor
       * gravado sem base legal, mesmo que por um instante — e nao existe
       * "instante" numa auditoria: o que foi escrito foi tratado.
       *
       * So' o exame passa por aqui. Para a FOTO, o consentimento da conta
       * basta: ela e' o dado que o pai criou do proprio filho, e nao dado de
       * saude sensivel (LGPD art. 11). Exigir consentimento especifico para
       * cada foto transformaria o aviso da lei em ruido, que e' o modo mais
       * eficaz de ninguem ler nenhum.
       */
      if (isHealthData(kind)) {
        const hasConsent = await childConsent.hasConsent({
          childId,
          userId,
          purpose: CHILD_CONSENT_PURPOSES.HEALTH_DATA,
        });
        if (!hasConsent) {
          throw new ChildExamConsentMissingError(CHILD_CONSENT_PURPOSES.HEALTH_DATA);
        }
      }

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
