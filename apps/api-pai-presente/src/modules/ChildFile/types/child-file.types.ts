/**
 * Pai Presente — API
 * Copyright (c) 2026. Todos os direitos reservados.
 * Licenca: proprietaria.
 */

import type { AuditEntry } from '../../Audit/types/audit.types';
import type { MediaStorage } from '../../Media/media-storage.interface';
import type { ChildOwnershipPort } from '../../shared/child-ownership.interface';
import type { ChildFileKind } from '../../shared/shared.constant';
import type { ChildFileRow, NewChildFileRow } from '../child-file.table';

/**
 * `userId` e' OBRIGATORIO em todo parametro de leitura, e e' de proposito que
 * nao exista um `findById(fileId)` sozinho: BOLA (OWASP API1, `security.md` §2)
 * acontece quando a rota autoriza e a consulta esquece de escopar. Sem
 * sobrecarga sem dono, quem escreve consulta nova nao tem como esquecer.
 */
export type FindChildFileParams = {
  readonly fileId: string;
  readonly userId: string;
};

export type ListChildFilesParams = {
  readonly childId: string;
  readonly userId: string;
};

export type ListUserFilesParams = {
  readonly userId: string;
};

export type ChildFileRepository = {
  insert(row: NewChildFileRow): Promise<ChildFileRow>;
  findById(params: FindChildFileParams): Promise<ChildFileRow | undefined>;
  listByChild(params: ListChildFilesParams): Promise<readonly ChildFileRow[]>;
  listByUser(params: ListUserFilesParams): Promise<readonly ChildFileRow[]>;
  /**
   * Devolve a LINHA apagada, nao um booleano: quem apaga precisa da
   * `objectKey` para apagar os bytes no balde depois. Cascata de banco nao
   * apaga byte nenhum, e um `boolean` aqui esconderia isso.
   */
  remove(params: FindChildFileParams): Promise<ChildFileRow | undefined>;
};

/**
 * O que sai numa resposta. Tres colunas ficam de fora, cada uma por um motivo:
 * `objectKey` e' o desenho interno do balde (quem o conhece consegue adivinhar
 * a chave do vizinho), `userId` e' sempre quem esta perguntando, e
 * `isEncrypted` e' contabilidade de rotacao de chave — nao e' assunto do pai.
 */
export type ChildFileView = {
  readonly id: string;
  readonly childId: string;
  readonly kind: string;
  readonly contentType: string;
  readonly byteSize: number;
  readonly checksum: string;
  readonly caption: string | undefined;
  readonly takenOn: string | undefined;
  readonly createdAt: Date;
};

export type UploadChildFileParams = {
  readonly childId: string;
  readonly userId: string;
  readonly kind: ChildFileKind;
  readonly bytes: Uint8Array;
  readonly caption?: string;
  readonly takenOn?: string;
  /** Vai para a trilha, nao para o log (`security.md` §1). */
  readonly clientIp: string;
};

/**
 * A trilha e' PORTA aqui, e nao a chamada direta a `recordAuditEntry`, porque
 * neste caso ela nao pode pegar carona na transacao: a escrita no balde
 * acontece FORA de qualquer transacao do Postgres, e uma trilha que rola junto
 * com o insert diria "guardou" antes de haver byte guardado.
 */
export type ChildFileAuditPort = {
  record(entry: AuditEntry): Promise<void>;
};

export type ChildFileUseCasesParams = {
  readonly repository: ChildFileRepository;
  readonly storage: MediaStorage;
  readonly childOwnership: ChildOwnershipPort;
  readonly audit: ChildFileAuditPort;
  /**
   * A chave chega CODIFICADA e so' e' lida quando um exame aparece. Ler no boot
   * mataria a API inteira por causa de uma chave que so' o exame usa — e o pai
   * que so' quer subir foto nao tem nada com isso.
   */
  readonly encodedEncryptionKey: string;
};
