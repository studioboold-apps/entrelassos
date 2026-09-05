/**
 * Pai Presente — API
 * Copyright (c) 2026. Todos os direitos reservados.
 * Licenca: proprietaria.
 */

import { ERROR_CODES } from '../shared/errors/codes';
import { ResourceNotFoundError } from '../shared/errors/shared.error';
import type { FindUserParams, UpdateUserParams, UserRepository } from './types/user.types';
import type { UserRow } from './user.table';

export type UserUseCases = {
  findMe(params: FindUserParams): Promise<UserRow>;
  updateMe(params: UpdateUserParams): Promise<UserRow>;
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
  };
}
