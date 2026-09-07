/**
 * Pai Presente — API
 * Copyright (c) 2026. Todos os direitos reservados.
 * Licenca: proprietaria.
 */

import { ERROR_CODES } from '../shared/errors/codes';
import { ResourceNotFoundError } from '../shared/errors/shared.error';
import type {
  AccountExport,
  CreateUserUseCasesParams,
  DeleteUserParams,
  ExportUserParams,
  FindUserParams,
  UpdateUserParams,
} from './types/user.types';
import type { UserRow } from './user.table';

export type UserUseCases = {
  findMe(params: FindUserParams): Promise<UserRow>;
  updateMe(params: UpdateUserParams): Promise<UserRow>;
  deleteMe(params: DeleteUserParams): Promise<void>;
  exportMe(params: ExportUserParams): Promise<AccountExport>;
};

function userNotFound(): never {
  throw new ResourceNotFoundError(
    ERROR_CODES.user.USER_NOT_FOUND,
    'Usuario nao encontrado.',
  );
}

export function createUserUseCases({ repository, childFiles }: CreateUserUseCasesParams): UserUseCases {
  return {
    async findMe(params: FindUserParams): Promise<UserRow> {
      return (await repository.findById(params)) ?? userNotFound();
    },

    async updateMe(params: UpdateUserParams): Promise<UserRow> {
      return (await repository.update(params)) ?? userNotFound();
    },

    /**
     * Apagar duas vezes responde 404 na segunda. `DELETE` e idempotente no
     * EFEITO (a conta segue inexistente), mas responder 204 para uma conta que
     * nunca existiu esconderia id trocado — e o titular acharia que apagou.
     *
     * Os BYTES saem antes da linha, e nao depois: `ON DELETE CASCADE` apaga
     * linha e nao apaga byte, e `MediaStorage` nao tem `list()` de proposito —
     * quem sabe quais arquivos existem e' o Postgres. Objeto cuja linha a
     * cascata levou e' objeto que ninguem consegue mais nomear para apagar, e
     * eliminacao (art. 18 VI) com exame de crianca no balde nao e' eliminacao.
     *
     * Nesta ordem, a metade que sobra e' a recuperavel: se o balde cair, a
     * conta continua no banco e as linhas ainda nomeiam as chaves que faltam.
     *
     * A varredura roda ANTES de saber se a conta existe, e de proposito: ela e'
     * escopada pelo `userId` da sessao, entao conta inexistente varre o proprio
     * nada. Checar antes seria uma segunda copia da regra que o repositorio ja
     * aplica no `where`.
     */
    async deleteMe({ userId, clientIp }: DeleteUserParams): Promise<void> {
      await childFiles.purgeByUser({ userId, clientIp });

      const removed = await repository.deleteById({ userId, clientIp });
      if (!removed) userNotFound();
    },

    async exportMe(params: ExportUserParams): Promise<AccountExport> {
      return (await repository.exportAll(params)) ?? userNotFound();
    },
  };
}
