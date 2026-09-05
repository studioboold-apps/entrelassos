/**
 * Pai Presente — API
 * Copyright (c) 2026. Todos os direitos reservados.
 * Licenca: proprietaria.
 */

import { ERROR_CODES } from '../shared/errors/codes';
import { ResourceNotFoundError } from '../shared/errors/shared.error';
import type {
  AccountExport,
  DeleteUserParams,
  ExportUserParams,
  FindUserParams,
  UpdateUserParams,
  UserRepository,
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

export function createUserUseCases(repository: UserRepository): UserUseCases {
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
     */
    async deleteMe(params: DeleteUserParams): Promise<void> {
      const removed = await repository.deleteById(params);
      if (!removed) userNotFound();
    },

    async exportMe(params: ExportUserParams): Promise<AccountExport> {
      return (await repository.exportAll(params)) ?? userNotFound();
    },
  };
}
