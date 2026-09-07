/**
 * Pai Presente — API
 * Copyright (c) 2026. Todos os direitos reservados.
 * Licenca: proprietaria.
 */

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
